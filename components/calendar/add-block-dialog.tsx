"use client";

import { useState, useEffect, useMemo } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, setHours, setMinutes } from "date-fns";
import type { NewAvailabilityBlock } from "@/types";

interface AddBlockDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	day: Date;
	timeRange: { start: string; end: string };
	existingBlocks: NewAvailabilityBlock[];
	onSave: (block: NewAvailabilityBlock) => void;
}

// generate time options every 15 minutes
function generateTimeOptions(startHour: number, endHour: number): string[] {
	const options: string[] = [];
	for (let h = startHour; h <= endHour; h++) {
		for (let m = 0; m < 60; m += 15) {
			if (h === endHour && m > 0) break;
			options.push(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`);
		}
	}
	return options;
}

// check if two time blocks overlap
function blocksOverlap(a: NewAvailabilityBlock, b: NewAvailabilityBlock): boolean {
	return a.start < b.end && a.end > b.start;
}

export function AddBlockDialog({ open, onOpenChange, day, timeRange, existingBlocks, onSave }: AddBlockDialogProps) {
	const [startTime, setStartTime] = useState("09:00");
	const [endTime, setEndTime] = useState("10:00");
	const [error, setError] = useState<string | null>(null);

	// parse time range for options
	const startHour = parseInt(timeRange.start.split(":")[0], 10);
	const endHour = parseInt(timeRange.end.split(":")[0], 10);
	const timeOptions = useMemo(() => generateTimeOptions(startHour, endHour), [startHour, endHour]);

	// reset times when dialog opens
	useEffect(() => {
		if (open) {
			setStartTime(timeRange.start);
			// default to 1 hour later
			const defaultEndHour = Math.min(startHour + 1, endHour);
			setEndTime(`${defaultEndHour.toString().padStart(2, "0")}:00`);
			setError(null);
		}
	}, [open, timeRange.start, startHour, endHour]);

	const handleSave = () => {
		setError(null);

		const [startH, startM] = startTime.split(":").map(Number);
		const [endH, endM] = endTime.split(":").map(Number);

		const newStart = setMinutes(setHours(new Date(day), startH), startM);
		const newEnd = setMinutes(setHours(new Date(day), endH), endM);

		// validate end > start
		if (newEnd <= newStart) {
			setError("End time must be after start time");
			return;
		}

		// check minimum duration (15 min)
		if (newEnd.getTime() - newStart.getTime() < 15 * 60 * 1000) {
			setError("Minimum duration is 15 minutes");
			return;
		}

		const newBlock: NewAvailabilityBlock = { start: newStart, end: newEnd };

		// check for overlaps with existing blocks
		const hasOverlap = existingBlocks.some((existing) => blocksOverlap(newBlock, existing));
		if (hasOverlap) {
			setError("This time overlaps with an existing block");
			return;
		}

		onSave(newBlock);
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[400px]">
				<DialogHeader>
					<DialogTitle>Add Availability</DialogTitle>
					<DialogDescription>Add your available time on {format(day, "EEEE, MMMM d")}.</DialogDescription>
				</DialogHeader>

				<div className="grid gap-4 py-4">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>Start Time</Label>
							<Select value={startTime} onValueChange={setStartTime}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{timeOptions.map((time) => (
										<SelectItem key={time} value={time} disabled={time >= endTime}>
											{time}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label>End Time</Label>
							<Select value={endTime} onValueChange={setEndTime}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{timeOptions.map((time) => (
										<SelectItem key={time} value={time} disabled={time <= startTime}>
											{time}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					{error && <p className="text-destructive text-sm">{error}</p>}
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button onClick={handleSave}>Add</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
