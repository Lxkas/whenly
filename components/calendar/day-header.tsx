"use client";

import { useCalendarStore } from "@/stores/calendar-store";
import { getDayName } from "@/lib/date-utils";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";

interface DayHeaderProps {
    day: Date;
}

export function DayHeader({ day }: DayHeaderProps) {
    const { closeDay } = useCalendarStore();

    return (
        <div className="flex items-center gap-3 mb-4">
            <Button variant="ghost" size="icon-sm" onClick={closeDay}>
                <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
            </Button>
            <h2 className="text-lg font-semibold">{getDayName(day)}</h2>
        </div>
    );
}
