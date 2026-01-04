import type { SupabaseClient } from "@supabase/supabase-js";
import type { AvailabilityInsert, Availability } from "@/lib/supabase/types";

interface AvailabilityWithParticipant extends Availability {
    participants: { id: string; name: string; color: string | null };
}

export async function getAvailabilityByEventId(
    client: SupabaseClient,
    eventId: string
): Promise<{ data: AvailabilityWithParticipant[] | null; error: Error | null }> {
    const { data, error } = await client
        .from("availability")
        .select(
            `
            *,
            participants(id, name, color)
        `
        )
        .eq("event_id", eventId)
        .order("slot_start", { ascending: true });

    return { data: data as AvailabilityWithParticipant[] | null, error };
}

export async function getAvailabilityByParticipantId(
    client: SupabaseClient,
    participantId: string
): Promise<{ data: Availability[] | null; error: Error | null }> {
    const { data, error } = await client
        .from("availability")
        .select("*")
        .eq("participant_id", participantId)
        .order("slot_start", { ascending: true });

    return { data: data as Availability[] | null, error };
}

export async function createAvailability(
    client: SupabaseClient,
    availability: AvailabilityInsert
): Promise<{ data: Availability | null; error: Error | null }> {
    const { data, error } = await client.from("availability").insert(availability).select().single();
    return { data: data as Availability | null, error };
}

export async function createMultipleAvailability(
    client: SupabaseClient,
    availabilities: AvailabilityInsert[]
): Promise<{ error: Error | null }> {
    const { error } = await client.from("availability").insert(availabilities);
    return { error };
}

export async function deleteAvailability(client: SupabaseClient, id: string): Promise<{ error: Error | null }> {
    const { error } = await client.from("availability").delete().eq("id", id);
    return { error };
}

export async function deleteAvailabilityByParticipantAndDay(
    client: SupabaseClient,
    participantId: string,
    dayStart: string,
    dayEnd: string
): Promise<{ error: Error | null }> {
    const { error } = await client
        .from("availability")
        .delete()
        .eq("participant_id", participantId)
        .gte("slot_start", dayStart)
        .lt("slot_start", dayEnd);

    return { error };
}

export async function updateAvailability(
    client: SupabaseClient,
    id: string,
    slotStart: string,
    slotEnd: string
): Promise<{ error: Error | null }> {
    const { error } = await client
        .from("availability")
        .update({ slot_start: slotStart, slot_end: slotEnd })
        .eq("id", id);

    return { error };
}
