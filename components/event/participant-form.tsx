"use client";

import { useState } from "react";
import { useJoinEvent } from "@/hooks/use-participants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ParticipantFormProps {
    eventId: string;
    eventSlug: string;
    participantCount: number;
    onJoined?: () => void;
}

export function ParticipantForm({ eventId, eventSlug, participantCount, onJoined }: ParticipantFormProps) {
    const [name, setName] = useState("");
    const [error, setError] = useState("");
    const joinEvent = useJoinEvent();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!name.trim()) {
            setError("Please enter your name");
            return;
        }

        try {
            await joinEvent.mutateAsync({
                eventId,
                eventSlug,
                name: name.trim(),
                participantIndex: participantCount
            });
            onJoined?.();
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Failed to join event");
            }
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Join this Event</CardTitle>
                <CardDescription>Enter your name to add your availability</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="participantName">Your Name</Label>
                        <Input
                            id="participantName"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your name"
                        />
                        {error && <p className="text-sm text-destructive">{error}</p>}
                    </div>
                    <Button type="submit" className="w-full" disabled={joinEvent.isPending}>
                        {joinEvent.isPending ? "Joining..." : "Join Event"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
