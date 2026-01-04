"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useEvent } from "@/hooks/use-event";
import { useRealtimeEvent } from "@/hooks/use-realtime-event";
import { EventHeader } from "@/components/event/event-header";
import { ParticipantForm } from "@/components/event/participant-form";
import { ParticipantList } from "@/components/event/participant-list";
import { FinalizeDialog } from "@/components/event/finalize-dialog";
import { CalendarContainer } from "@/components/calendar/calendar-container";
import { ThemeToggler } from "@/components/ui/theme-toggler";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { getHostToken, getParticipantToken } from "@/types";

export default function EventPage() {
	const params = useParams();
	const slug = params.slug as string;
	const { data: event, isLoading, error } = useEvent(slug);

	// track participant id set immediately after joining (before event refetches)
	const [joinedParticipantId, setJoinedParticipantId] = useState<string>();

	// enable real-time updates
	useRealtimeEvent(event?.id || "", slug);

	// compute isHost from event data (derived state, not effect)
	const isHost = useMemo(() => {
		if (!event) return false;
		const hostToken = getHostToken(event.id);
		return !!(hostToken && hostToken === event.host_token);
	}, [event]);

	// compute currentParticipantId from event data or joinedParticipantId
	const currentParticipantId = useMemo(() => {
		// use joinedParticipantId if set (bridges gap before event refetches)
		if (joinedParticipantId) {
			// verify the participant exists in event data (if available)
			if (event) {
				const participant = event.participants.find((p) => p.id === joinedParticipantId);
				if (participant) return participant.id;
			}
			// event hasn't refetched yet, trust the joined id
			return joinedParticipantId;
		}

		if (!event) return undefined;

		const participantToken = getParticipantToken(event.id);
		if (!participantToken) return undefined;

		// verify the participant still exists
		const participant = event.participants.find((p) => p.id === participantToken.participantId);
		if (participant && participant.token === participantToken.token) {
			return participant.id;
		}
		return undefined;
	}, [event, joinedParticipantId]);

	if (isLoading) {
		return (
			<main className="mx-auto min-h-screen max-w-6xl p-4">
				<div className="space-y-4">
					<Skeleton className="h-10 w-64" />
					<Skeleton className="h-4 w-96" />
					<Skeleton className="h-100 w-full" />
				</div>
			</main>
		);
	}

	if (error || !event) {
		return (
			<main className="flex min-h-screen items-center justify-center p-4">
				<div className="text-center">
					<h1 className="mb-2 text-2xl font-bold">Event not found</h1>
					<p className="text-muted-foreground">This event may have been deleted or the link is incorrect.</p>
				</div>
			</main>
		);
	}

	const handleJoined = () => {
		// the participant token was stored in the mutation
		// set joinedParticipantId to immediately show as participant (before event refetches)
		const participantToken = getParticipantToken(event.id);
		if (participantToken) {
			setJoinedParticipantId(participantToken.participantId);
		}
	};

	return (
		<main className="mx-auto min-h-screen max-w-6xl p-4">
			<div className="space-y-6">
				{/* header */}
				<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
					<EventHeader event={event} isHost={isHost} />
					<div className="flex items-center gap-2">
						{isHost && <FinalizeDialog event={event} />}
						<ThemeToggler />
					</div>
				</div>

				<Separator />

				{/* main content */}
				<div className="grid gap-6 md:grid-cols-[1fr_300px]">
					{/* calendar */}
					<div>
						<CalendarContainer event={event} currentParticipantId={currentParticipantId} isHost={isHost} />
					</div>

					{/* sidebar */}
					<div className="space-y-4">
						{!currentParticipantId && !event.finalized_start && (
							<ParticipantForm
								eventId={event.id}
								eventSlug={event.slug}
								participantCount={event.participants.length}
								onJoined={handleJoined}
							/>
						)}

						<ParticipantList
							participants={event.participants}
							currentParticipantId={currentParticipantId}
						/>
					</div>
				</div>
			</div>
		</main>
	);
}
