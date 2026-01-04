"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupabaseBrowser } from "@/lib/supabase/client";
import { getParticipantsByEventId, createParticipant, deleteParticipant, checkParticipantNameExists } from "@/lib/queries/participants";
import type { ParticipantInsert, ParticipantWithAvailability } from "@/lib/supabase/types";
import { generateToken, getParticipantColor } from "@/lib/slug";
import { setParticipantToken } from "@/types";

export function useParticipants(eventId: string) {
    const supabase = useSupabaseBrowser();

    return useQuery<ParticipantWithAvailability[] | null>({
        queryKey: ["participants", eventId],
        queryFn: async () => {
            const { data, error } = await getParticipantsByEventId(supabase, eventId);
            if (error) throw error;
            return data;
        },
        enabled: !!eventId
    });
}

export function useJoinEvent() {
    const supabase = useSupabaseBrowser();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            eventId,
            eventSlug,
            name,
            participantIndex
        }: {
            eventId: string;
            eventSlug: string;
            name: string;
            participantIndex: number;
        }) => {
            // check if name already exists
            const { data: existing } = await checkParticipantNameExists(supabase, eventId, name);
            if (existing) {
                throw new Error("A participant with this name already exists");
            }

            const token = generateToken();
            const color = getParticipantColor(participantIndex);

            const participantData: ParticipantInsert = {
                event_id: eventId,
                name,
                token,
                color
            };

            const { data, error } = await createParticipant(supabase, participantData);
            if (error) throw error;
            if (!data) throw new Error("Failed to create participant");

            // store participant token in localStorage
            setParticipantToken(eventId, data.id, token);

            return { participant: data, token, eventSlug };
        },
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ["event", result.eventSlug] });
            queryClient.invalidateQueries({ queryKey: ["participants", result.participant.event_id] });
        }
    });
}

export function useLeaveEvent() {
    const supabase = useSupabaseBrowser();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ participantId, eventId, eventSlug }: { participantId: string; eventId: string; eventSlug: string }) => {
            const { error } = await deleteParticipant(supabase, participantId);
            if (error) throw error;
            return { eventId, eventSlug };
        },
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ["event", result.eventSlug] });
            queryClient.invalidateQueries({ queryKey: ["participants", result.eventId] });
        }
    });
}
