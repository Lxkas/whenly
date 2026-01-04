"use client";

import { useCallback, useRef, useEffect } from "react";
import { formatTime } from "@/lib/date-utils";
import { useSelectionStore } from "@/stores/selection-store";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { AvailabilityBlock as AvailabilityBlockType } from "@/types";

// helper to get clientY from mouse or touch event
function getClientY(e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent): number {
	if ("touches" in e) {
		return e.touches[0]?.clientY ?? e.changedTouches[0]?.clientY ?? 0;
	}
	return e.clientY;
}

// long press duration in ms for mobile edit trigger
const LONG_PRESS_DURATION = 500;

interface AvailabilityBlockProps {
	block: AvailabilityBlockType;
	startHour: number;
	totalHours: number;
	hourHeight: number;
	style?: { left: string; width: string };
	isPending?: boolean;
	isOwn?: boolean;
	isEditing?: boolean;
	editedBlock?: { start: Date; end: Date } | null;
}

export function AvailabilityBlock({
	block,
	startHour,
	totalHours,
	hourHeight,
	style,
	isPending,
	isOwn,
	isEditing,
	editedBlock
}: AvailabilityBlockProps) {
	const { startEditBlock, openEditDialog, cancelEditBlock, editMode } = useSelectionStore();
	const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);

	// cleanup long press timer on unmount
	useEffect(() => {
		return () => {
			if (longPressTimerRef.current) {
				clearTimeout(longPressTimerRef.current);
			}
		};
	}, []);

	// use edited values if editing, otherwise use original
	const displayStart = isEditing && editedBlock ? editedBlock.start : block.start;
	const displayEnd = isEditing && editedBlock ? editedBlock.end : block.end;

	// calculate position
	const startMinutes = displayStart.getHours() * 60 + displayStart.getMinutes();
	const endMinutes = displayEnd.getHours() * 60 + displayEnd.getMinutes();
	const dayStartMinutes = startHour * 60;
	const totalMinutes = totalHours * 60;

	const top = ((startMinutes - dayStartMinutes) / totalMinutes) * (totalHours * hourHeight);
	const height = ((endMinutes - startMinutes) / totalMinutes) * (totalHours * hourHeight);

	const blockStyle = {
		top: `${top}px`,
		height: `${Math.max(height, 20)}px`,
		left: style?.left || "0%",
		width: style?.width || "100%",
		backgroundColor: isPending ? "rgba(59, 130, 246, 0.5)" : `${block.participantColor}40`
	};

	const clearLongPress = useCallback(() => {
		if (longPressTimerRef.current) {
			clearTimeout(longPressTimerRef.current);
			longPressTimerRef.current = null;
		}
	}, []);

	const handlePointerDown = useCallback(
		(e: React.MouseEvent | React.TouchEvent) => {
			if (!isOwn || isPending) return;
			e.stopPropagation();
			e.preventDefault();

			const clientY = getClientY(e);

			// for touch, set up long-press detection
			if ("touches" in e) {
				const touch = e.touches[0];
				touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };

				longPressTimerRef.current = setTimeout(() => {
					// long press detected, open edit dialog
					cancelEditBlock();
					openEditDialog(block.id, block.start, block.end);
					longPressTimerRef.current = null;
				}, LONG_PRESS_DURATION);
			}

			startEditBlock(block.id, { start: block.start, end: block.end }, "move", clientY);
		},
		[isOwn, isPending, block.id, block.start, block.end, startEditBlock, cancelEditBlock, openEditDialog]
	);

	const handlePointerMove = useCallback(
		(e: React.TouchEvent) => {
			// if user moves significantly, cancel long press
			if (touchStartPosRef.current && "touches" in e) {
				const touch = e.touches[0];
				const dx = touch.clientX - touchStartPosRef.current.x;
				const dy = touch.clientY - touchStartPosRef.current.y;
				if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
					clearLongPress();
				}
			}
		},
		[clearLongPress]
	);

	const handlePointerEnd = useCallback(() => {
		clearLongPress();
		touchStartPosRef.current = null;
	}, [clearLongPress]);

	const handleResizeTopDown = useCallback(
		(e: React.MouseEvent | React.TouchEvent) => {
			if (!isOwn || isPending) return;
			e.stopPropagation();
			e.preventDefault();
			clearLongPress();
			const clientY = getClientY(e);
			startEditBlock(block.id, { start: block.start, end: block.end }, "resize-top", clientY);
		},
		[isOwn, isPending, block.id, block.start, block.end, startEditBlock, clearLongPress]
	);

	const handleResizeBottomDown = useCallback(
		(e: React.MouseEvent | React.TouchEvent) => {
			if (!isOwn || isPending) return;
			e.stopPropagation();
			e.preventDefault();
			clearLongPress();
			const clientY = getClientY(e);
			startEditBlock(block.id, { start: block.start, end: block.end }, "resize-bottom", clientY);
		},
		[isOwn, isPending, block.id, block.start, block.end, startEditBlock, clearLongPress]
	);

	const handleDoubleClick = useCallback(
		(e: React.MouseEvent) => {
			if (!isOwn || isPending) return;
			e.stopPropagation();
			e.preventDefault();
			// cancel any in-progress editing before opening dialog
			cancelEditBlock();
			openEditDialog(block.id, block.start, block.end);
		},
		[isOwn, isPending, block.id, block.start, block.end, openEditDialog, cancelEditBlock]
	);

	const content = (
		<div
			className={cn(
				"absolute overflow-hidden rounded-sm text-xs",
				"border-l-2 transition-opacity",
				isPending && "animate-pulse border-dashed",
				isOwn && !isPending && "cursor-move",
				isEditing && "ring-primary z-10 ring-2",
				// prevent scrolling during drag on touch devices
				editMode && "touch-none"
			)}
			style={{
				...blockStyle,
				borderLeftColor: block.participantColor
			}}
			onMouseDown={handlePointerDown}
			onTouchStart={handlePointerDown}
			onTouchMove={handlePointerMove}
			onTouchEnd={handlePointerEnd}
			onTouchCancel={handlePointerEnd}
			onDoubleClick={handleDoubleClick}
		>
			{/* resize handle top - larger hit area for touch (12px) */}
			{isOwn && !isPending && (
				<div
					className="hover:bg-primary/20 active:bg-primary/30 absolute top-0 right-0 left-0 h-3 cursor-n-resize transition-colors"
					onMouseDown={handleResizeTopDown}
					onTouchStart={handleResizeTopDown}
				/>
			)}

			{/* content - offset for resize handles */}
			<div className="pointer-events-none px-1 py-3">
				<div className="truncate font-medium" style={{ color: block.participantColor }}>
					{block.participantName}
				</div>
				{height > 40 && (
					<div className="text-muted-foreground text-[10px]">
						{formatTime(displayStart)} - {formatTime(displayEnd)}
					</div>
				)}
			</div>

			{/* resize handle bottom - larger hit area for touch (12px) */}
			{isOwn && !isPending && (
				<div
					className="hover:bg-primary/20 active:bg-primary/30 absolute right-0 bottom-0 left-0 h-3 cursor-s-resize transition-colors"
					onMouseDown={handleResizeBottomDown}
					onTouchStart={handleResizeBottomDown}
				/>
			)}
		</div>
	);

	// always use the same DOM structure to preserve double-click detection
	// disable tooltip when editing or pending to avoid interference
	const showTooltip = !isPending && !isEditing;

	return (
		<TooltipProvider>
			<Tooltip open={showTooltip ? undefined : false}>
				<TooltipTrigger asChild>{content}</TooltipTrigger>
				<TooltipContent>
					<p className="font-medium">{block.participantName}</p>
					<p className="text-muted-foreground text-xs">
						{formatTime(displayStart)} - {formatTime(displayEnd)}
					</p>
					{isOwn && <p className="text-muted-foreground mt-1 text-xs">Double-click to edit times</p>}
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}
