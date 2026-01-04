"use client";

import { useRef, useCallback, useMemo, useEffect, useState } from "react";
import { useSelectionStore } from "@/stores/selection-store";
import { useUpdateAvailability, useSaveAvailability } from "@/hooks/use-availability";
import { useTouchDevice } from "@/hooks/use-touch-device";
import { formatTimeShort, setTimeOnDate } from "@/lib/date-utils";
import { AvailabilityLayer } from "./availability-layer";
import { AddBlockDialog } from "./add-block-dialog";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";
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

// helper to get clientY from mouse or touch event
function getClientY(e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent): number {
	if ("touches" in e) {
		return e.touches[0]?.clientY ?? e.changedTouches[0]?.clientY ?? 0;
	}
	return e.clientY;
}

export function TimeGrid({ event, day, participants, currentParticipantId, timeRange }: TimeGridProps) {
	const gridRef = useRef<HTMLDivElement>(null);
	const isTouchDevice = useTouchDevice();
	const [addDialogOpen, setAddDialogOpen] = useState(false);
	const [dragGridTop, setDragGridTop] = useState<number | null>(null);

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

	// mouse-only handler for creating new blocks via drag (disabled on touch devices)
	const handleMouseDown = useCallback(
		(e: React.MouseEvent) => {
			if (!currentParticipantId) return;
			if (editMode) return;
			// on touch devices, use the dialog instead of drag
			if (isTouchDevice) return;

			// capture grid position at drag start for preview calculation
			if (gridRef.current) {
				setDragGridTop(gridRef.current.getBoundingClientRect().top);
			}

			const clientY = e.clientY;
			const time = yToTime(clientY);
			startDrag(clientY, time);
		},
		[currentParticipantId, yToTime, startDrag, editMode, isTouchDevice]
	);

	const handleMouseMove = useCallback(
		(e: React.MouseEvent) => {
			const clientY = e.clientY;
			const time = yToTime(clientY);

			// handle block editing (move/resize) - works on all devices
			if (editMode) {
				updateEditBlock(clientY, time, gridStartTime, gridEndTime, currentUserBlocks);
				return;
			}

			// handle creating new block (mouse only)
			if (isDragging && !isTouchDevice) {
				updateDrag(clientY, time, currentUserBlocks);
			}
		},
		[
			isDragging,
			editMode,
			yToTime,
			updateDrag,
			updateEditBlock,
			gridStartTime,
			gridEndTime,
			currentUserBlocks,
			isTouchDevice
		]
	);

	// handler for saving blocks created via dialog (mobile)
	const handleAddBlock = useCallback(
		(newBlock: NewAvailabilityBlock) => {
			if (!currentParticipantId) return;

			saveAvailability.mutate({
				participantId: currentParticipantId,
				eventId: event.id,
				eventSlug: event.slug,
				blocks: [...currentUserBlocks.map((b) => ({ start: b.start, end: b.end })), newBlock],
				day
			});
		},
		[currentParticipantId, event.id, event.slug, currentUserBlocks, day, saveAvailability]
	);

	// global mouse handlers for drag-to-create (mouse only, not touch)
	useEffect(() => {
		if (!isDragging || isTouchDevice) return;

		const handleGlobalMouseMove = (e: MouseEvent) => {
			const clientY = e.clientY;
			const time = yToTime(clientY);
			updateDrag(clientY, time, currentUserBlocks);
		};

		const handleGlobalMouseUp = () => {
			if (isDragging && currentParticipantId) {
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
		isDragging,
		isTouchDevice,
		yToTime,
		updateDrag,
		endDrag,
		saveAvailability,
		event.slug,
		event.id,
		currentParticipantId,
		currentUserBlocks,
		day
	]);

	// global handlers for block editing (works on both mouse and touch)
	useEffect(() => {
		if (!editMode) return;

		const handleGlobalMove = (e: MouseEvent | TouchEvent) => {
			// prevent scrolling on touch devices while dragging
			if (e.cancelable) {
				e.preventDefault();
			}
			const clientY = getClientY(e);
			const time = yToTime(clientY);
			updateEditBlock(clientY, time, gridStartTime, gridEndTime, currentUserBlocks);
		};

		const handleGlobalEnd = () => {
			const result = endEditBlock();
			if (result && result.block) {
				updateAvailability.mutate({
					id: result.id,
					eventSlug: event.slug,
					slotStart: result.block.start,
					slotEnd: result.block.end
				});
			}
		};

		window.addEventListener("mousemove", handleGlobalMove);
		window.addEventListener("mouseup", handleGlobalEnd);
		window.addEventListener("touchmove", handleGlobalMove, { passive: false });
		window.addEventListener("touchend", handleGlobalEnd);
		window.addEventListener("touchcancel", handleGlobalEnd);

		return () => {
			window.removeEventListener("mousemove", handleGlobalMove);
			window.removeEventListener("mouseup", handleGlobalEnd);
			window.removeEventListener("touchmove", handleGlobalMove);
			window.removeEventListener("touchend", handleGlobalEnd);
			window.removeEventListener("touchcancel", handleGlobalEnd);
		};
	}, [
		editMode,
		yToTime,
		updateEditBlock,
		endEditBlock,
		updateAvailability,
		event.slug,
		currentUserBlocks,
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

	// calculate drag preview position using grid top captured at drag start
	const dragPreview = useMemo(() => {
		if (!isDragging || !dragStart || !dragEnd || dragGridTop === null) {
			return null;
		}
		const top = Math.min(dragStart.y, dragEnd.y) - dragGridTop;
		const height = Math.abs(dragEnd.y - dragStart.y);
		return { top, height };
	}, [isDragging, dragStart, dragEnd, dragGridTop]);

	return (
		<div className="relative">
			{/* time labels */}
			<div className="flex">
				<div className="w-10 shrink-0 sm:w-16">
					{hours.map((hour) => (
						<div
							key={hour}
							className="text-muted-foreground h-15 pr-1 text-right text-[10px] sm:pr-2 sm:text-xs"
						>
							{formatTimeShort(setTimeOnDate(new Date(), hour, 0))}
						</div>
					))}
				</div>

				{/* grid area */}
				<div
					ref={gridRef}
					className={cn(
						"bg-muted/20 relative flex-1 rounded-md border",
						// only show crosshair cursor on non-touch devices
						currentParticipantId && !isTouchDevice && "cursor-crosshair",
						// prevent scrolling while editing blocks on touch devices
						editMode && "touch-none"
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

					{/* drag preview (desktop only) */}
					{dragPreview && !isTouchDevice && (
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

			{/* add button for mobile */}
			{currentParticipantId && isTouchDevice && (
				<Button variant="outline" className="mt-3 w-full" onClick={() => setAddDialogOpen(true)}>
					<HugeiconsIcon icon={Add01Icon} className="mr-2 size-4" />
					Add Time Slot
				</Button>
			)}

			{/* instructions */}
			{currentParticipantId && (
				<p className="text-muted-foreground mt-2 text-center text-xs">
					{isTouchDevice ? (
						<>Tap button above to add • Long-press blocks to edit</>
					) : (
						<>Drag to add availability • Drag blocks to move • Double-click to edit</>
					)}
				</p>
			)}

			{!currentParticipantId && (
				<p className="text-muted-foreground mt-2 text-center text-xs">
					Join the event to add your availability
				</p>
			)}

			{/* add block dialog (mobile) */}
			<AddBlockDialog
				open={addDialogOpen}
				onOpenChange={setAddDialogOpen}
				day={day}
				timeRange={timeRange}
				existingBlocks={currentUserBlocks}
				onSave={handleAddBlock}
			/>
		</div>
	);
}
