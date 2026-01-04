"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupabaseBrowser } from "@/lib/supabase/client";
import { getEventBySlug, createEvent, updateEvent, finalizeEvent, createEventDates } from "@/lib/queries/events";
import type { EventInsert, EventUpdate, EventWithParticipants } from "@/lib/supabase/types";
import { generateSlug, generateToken } from "@/lib/slug";
import { formatDateForDB } from "@/lib/date-utils";
import { setHostToken } from "@/types";

export function useEvent(slug: string) {
	const supabase = useSupabaseBrowser();

	return useQuery<EventWithParticipants | null>({
		queryKey: ["event", slug],
		queryFn: async () => {
			const { data, error } = await getEventBySlug(supabase, slug);
			if (error) throw error;
			return data;
		},
		enabled: !!slug
	});
}

export function useCreateEvent() {
	const supabase = useSupabaseBrowser();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: {
			title: string;
			description?: string;
			hostName: string;
			dateMode: "range" | "specific";
			dateRangeStart?: Date;
			dateRangeEnd?: Date;
			specificDates?: Date[];
			timeRangeStart?: string;
			timeRangeEnd?: string;
			timezone?: string;
		}) => {
			const slug = generateSlug();
			const hostToken = generateToken();

			const eventData: EventInsert = {
				slug,
				title: input.title,
				description: input.description || null,
				host_name: input.hostName,
				host_token: hostToken,
				date_mode: input.dateMode,
				date_range_start: input.dateRangeStart ? formatDateForDB(input.dateRangeStart) : null,
				date_range_end: input.dateRangeEnd ? formatDateForDB(input.dateRangeEnd) : null,
				time_range_start: input.timeRangeStart || null,
				time_range_end: input.timeRangeEnd || null,
				timezone: input.timezone || "UTC"
			};

			const { data: event, error } = await createEvent(supabase, eventData);
			if (error) throw error;
			if (!event) throw new Error("Failed to create event");

			// if specific dates mode, create the event_dates
			if (input.dateMode === "specific" && input.specificDates && input.specificDates.length > 0) {
				const dates = input.specificDates.map((d) => formatDateForDB(d));
				const { error: datesError } = await createEventDates(supabase, event.id, dates);
				if (datesError) throw datesError;
			}

			// store host token in localStorage
			setHostToken(event.id, hostToken);

			return { event, hostToken };
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: ["event", data.event.slug] });
		}
	});
}

export function useUpdateEvent() {
	const supabase = useSupabaseBrowser();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ id, slug, updates }: { id: string; slug: string; updates: EventUpdate }) => {
			const { data, error } = await updateEvent(supabase, id, updates);
			if (error) throw error;
			return { data, slug };
		},
		onSuccess: (result) => {
			queryClient.invalidateQueries({ queryKey: ["event", result.slug] });
		}
	});
}

export function useFinalizeEvent() {
	const supabase = useSupabaseBrowser();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ id, slug, start, end }: { id: string; slug: string; start: Date; end: Date }) => {
			const { data, error } = await finalizeEvent(supabase, id, start.toISOString(), end.toISOString());
			if (error) throw error;
			return { data, slug };
		},
		onSuccess: (result) => {
			queryClient.invalidateQueries({ queryKey: ["event", result.slug] });
		}
	});
}
