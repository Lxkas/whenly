"use client";

import { useRef, useCallback, useMemo, useEffect } from "react";
import { useSelectionStore } from "@/stores/selection-store";
import { useUpdateAvailability, useSaveAvailability } from "@/hooks/use-availability";
import { formatTimeShort, setTimeOnDate } from "@/lib/date-utils";
import { AvailabilityLayer } from "./availability-layer";
import { cn } from "@/lib/utils";
import type { Event, Participant, Availability } from "@/lib/supabase/types";
import type { NewAvailabilityBlock } from "@/types";

interface TimeGridProps {
	event: Event;
	day: Date;
	participants: (Participant & { availability: Availability[] })[];
	currentParticipantId?: string;
	timeRange: { start: string; end: string };
	isHost?: boolean;
}

const HOUR_HEIGHT = 60; // pixels per hour

export function TimeGrid({ event, day, participants, currentParticipantId, timeRange }: TimeGridProps) {
	const gridRef = useRef<HTMLDivElement>(null);
	const {
		isDragging,
		dragStart,
		dragEnd,
		startDrag,
		updateDrag,
		endDrag,
		editMode,
		editingBlockId,
		editingBlockCurrent,
		updateEditBlock,
		endEditBlock,
		cancelEditBlock
	} = useSelectionStore();
	const saveAvailability = useSaveAvailability();
	const updateAvailability = useUpdateAvailability();

	// parse time range
	const startHour = parseInt(timeRange.start.split(":")[0], 10);
	const endHour = parseInt(timeRange.end.split(":")[0], 10);
	const totalHours = endHour - startHour;

	// grid time bounds for clamping
	const gridStartTime = useMemo(() => setTimeOnDate(new Date(day), startHour, 0), [day, startHour]);
	const gridEndTime = useMemo(() => setTimeOnDate(new Date(day), endHour, 0), [day, endHour]);

	// generate hour labels
	const hours = useMemo(() => {
		const result = [];
		for (let h = startHour; h <= endHour; h++) {
			result.push(h);
		}
		return result;
	}, [startHour, endHour]);

	// get availability for this day from all participants
	const dayAvailability = useMemo(() => {
		const dayStart = new Date(day);
		dayStart.setHours(0, 0, 0, 0);
		const dayEnd = new Date(day);
		dayEnd.setHours(23, 59, 59, 999);

		return participants.flatMap((p) =>
			p.availability
				.filter((a) => {
					const slotStart = new Date(a.slot_start);
					return slotStart >= dayStart && slotStart <= dayEnd;
				})
				.map((a) => ({
					...a,
					participantId: p.id,
					participantName: p.name,
					participantColor: p.color || "#3b82f6"
				}))
		);
	}, [participants, day]);

	// get current user's blocks for collision detection
	const currentUserBlocks = useMemo((): NewAvailabilityBlock[] => {
		if (!currentParticipantId) return [];
		return dayAvailability
			.filter((a) => a.participantId === currentParticipantId)
			.map((a) => ({
				id: a.id,
				start: new Date(a.slot_start),
				end: new Date(a.slot_end)
			})) as (NewAvailabilityBlock & { id: string })[];
	}, [dayAvailability, currentParticipantId]);

	const yToTime = useCallback(
		(y: number): Date => {
			if (!gridRef.current) return new Date(day);
			const rect = gridRef.current.getBoundingClientRect();
			const relativeY = Math.max(0, Math.min(y - rect.top, rect.height));
			const hourOffset = (relativeY / rect.height) * totalHours;
			const hours = Math.floor(startHour + hourOffset);
			const minutes = Math.round(((hourOffset % 1) * 60) / 15) * 15; // snap to 15 min
			return setTimeOnDate(new Date(day), hours, minutes);
		},
		[day, startHour, totalHours]
	);

	const handleMouseDown = useCallback(
		(e: React.MouseEvent) => {
			if (!currentParticipantId) return;
			// only start new drag if not already editing a block
			if (editMode) return;
			const time = yToTime(e.clientY);
			startDrag(e.clientY, time);
		},
		[currentParticipantId, yToTime, startDrag, editMode]
	);

	const handleMouseMove = useCallback(
		(e: React.MouseEvent) => {
			const time = yToTime(e.clientY);

			// handle block editing (move/resize)
			if (editMode) {
				updateEditBlock(e.clientY, time, gridStartTime, gridEndTime, currentUserBlocks);
				return;
			}

			// handle creating new block
			if (isDragging) {
				updateDrag(e.clientY, time, currentUserBlocks);
			}
		},
		[isDragging, editMode, yToTime, updateDrag, updateEditBlock, gridStartTime, gridEndTime, currentUserBlocks]
	);

	// global mouse handlers for smooth dragging even outside the grid
	// we use global handlers exclusively to avoid double-handling
	useEffect(() => {
		if (!editMode && !isDragging) return;

		const handleGlobalMouseMove = (e: MouseEvent) => {
			const time = yToTime(e.clientY);

			if (editMode) {
				updateEditBlock(e.clientY, time, gridStartTime, gridEndTime, currentUserBlocks);
			} else if (isDragging) {
				updateDrag(e.clientY, time, currentUserBlocks);
			}
		};

		const handleGlobalMouseUp = () => {
			if (editMode) {
				const result = endEditBlock();
				if (result && result.block) {
					updateAvailability.mutate({
						id: result.id,
						eventSlug: event.slug,
						slotStart: result.block.start,
						slotEnd: result.block.end
					});
				}
			} else if (isDragging && currentParticipantId) {
				const newBlock = endDrag(currentUserBlocks);
				if (newBlock) {
					saveAvailability.mutate({
						participantId: currentParticipantId,
						eventId: event.id,
						eventSlug: event.slug,
						blocks: [...currentUserBlocks.map((b) => ({ start: b.start, end: b.end })), newBlock],
						day
					});
				}
			}
		};

		window.addEventListener("mousemove", handleGlobalMouseMove);
		window.addEventListener("mouseup", handleGlobalMouseUp);

		return () => {
			window.removeEventListener("mousemove", handleGlobalMouseMove);
			window.removeEventListener("mouseup", handleGlobalMouseUp);
		};
	}, [
		editMode,
		isDragging,
		yToTime,
		updateEditBlock,
		updateDrag,
		endEditBlock,
		endDrag,
		updateAvailability,
		saveAvailability,
		event.slug,
		event.id,
		currentParticipantId,
		currentUserBlocks,
		day,
		gridStartTime,
		gridEndTime
	]);

	// cancel editing on escape key
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape" && editMode) {
				cancelEditBlock();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [editMode, cancelEditBlock]);

	// calculate drag preview position
	const getDragPreviewStyle = () => {
		if (!isDragging || !dragStart || !dragEnd || !gridRef.current) return null;
		const rect = gridRef.current.getBoundingClientRect();
		const top = Math.min(dragStart.y, dragEnd.y) - rect.top;
		const height = Math.abs(dragEnd.y - dragStart.y);
		return { top, height };
	};

	const dragPreview = getDragPreviewStyle();

	return (
		<div className="relative">
			{/* time labels */}
			<div className="flex">
				<div className="w-16 flex-shrink-0">
					{hours.map((hour) => (
						<div key={hour} className="text-muted-foreground h-[60px] pr-2 text-right text-xs">
							{formatTimeShort(setTimeOnDate(new Date(), hour, 0))}
						</div>
					))}
				</div>

				{/* grid area */}
				<div
					ref={gridRef}
					className={cn(
						"bg-muted/20 relative flex-1 rounded-md border",
						currentParticipantId && "cursor-crosshair"
					)}
					style={{ height: totalHours * HOUR_HEIGHT }}
					onMouseDown={handleMouseDown}
					onMouseMove={handleMouseMove}
				>
					{/* hour lines */}
					{hours.slice(0, -1).map((hour, i) => (
						<div
							key={hour}
							className="border-border/50 absolute right-0 left-0 border-t"
							style={{ top: (i + 1) * HOUR_HEIGHT }}
						/>
					))}

					{/* existing availability blocks */}
					<AvailabilityLayer
						availability={dayAvailability}
						startHour={startHour}
						totalHours={totalHours}
						hourHeight={HOUR_HEIGHT}
						currentParticipantId={currentParticipantId}
					/>

					{/* drag preview */}
					{dragPreview && (
						<div
							className="bg-primary/30 border-primary pointer-events-none absolute right-0 left-0 rounded border"
							style={{
								top: dragPreview.top,
								height: Math.max(dragPreview.height, 15)
							}}
						/>
					)}
				</div>
			</div>

			{/* instructions */}
			{currentParticipantId && (
				<p className="text-muted-foreground mt-2 text-center text-xs">
					Drag to add availability • Drag blocks to move • Double-click to edit
				</p>
			)}

			{!currentParticipantId && (
				<p className="text-muted-foreground mt-2 text-center text-xs">
					Join the event to add your availability
				</p>
			)}
		</div>
	);
}
