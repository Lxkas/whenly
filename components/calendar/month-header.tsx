"use client";

import { useCalendarStore } from "@/stores/calendar-store";
import { getMonthName } from "@/lib/date-utils";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";

export function MonthHeader() {
    const { currentDate, goToNextMonth, goToPrevMonth } = useCalendarStore();

    return (
        <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="icon-sm" onClick={goToPrevMonth}>
                <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
            </Button>
            <h2 className="text-lg font-semibold">{getMonthName(currentDate)}</h2>
            <Button variant="ghost" size="icon-sm" onClick={goToNextMonth}>
                <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
            </Button>
        </div>
    );
}
