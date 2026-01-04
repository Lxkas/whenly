"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCalendarStore } from "@/stores/calendar-store";
import { useSupabaseBrowser } from "@/lib/supabase/client";
import { createMultipleAvailability, deleteAvailabilityByParticipantAndDay } from "@/lib/queries/availability";
import { Button } from "@/components/ui/button";
import { format, startOfDay, endOfDay, setHours, setMinutes } from "date-fns";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Clock01Icon } from "@hugeicons/core-free-icons";
import type { Event, AvailabilityInsert } from "@/lib/supabase/types";

interface SelectionToolbarProps {
	selectedDays: Date[];
	event: Event;
	currentParticipantId: string;
}

export function SelectionToolbar({ selectedDays, event, currentParticipantId }: SelectionToolbarProps) {
	const supabase = useSupabaseBrowser();
	const queryClient = useQueryClient();
	const { clearDaySelection, openDay } = useCalendarStore();

	// parse time range from event
	const parseTimeRange = () => {
		const startTime = event.time_range_start || "08:00";
		const endTime = event.time_range_end || "22:00";

		const [startHour, startMin] = startTime.split(":").map(Number);
		const [endHour, endMin] = endTime.split(":").map(Number);

		return { startHour, startMin, endHour, endMin };
	};

	const markAllDayMutation = useMutation({
		mutationFn: async () => {
			const { startHour, startMin, endHour, endMin } = parseTimeRange();

			// create availability for each selected day
			const availabilities: AvailabilityInsert[] = [];

			for (const day of selectedDays) {
				// first delete existing availability for this day
				const dayStart = startOfDay(day).toISOString();
				const dayEnd = endOfDay(day).toISOString();
				await deleteAvailabilityByParticipantAndDay(supabase, currentParticipantId, dayStart, dayEnd);

				// create all-day availability
				const start = setMinutes(setHours(day, startHour), startMin);
				const end = setMinutes(setHours(day, endHour), endMin);

				availabilities.push({
					participant_id: currentParticipantId,
					event_id: event.id,
					slot_start: start.toISOString(),
					slot_end: end.toISOString()
				});
			}

			if (availabilities.length > 0) {
				const { error } = await createMultipleAvailability(supabase, availabilities);
				if (error) throw error;
			}

			return { eventSlug: event.slug };
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["event", event.slug] });
			clearDaySelection();
		}
	});

	const clearAvailabilityMutation = useMutation({
		mutationFn: async () => {
			for (const day of selectedDays) {
				const dayStart = startOfDay(day).toISOString();
				const dayEnd = endOfDay(day).toISOString();
				await deleteAvailabilityByParticipantAndDay(supabase, currentParticipantId, dayStart, dayEnd);
			}
			return { eventSlug: event.slug };
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["event", event.slug] });
			clearDaySelection();
		}
	});

	const handleViewDetails = () => {
		if (selectedDays.length === 1) {
			openDay(selectedDays[0]);
		}
	};

	const isPending = markAllDayMutation.isPending || clearAvailabilityMutation.isPending;

	return (
		<div className="bg-background/95 supports-[backdrop-filter]:bg-background/80 animate-in slide-in-from-bottom-2 absolute right-0 bottom-0 left-0 rounded-lg border p-3 shadow-lg backdrop-blur duration-200">
			<div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
				{/* header row with count and close button */}
				<div className="flex items-center justify-between">
					<div className="text-sm">
						<span className="font-medium">{selectedDays.length}</span> day
						{selectedDays.length !== 1 ? "s" : ""} selected
						{selectedDays.length <= 3 && (
							<span className="text-muted-foreground ml-2 hidden sm:inline">
								({selectedDays.map((d) => format(d, "MMM d")).join(", ")})
							</span>
						)}
					</div>
					<Button variant="ghost" size="icon-sm" onClick={clearDaySelection} className="sm:hidden">
						<HugeiconsIcon icon={Cancel01Icon} className="size-4" />
					</Button>
				</div>

				{/* action buttons - stack on mobile, inline on desktop */}
				<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
					{selectedDays.length === 1 && (
						<Button variant="outline" size="sm" onClick={handleViewDetails} className="w-full sm:w-auto">
							View Details
						</Button>
					)}

					<Button
						variant="default"
						size="sm"
						onClick={() => markAllDayMutation.mutate()}
						disabled={isPending}
						className="w-full sm:w-auto"
					>
						<HugeiconsIcon icon={Clock01Icon} className="mr-1 size-4" />
						{isPending ? "Saving..." : "Mark All Day"}
					</Button>

					<Button
						variant="outline"
						size="sm"
						onClick={() => clearAvailabilityMutation.mutate()}
						disabled={isPending}
						className="w-full sm:w-auto"
					>
						Clear Availability
					</Button>

					<Button variant="ghost" size="icon-sm" onClick={clearDaySelection} className="hidden sm:flex">
						<HugeiconsIcon icon={Cancel01Icon} className="size-4" />
					</Button>
				</div>
			</div>
		</div>
	);
}
