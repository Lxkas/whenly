"use client";

import { useCallback, useRef } from "react";
import { useCalendarStore } from "@/stores/calendar-store";
import { getDayNumber, isSameDay } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import type { Participant } from "@/lib/supabase/types";

// long press duration in ms for opening day view on mobile
const LONG_PRESS_DURATION = 500;
// minimum movement in pixels to trigger drag mode (vs tap)
const DRAG_THRESHOLD = 15;

interface MonthDayCellProps {
	date: Date;
	isCurrentMonth: boolean;
	isValid: boolean;
	availableParticipants: Participant[];
	totalParticipants: number;
}

export function MonthDayCell({
	date,
	isCurrentMonth,
	isValid,
	availableParticipants,
	totalParticipants
}: MonthDayCellProps) {
	const {
		openDay,
		startDayDrag,
		updateDayDrag,
		isDraggingDays,
		selectedDays,
		toggleDaySelection,
		markTouchEvent,
		shouldIgnoreMouseEvent
	} = useCalendarStore();
	const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);
	// tracks whether we've moved enough to consider this a drag (not a tap)
	const isDragActiveRef = useRef(false);
	// tracks if long-press triggered (opened day view)
	const longPressTriggeredRef = useRef(false);

	const isToday = isSameDay(date, new Date());
	const dayNumber = getDayNumber(date);
	const hasAvailability = availableParticipants.length > 0;
	const isSelected = selectedDays.some((d) => isSameDay(d, date));

	// calculate intensity based on how many participants are available
	const intensity = totalParticipants > 0 ? availableParticipants.length / totalParticipants : 0;

	const clearLongPress = useCallback(() => {
		if (longPressTimerRef.current) {
			clearTimeout(longPressTimerRef.current);
			longPressTimerRef.current = null;
		}
	}, []);

	const handleDoubleClick = useCallback(
		(e: React.MouseEvent) => {
			// ignore synthetic double-click from touch (use long-press instead)
			if (shouldIgnoreMouseEvent()) return;
			if (!isValid) return;
			e.preventDefault();
			e.stopPropagation();
			openDay(date);
		},
		[isValid, date, openDay, shouldIgnoreMouseEvent]
	);

	const handleMouseDown = useCallback(
		(e: React.MouseEvent) => {
			// ignore synthetic mouse events after touch
			if (shouldIgnoreMouseEvent()) return;
			if (!isValid || e.button !== 0) return;
			e.preventDefault();
			startDayDrag(date);
		},
		[isValid, date, startDayDrag, shouldIgnoreMouseEvent]
	);

	const handleTouchStart = useCallback(
		(e: React.TouchEvent) => {
			if (!isValid) return;
			e.preventDefault();

			const touch = e.touches[0];
			touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
			isDragActiveRef.current = false;
			longPressTriggeredRef.current = false;

			// set up long-press detection to open day view
			longPressTimerRef.current = setTimeout(() => {
				longPressTriggeredRef.current = true;
				openDay(date);
				longPressTimerRef.current = null;
			}, LONG_PRESS_DURATION);

			// start drag tracking (for potential multi-day selection)
			startDayDrag(date);
		},
		[isValid, date, startDayDrag, openDay]
	);

	const handleTouchMove = useCallback(
		(e: React.TouchEvent) => {
			if (!isValid) return;

			const touch = e.touches[0];

			// check if user has moved enough to consider this a drag
			if (touchStartPosRef.current && !isDragActiveRef.current) {
				const dx = touch.clientX - touchStartPosRef.current.x;
				const dy = touch.clientY - touchStartPosRef.current.y;
				if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
					// user moved enough - this is now a drag, not a tap
					isDragActiveRef.current = true;
					clearLongPress();
				}
			}

			// only update drag selection if we've confirmed this is a drag gesture
			if (!isDragActiveRef.current) return;

			// find which day cell we're over using elementFromPoint
			const element = document.elementFromPoint(touch.clientX, touch.clientY);
			const dayCell = element?.closest("[data-date]");
			if (dayCell) {
				const dateStr = dayCell.getAttribute("data-date");
				if (dateStr) {
					const targetDate = new Date(dateStr);
					updateDayDrag(targetDate);
				}
			}
		},
		[isValid, updateDayDrag, clearLongPress]
	);

	const handleTouchEnd = useCallback(
		(e: React.TouchEvent) => {
			if (!isValid) return;

			clearLongPress();
			// mark touch event to prevent synthetic mouse events from interfering
			markTouchEvent();

			const wasDrag = isDragActiveRef.current;
			const wasLongPress = longPressTriggeredRef.current;

			// reset refs
			touchStartPosRef.current = null;
			isDragActiveRef.current = false;
			longPressTriggeredRef.current = false;

			// if it was a long press, day view is already open, do nothing
			if (wasLongPress) return;

			// if it was a drag, the selection is already updated via updateDayDrag
			// just need to end the drag state
			if (wasDrag) {
				// end drag but don't toggle - the drag already set the selection
				useCalendarStore.getState().endDayDrag();
				return;
			}

			// it was a simple tap - toggle the selection directly
			// end the drag state first
			useCalendarStore.getState().endDayDrag();
			// then toggle the tapped day
			toggleDaySelection(date);
		},
		[isValid, date, clearLongPress, toggleDaySelection, markTouchEvent]
	);

	const handleMouseEnter = useCallback(() => {
		if (!isValid || !isDraggingDays) return;
		updateDayDrag(date);
	}, [isValid, isDraggingDays, date, updateDayDrag]);

	return (
		<button
			data-date={date.toISOString()}
			onDoubleClick={handleDoubleClick}
			onMouseDown={handleMouseDown}
			onMouseEnter={handleMouseEnter}
			onTouchStart={handleTouchStart}
			onTouchMove={handleTouchMove}
			onTouchEnd={handleTouchEnd}
			onTouchCancel={handleTouchEnd}
			disabled={!isValid}
			className={cn(
				"relative aspect-square rounded-md p-1 text-sm transition-colors select-none",
				"flex flex-col items-center justify-start",
				// prevent text selection during drag
				"touch-manipulation",
				!isCurrentMonth && "text-muted-foreground/40",
				isValid && "hover:bg-accent active:bg-accent/80 cursor-pointer",
				!isValid && "cursor-not-allowed opacity-50",
				isToday && "ring-primary ring-1",
				isSelected && isValid && "bg-primary/20 ring-primary ring-2"
			)}
		>
			<span
				className={cn(
					"flex h-6 w-6 items-center justify-center rounded-full text-xs",
					isToday && "bg-primary text-primary-foreground"
				)}
			>
				{dayNumber}
			</span>

			{/* availability indicator */}
			{hasAvailability && isValid && (
				<div className="absolute right-1 bottom-1 left-1 flex justify-center gap-0.5">
					{/* show color-coded dots for each participant */}
					{availableParticipants.slice(0, 4).map((p) => (
						<div
							key={p.id}
							className="h-1.5 w-1.5 rounded-full"
							style={{ backgroundColor: p.color || "#3b82f6" }}
						/>
					))}
					{availableParticipants.length > 4 && (
						<span className="text-muted-foreground text-[8px]">+{availableParticipants.length - 4}</span>
					)}
				</div>
			)}

			{/* heat map overlay for valid days with availability */}
			{isValid && hasAvailability && !isSelected && (
				<div
					className="pointer-events-none absolute inset-0 rounded-md"
					style={{
						backgroundColor: `rgba(34, 197, 94, ${intensity * 0.3})`
					}}
				/>
			)}
		</button>
	);
}
