"use client";

import { useCallback } from "react";
import { useCalendarStore } from "@/stores/calendar-store";
import { getDayNumber, isSameDay } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import type { Participant } from "@/lib/supabase/types";

interface MonthDayCellProps {
	date: Date;
	isCurrentMonth: boolean;
	isValid: boolean;
	availableParticipants: Participant[];
	totalParticipants: number;
}

export function MonthDayCell({
	date,
	isCurrentMonth,
	isValid,
	availableParticipants,
	totalParticipants
}: MonthDayCellProps) {
	const { openDay, startDayDrag, updateDayDrag, isDraggingDays, selectedDays } = useCalendarStore();

	const isToday = isSameDay(date, new Date());
	const dayNumber = getDayNumber(date);
	const hasAvailability = availableParticipants.length > 0;
	const isSelected = selectedDays.some((d) => isSameDay(d, date));

	// calculate intensity based on how many participants are available
	const intensity = totalParticipants > 0 ? availableParticipants.length / totalParticipants : 0;

	const handleDoubleClick = useCallback(
		(e: React.MouseEvent) => {
			if (!isValid) return;
			e.preventDefault();
			e.stopPropagation();
			openDay(date);
		},
		[isValid, date, openDay]
	);

	const handleMouseDown = useCallback(
		(e: React.MouseEvent) => {
			if (!isValid || e.button !== 0) return;
			e.preventDefault();
			startDayDrag(date);
		},
		[isValid, date, startDayDrag]
	);

	const handleMouseEnter = useCallback(() => {
		if (!isValid || !isDraggingDays) return;
		updateDayDrag(date);
	}, [isValid, isDraggingDays, date, updateDayDrag]);

	return (
		<button
			onDoubleClick={handleDoubleClick}
			onMouseDown={handleMouseDown}
			onMouseEnter={handleMouseEnter}
			disabled={!isValid}
			className={cn(
				"relative aspect-square rounded-md p-1 text-sm transition-colors select-none",
				"flex flex-col items-center justify-start",
				!isCurrentMonth && "text-muted-foreground/40",
				isValid && "hover:bg-accent cursor-pointer",
				!isValid && "cursor-not-allowed opacity-50",
				isToday && "ring-primary ring-1",
				isSelected && isValid && "bg-primary/20 ring-primary ring-2"
			)}
		>
			<span
				className={cn(
					"flex h-6 w-6 items-center justify-center rounded-full text-xs",
					isToday && "bg-primary text-primary-foreground"
				)}
			>
				{dayNumber}
			</span>

			{/* availability indicator */}
			{hasAvailability && isValid && (
				<div className="absolute right-1 bottom-1 left-1 flex justify-center gap-0.5">
					{/* show color-coded dots for each participant */}
					{availableParticipants.slice(0, 4).map((p) => (
						<div
							key={p.id}
							className="h-1.5 w-1.5 rounded-full"
							style={{ backgroundColor: p.color || "#3b82f6" }}
						/>
					))}
					{availableParticipants.length > 4 && (
						<span className="text-muted-foreground text-[8px]">+{availableParticipants.length - 4}</span>
					)}
				</div>
			)}

			{/* heat map overlay for valid days with availability */}
			{isValid && hasAvailability && !isSelected && (
				<div
					className="pointer-events-none absolute inset-0 rounded-md"
					style={{
						backgroundColor: `rgba(34, 197, 94, ${intensity * 0.3})`
					}}
				/>
			)}
		</button>
	);
}
