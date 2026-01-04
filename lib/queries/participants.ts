import type { SupabaseClient } from "@supabase/supabase-js";
import type { ParticipantInsert, ParticipantWithAvailability, Participant } from "@/lib/supabase/types";

export async function getParticipantsByEventId(
	client: SupabaseClient,
	eventId: string
): Promise<{ data: ParticipantWithAvailability[] | null; error: Error | null }> {
	const { data, error } = await client
		.from("participants")
		.select(
			`
            *,
            availability(*)
        `
		)
		.eq("event_id", eventId)
		.order("created_at", { ascending: true });

	return { data: data as ParticipantWithAvailability[] | null, error };
}

export async function getParticipantById(
	client: SupabaseClient,
	id: string
): Promise<{ data: ParticipantWithAvailability | null; error: Error | null }> {
	const { data, error } = await client
		.from("participants")
		.select(
			`
            *,
            availability(*)
        `
		)
		.eq("id", id)
		.single();

	return { data: data as ParticipantWithAvailability | null, error };
}

export async function createParticipant(
	client: SupabaseClient,
	participant: ParticipantInsert
): Promise<{ data: Participant | null; error: Error | null }> {
	const { data, error } = await client.from("participants").insert(participant).select().single();
	return { data: data as Participant | null, error };
}

export async function deleteParticipant(client: SupabaseClient, id: string): Promise<{ error: Error | null }> {
	const { error } = await client.from("participants").delete().eq("id", id);
	return { error };
}

export async function checkParticipantNameExists(
	client: SupabaseClient,
	eventId: string,
	name: string
): Promise<{ data: { id: string } | null; error: Error | null }> {
	const { data, error } = await client
		.from("participants")
		.select("id")
		.eq("event_id", eventId)
		.eq("name", name)
		.maybeSingle();
	return { data, error };
}
