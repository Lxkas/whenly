import type { SupabaseClient } from "@supabase/supabase-js";
import type { EventInsert, EventUpdate, EventWithParticipants, Event } from "@/lib/supabase/types";

export async function getEventBySlug(
	client: SupabaseClient,
	slug: string
): Promise<{ data: EventWithParticipants | null; error: Error | null }> {
	const { data, error } = await client
		.from("events")
		.select(
			`
            *,
            event_dates(*),
            participants(
                *,
                availability(*)
            )
        `
		)
		.eq("slug", slug)
		.single();

	return { data: data as EventWithParticipants | null, error };
}

export async function getEventById(
	client: SupabaseClient,
	id: string
): Promise<{ data: EventWithParticipants | null; error: Error | null }> {
	const { data, error } = await client
		.from("events")
		.select(
			`
            *,
            event_dates(*),
            participants(
                *,
                availability(*)
            )
        `
		)
		.eq("id", id)
		.single();

	return { data: data as EventWithParticipants | null, error };
}

export async function createEvent(
	client: SupabaseClient,
	event: EventInsert
): Promise<{ data: Event | null; error: Error | null }> {
	const { data, error } = await client.from("events").insert(event).select().single();
	return { data: data as Event | null, error };
}

export async function updateEvent(
	client: SupabaseClient,
	id: string,
	updates: EventUpdate
): Promise<{ data: Event | null; error: Error | null }> {
	const { data, error } = await client.from("events").update(updates).eq("id", id).select().single();
	return { data: data as Event | null, error };
}

export async function createEventDates(
	client: SupabaseClient,
	eventId: string,
	dates: string[]
): Promise<{ error: Error | null }> {
	const rows = dates.map((date) => ({ event_id: eventId, date }));
	const { error } = await client.from("event_dates").insert(rows);
	return { error };
}

export async function finalizeEvent(
	client: SupabaseClient,
	id: string,
	start: string,
	end: string
): Promise<{ data: Event | null; error: Error | null }> {
	const { data, error } = await client
		.from("events")
		.update({ finalized_start: start, finalized_end: end })
		.eq("id", id)
		.select()
		.single();
	return { data: data as Event | null, error };
}
