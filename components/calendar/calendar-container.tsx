"use client";

import { useCalendarStore } from "@/stores/calendar-store";
import { MonthView } from "./month-view";
import { DayView } from "./day-view";
import type { Event, Participant, Availability } from "@/lib/supabase/types";

interface CalendarContainerProps {
	event: Event & {
		event_dates: { date: string }[];
		participants: (Participant & { availability: Availability[] })[];
	};
	currentParticipantId?: string;
	isHost?: boolean;
}

export function CalendarContainer({ event, currentParticipantId, isHost }: CalendarContainerProps) {
	const { view, selectedDay } = useCalendarStore();

	// get valid dates based on event mode
	const validDates =
		event.date_mode === "specific"
			? event.event_dates.map((d) => new Date(d.date))
			: event.date_range_start && event.date_range_end
				? { start: new Date(event.date_range_start), end: new Date(event.date_range_end) }
				: null;

	// get time range
	const timeRange = {
		start: event.time_range_start || "08:00",
		end: event.time_range_end || "22:00"
	};

	if (view === "day" && selectedDay) {
		return (
			<DayView
				event={event}
				day={selectedDay}
				participants={event.participants}
				currentParticipantId={currentParticipantId}
				timeRange={timeRange}
				isHost={isHost}
			/>
		);
	}

	return (
		<MonthView
			event={event}
			validDates={validDates}
			participants={event.participants}
			currentParticipantId={currentParticipantId}
			isHost={isHost}
		/>
	);
}
