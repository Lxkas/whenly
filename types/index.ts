import type { Event, Participant, Availability, EventDate } from "@/lib/supabase/types";

// calendar view modes
export type CalendarView = "month" | "day";

// date selection mode for event creation
export type DateMode = "range" | "specific";

// event with all related data
export interface EventWithDetails extends Event {
    participants: ParticipantWithAvailability[];
    event_dates: EventDate[];
}

// participant with their availability slots
export interface ParticipantWithAvailability extends Participant {
    availability: Availability[];
}

// time range for a day
export interface TimeRange {
    start: Date;
    end: Date;
}

// availability block (visual representation)
export interface AvailabilityBlock {
    id: string;
    participantId: string;
    participantName: string;
    participantColor: string;
    start: Date;
    end: Date;
}

// for creating new availability
export interface NewAvailabilityBlock {
    start: Date;
    end: Date;
}

// calendar store state
export interface CalendarState {
    currentDate: Date;
    selectedDay: Date | null;
    view: CalendarView;
    setCurrentDate: (date: Date) => void;
    setSelectedDay: (date: Date | null) => void;
    setView: (view: CalendarView) => void;
    goToNextMonth: () => void;
    goToPrevMonth: () => void;
}

// selection store state (for drag-to-select)
export interface SelectionState {
    isDragging: boolean;
    dragStart: { y: number; time: Date } | null;
    dragEnd: { y: number; time: Date } | null;
    pendingBlocks: NewAvailabilityBlock[];
    startDrag: (y: number, time: Date) => void;
    updateDrag: (y: number, time: Date) => void;
    endDrag: () => void;
    clearPending: () => void;
    addPendingBlock: (block: NewAvailabilityBlock) => void;
}

// form types
export interface CreateEventFormData {
    title: string;
    description?: string;
    hostName: string;
    dateMode: DateMode;
    dateRangeStart?: Date;
    dateRangeEnd?: Date;
    specificDates?: Date[];
    timeRangeStart?: string;
    timeRangeEnd?: string;
    timezone: string;
}

export interface JoinEventFormData {
    name: string;
}

// host token storage
export interface HostToken {
    eventId: string;
    token: string;
}

// participant token storage
export interface ParticipantToken {
    eventId: string;
    participantId: string;
    token: string;
}

// local storage keys
export const STORAGE_KEYS = {
    HOST_TOKENS: "whenly_host_tokens",
    PARTICIPANT_TOKENS: "whenly_participant_tokens"
} as const;

// helper to get/set tokens from localStorage
export function getHostToken(eventId: string): string | null {
    if (typeof window === "undefined") return null;
    try {
        const tokens: HostToken[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.HOST_TOKENS) || "[]");
        return tokens.find((t) => t.eventId === eventId)?.token || null;
    } catch {
        return null;
    }
}

export function setHostToken(eventId: string, token: string): void {
    if (typeof window === "undefined") return;
    try {
        const tokens: HostToken[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.HOST_TOKENS) || "[]");
        const existing = tokens.findIndex((t) => t.eventId === eventId);
        if (existing >= 0) {
            tokens[existing].token = token;
        } else {
            tokens.push({ eventId, token });
        }
        localStorage.setItem(STORAGE_KEYS.HOST_TOKENS, JSON.stringify(tokens));
    } catch {
        // ignore storage errors
    }
}

export function getParticipantToken(eventId: string): ParticipantToken | null {
    if (typeof window === "undefined") return null;
    try {
        const tokens: ParticipantToken[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.PARTICIPANT_TOKENS) || "[]");
        return tokens.find((t) => t.eventId === eventId) || null;
    } catch {
        return null;
    }
}

export function setParticipantToken(eventId: string, participantId: string, token: string): void {
    if (typeof window === "undefined") return;
    try {
        const tokens: ParticipantToken[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.PARTICIPANT_TOKENS) || "[]");
        const existing = tokens.findIndex((t) => t.eventId === eventId);
        if (existing >= 0) {
            tokens[existing] = { eventId, participantId, token };
        } else {
            tokens.push({ eventId, participantId, token });
        }
        localStorage.setItem(STORAGE_KEYS.PARTICIPANT_TOKENS, JSON.stringify(tokens));
    } catch {
        // ignore storage errors
    }
}
