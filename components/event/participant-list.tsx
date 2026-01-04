"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Participant, Availability } from "@/lib/supabase/types";

interface ParticipantListProps {
    participants: (Participant & { availability: Availability[] })[];
    currentParticipantId?: string;
}

export function ParticipantList({ participants, currentParticipantId }: ParticipantListProps) {
    if (participants.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Participants</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">No participants yet. Be the first to join!</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Participants ({participants.length})</CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="space-y-2">
                    {participants.map((participant) => {
                        const isCurrentUser = participant.id === currentParticipantId;
                        const availabilityCount = participant.availability.length;

                        return (
                            <li key={participant.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: participant.color || "#3b82f6" }}
                                    />
                                    <span className={isCurrentUser ? "font-medium" : ""}>
                                        {participant.name}
                                        {isCurrentUser && " (you)"}
                                    </span>
                                </div>
                                <Badge variant="secondary" className="text-xs">
                                    {availabilityCount} slot{availabilityCount !== 1 ? "s" : ""}
                                </Badge>
                            </li>
                        );
                    })}
                </ul>
            </CardContent>
        </Card>
    );
}
