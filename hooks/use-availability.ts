"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupabaseBrowser } from "@/lib/supabase/client";
import {
    createMultipleAvailability,
    deleteAvailability,
    deleteAvailabilityByParticipantAndDay,
    updateAvailability
} from "@/lib/queries/availability";
import type { AvailabilityInsert } from "@/lib/supabase/types";
import type { NewAvailabilityBlock } from "@/types";
import { startOfDay, endOfDay } from "date-fns";

export function useSaveAvailability() {
    const supabase = useSupabaseBrowser();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            participantId,
            eventId,
            eventSlug,
            blocks,
            day
        }: {
            participantId: string;
            eventId: string;
            eventSlug: string;
            blocks: NewAvailabilityBlock[];
            day: Date;
        }) => {
            // first delete existing availability for this participant on this day
            const dayStart = startOfDay(day).toISOString();
            const dayEnd = endOfDay(day).toISOString();

            const { error: deleteError } = await deleteAvailabilityByParticipantAndDay(supabase, participantId, dayStart, dayEnd);
            if (deleteError) throw deleteError;

            // then create new availability blocks
            if (blocks.length > 0) {
                const availabilities: AvailabilityInsert[] = blocks.map((block) => ({
                    participant_id: participantId,
                    event_id: eventId,
                    slot_start: block.start.toISOString(),
                    slot_end: block.end.toISOString()
                }));

                const { error } = await createMultipleAvailability(supabase, availabilities);
                if (error) throw error;
            }

            return { eventId, eventSlug };
        },
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ["event", result.eventSlug] });
            queryClient.invalidateQueries({ queryKey: ["availability", result.eventId] });
        }
    });
}

export function useDeleteAvailability() {
    const supabase = useSupabaseBrowser();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, eventId, eventSlug }: { id: string; eventId: string; eventSlug: string }) => {
            const { error } = await deleteAvailability(supabase, id);
            if (error) throw error;
            return { eventId, eventSlug };
        },
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ["event", result.eventSlug] });
            queryClient.invalidateQueries({ queryKey: ["availability", result.eventId] });
        }
    });
}

export function useUpdateAvailability() {
    const supabase = useSupabaseBrowser();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            eventSlug,
            slotStart,
            slotEnd
        }: {
            id: string;
            eventSlug: string;
            slotStart: Date;
            slotEnd: Date;
        }) => {
            const { error } = await updateAvailability(
                supabase,
                id,
                slotStart.toISOString(),
                slotEnd.toISOString()
            );
            if (error) throw error;
            return { eventSlug };
        },
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ["event", result.eventSlug] });
        }
    });
}
