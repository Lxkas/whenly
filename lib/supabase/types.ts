// database types
export interface Event {
	id: string;
	slug: string;
	title: string;
	description: string | null;
	host_name: string;
	host_token: string;
	date_mode: "range" | "specific";
	date_range_start: string | null;
	date_range_end: string | null;
	time_range_start: string | null;
	time_range_end: string | null;
	timezone: string;
	finalized_start: string | null;
	finalized_end: string | null;
	created_at: string;
	updated_at: string;
}

export interface EventInsert {
	slug: string;
	title: string;
	description?: string | null;
	host_name: string;
	host_token: string;
	date_mode?: "range" | "specific";
	date_range_start?: string | null;
	date_range_end?: string | null;
	time_range_start?: string | null;
	time_range_end?: string | null;
	timezone?: string;
}

export interface EventUpdate {
	title?: string;
	description?: string | null;
	finalized_start?: string | null;
	finalized_end?: string | null;
}

export interface EventDate {
	id: string;
	event_id: string;
	date: string;
}

export interface Participant {
	id: string;
	event_id: string;
	name: string;
	token: string;
	color: string | null;
	created_at: string;
}

export interface ParticipantInsert {
	event_id: string;
	name: string;
	token: string;
	color?: string | null;
}

export interface Availability {
	id: string;
	participant_id: string;
	event_id: string;
	slot_start: string;
	slot_end: string;
	created_at: string;
}

export interface AvailabilityInsert {
	participant_id: string;
	event_id: string;
	slot_start: string;
	slot_end: string;
}

// event with related data
export interface EventWithParticipants extends Event {
	participants: ParticipantWithAvailability[];
	event_dates: EventDate[];
}

export interface ParticipantWithAvailability extends Participant {
	availability: Availability[];
}
