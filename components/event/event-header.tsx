"use client";

import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { CopyLinkButton } from "@/components/shared/copy-link-button";
import type { Event } from "@/lib/supabase/types";

interface EventHeaderProps {
    event: Event;
    isHost?: boolean;
}

export function EventHeader({ event, isHost }: EventHeaderProps) {
    const isFinalized = !!event.finalized_start;

    const getDateRangeText = () => {
        if (event.date_mode === "range" && event.date_range_start && event.date_range_end) {
            return `${format(new Date(event.date_range_start), "MMM d")} - ${format(new Date(event.date_range_end), "MMM d, yyyy")}`;
        }
        return "Multiple dates";
    };

    const getTimeRangeText = () => {
        if (event.time_range_start && event.time_range_end) {
            return `${event.time_range_start} - ${event.time_range_end}`;
        }
        return "All day";
    };

    return (
        <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold">{event.title}</h1>
                        {isHost && (
                            <Badge variant="outline" className="text-xs">
                                Host
                            </Badge>
                        )}
                        {isFinalized && (
                            <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Finalized</Badge>
                        )}
                    </div>
                    {event.description && <p className="mt-1 text-muted-foreground">{event.description}</p>}
                </div>
                <CopyLinkButton slug={event.slug} />
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div>
                    <span className="font-medium">Dates:</span> {getDateRangeText()}
                </div>
                <div>
                    <span className="font-medium">Time:</span> {getTimeRangeText()}
                </div>
                <div>
                    <span className="font-medium">Created by:</span> {event.host_name}
                </div>
            </div>

            {isFinalized && event.finalized_start && event.finalized_end && (
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                    <p className="font-medium text-green-600 dark:text-green-400">
                        Event scheduled for {format(new Date(event.finalized_start), "EEEE, MMMM d, yyyy")}
                    </p>
                    <p className="text-sm text-green-600/80 dark:text-green-400/80">
                        {format(new Date(event.finalized_start), "h:mm a")} -{" "}
                        {format(new Date(event.finalized_end), "h:mm a")}
                    </p>
                </div>
            )}
        </div>
    );
}
