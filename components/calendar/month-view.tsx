"use client";

import { useEffect, useCallback } from "react";
import { useCalendarStore } from "@/stores/calendar-store";
import { getCalendarDays, isSameMonth, isSameDay, isDateInRange } from "@/lib/date-utils";
import { MonthHeader } from "./month-header";
import { MonthDayCell } from "./month-day-cell";
import { SelectionToolbar } from "./selection-toolbar";
import type { Event, Participant, Availability } from "@/lib/supabase/types";

interface MonthViewProps {
	event: Event;
	validDates: Date[] | { start: Date; end: Date } | null;
	participants: (Participant & { availability: Availability[] })[];
	currentParticipantId?: string;
	isHost?: boolean;
}

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function MonthView({ event, validDates, participants, currentParticipantId }: MonthViewProps) {
	const { currentDate, endDayDrag, isDraggingDays, selectedDays, dragStartDay, toggleDaySelection } =
		useCalendarStore();
	const days = getCalendarDays(currentDate);

	// handle global mouse up to end drag (for desktop)
	// touch events are handled directly by MonthDayCell for better reliability
	useEffect(() => {
		const handleMouseUp = () => {
			const state = useCalendarStore.getState();
			// ignore synthetic mouse events after touch
			if (state.shouldIgnoreMouseEvent()) return;

			if (state.isDraggingDays) {
				// remember the drag start day before ending
				const startDay = state.dragStartDay;
				const wasDrag = state.endDayDrag();

				// if it wasn't a drag (just a click), toggle the day
				if (!wasDrag && startDay) {
					state.toggleDaySelection(startDay);
				}
			}
		};

		window.addEventListener("mouseup", handleMouseUp);

		return () => {
			window.removeEventListener("mouseup", handleMouseUp);
		};
	}, []);

	const isDateValid = useCallback(
		(date: Date): boolean => {
			if (!validDates) return false;

			if (Array.isArray(validDates)) {
				return validDates.some((d) => isSameDay(d, date));
			}

			return isDateInRange(date, validDates.start, validDates.end);
		},
		[validDates]
	);

	const getAvailabilityForDay = useCallback(
		(date: Date) => {
			const dayStart = new Date(date);
			dayStart.setHours(0, 0, 0, 0);
			const dayEnd = new Date(date);
			dayEnd.setHours(23, 59, 59, 999);

			const participantsWithAvailability = participants.filter((p) =>
				p.availability.some((a) => {
					const slotStart = new Date(a.slot_start);
					return slotStart >= dayStart && slotStart <= dayEnd;
				})
			);

			return participantsWithAvailability;
		},
		[participants]
	);

	// filter selected days to only valid ones
	const validSelectedDays = selectedDays.filter(isDateValid);

	return (
		<div className="relative w-full pb-16">
			<MonthHeader />

			{/* weekday headers */}
			<div className="mb-1 grid grid-cols-7 gap-1">
				{WEEKDAY_NAMES.map((name) => (
					<div key={name} className="text-muted-foreground py-2 text-center text-xs">
						{name}
					</div>
				))}
			</div>

			{/* calendar grid */}
			<div className="grid grid-cols-7 gap-1">
				{days.map((day) => {
					const isCurrentMonth = isSameMonth(day, currentDate);
					const isValid = isDateValid(day);
					const availableParticipants = getAvailabilityForDay(day);

					return (
						<MonthDayCell
							key={day.toISOString()}
							date={day}
							isCurrentMonth={isCurrentMonth}
							isValid={isValid}
							availableParticipants={availableParticipants}
							totalParticipants={participants.length}
						/>
					);
				})}
			</div>

			{/* instructions */}
			<div className="text-muted-foreground mt-4 space-y-1 text-center text-xs">
				<p className="hidden sm:block">Click or drag to select days, double-click to view details</p>
				<p className="sm:hidden">Tap or drag to select days, long-press to view details</p>
				{!currentParticipantId && <p>Join the event to add your availability</p>}
			</div>

			{/* selection toolbar - positioned at bottom to avoid layout shift */}
			{validSelectedDays.length > 0 && currentParticipantId && (
				<SelectionToolbar
					selectedDays={validSelectedDays}
					event={event}
					currentParticipantId={currentParticipantId}
				/>
			)}
		</div>
	);
}
