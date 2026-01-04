"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupabaseBrowser } from "@/lib/supabase/client";
import { createAvailability, deleteAvailabilityByParticipantAndDay } from "@/lib/queries/availability";
import { DayHeader } from "./day-header";
import { TimeGrid } from "./time-grid";
import { BlockEditDialog } from "./block-edit-dialog";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Clock01Icon } from "@hugeicons/core-free-icons";
import { setHours, setMinutes, startOfDay, endOfDay } from "date-fns";
import type { Event, Participant, Availability } from "@/lib/supabase/types";

interface DayViewProps {
    event: Event;
    day: Date;
    participants: (Participant & { availability: Availability[] })[];
    currentParticipantId?: string;
    timeRange: { start: string; end: string };
    isHost?: boolean;
}

export function DayView({ event, day, participants, currentParticipantId, timeRange, isHost }: DayViewProps) {
    const supabase = useSupabaseBrowser();
    const queryClient = useQueryClient();

    // parse time range
    const [startHour, startMin] = timeRange.start.split(":").map(Number);
    const [endHour, endMin] = timeRange.end.split(":").map(Number);

    const markAllDayMutation = useMutation({
        mutationFn: async () => {
            if (!currentParticipantId) return;

            // delete existing availability for this day
            const dayStart = startOfDay(day).toISOString();
            const dayEnd = endOfDay(day).toISOString();
            await deleteAvailabilityByParticipantAndDay(supabase, currentParticipantId, dayStart, dayEnd);

            // create all-day availability
            const start = setMinutes(setHours(day, startHour), startMin);
            const end = setMinutes(setHours(day, endHour), endMin);

            const { error } = await createAvailability(supabase, {
                participant_id: currentParticipantId,
                event_id: event.id,
                slot_start: start.toISOString(),
                slot_end: end.toISOString()
            });

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["event", event.slug] });
        }
    });

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-2">
                <DayHeader day={day} />
                {currentParticipantId && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => markAllDayMutation.mutate()}
                        disabled={markAllDayMutation.isPending}
                    >
                        <HugeiconsIcon icon={Clock01Icon} className="size-4 mr-1" />
                        {markAllDayMutation.isPending ? "Saving..." : "Mark All Day"}
                    </Button>
                )}
            </div>
            <TimeGrid
                event={event}
                day={day}
                participants={participants}
                currentParticipantId={currentParticipantId}
                timeRange={timeRange}
                isHost={isHost}
            />
            <BlockEditDialog
                eventId={event.id}
                eventSlug={event.slug}
                day={day}
                timeRange={timeRange}
            />
        </div>
    );
}
