"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSupabaseBrowser } from "@/lib/supabase/client";

export function useRealtimeEvent(eventId: string, eventSlug: string) {
    const supabase = useSupabaseBrowser();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!eventId) return;

        const channel = supabase
            .channel(`event-${eventId}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "participants",
                    filter: `event_id=eq.${eventId}`
                },
                () => {
                    queryClient.invalidateQueries({ queryKey: ["event", eventSlug] });
                    queryClient.invalidateQueries({ queryKey: ["participants", eventId] });
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "availability",
                    filter: `event_id=eq.${eventId}`
                },
                () => {
                    queryClient.invalidateQueries({ queryKey: ["event", eventSlug] });
                    queryClient.invalidateQueries({ queryKey: ["availability", eventId] });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [eventId, eventSlug, supabase, queryClient]);
}
