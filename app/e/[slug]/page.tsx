"use client";

import { useEffect, useState } from "react";
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

    const [isHost, setIsHost] = useState(false);
    const [currentParticipantId, setCurrentParticipantId] = useState<string | undefined>();

    // enable real-time updates
    useRealtimeEvent(event?.id || "", slug);

    // check if user is host or participant
    useEffect(() => {
        if (!event) return;

        const hostToken = getHostToken(event.id);
        if (hostToken && hostToken === event.host_token) {
            setIsHost(true);
        }

        const participantToken = getParticipantToken(event.id);
        if (participantToken) {
            // verify the participant still exists
            const participant = event.participants.find((p) => p.id === participantToken.participantId);
            if (participant && participant.token === participantToken.token) {
                setCurrentParticipantId(participant.id);
            }
        }
    }, [event]);

    if (isLoading) {
        return (
            <main className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto">
                <div className="space-y-4">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-4 w-96" />
                    <Skeleton className="h-[400px] w-full" />
                </div>
            </main>
        );
    }

    if (error || !event) {
        return (
            <main className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-2">Event not found</h1>
                    <p className="text-muted-foreground">
                        This event may have been deleted or the link is incorrect.
                    </p>
                </div>
            </main>
        );
    }

    const handleJoined = () => {
        // the participant token was stored in the mutation
        // we need to refresh to get it
        const participantToken = getParticipantToken(event.id);
        if (participantToken) {
            setCurrentParticipantId(participantToken.participantId);
        }
    };

    return (
        <main className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto">
            <div className="absolute top-4 right-4">
                <ThemeToggler />
            </div>

            <div className="space-y-6">
                {/* header */}
                <div className="flex items-start justify-between gap-4">
                    <EventHeader event={event} isHost={isHost} />
                    {isHost && <FinalizeDialog event={event} />}
                </div>

                <Separator />

                {/* main content */}
                <div className="grid md:grid-cols-[1fr_300px] gap-6">
                    {/* calendar */}
                    <div>
                        <CalendarContainer
                            event={event}
                            currentParticipantId={currentParticipantId}
                            isHost={isHost}
                        />
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
