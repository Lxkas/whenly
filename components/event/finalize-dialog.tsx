"use client";

import { useState } from "react";
import { useFinalizeEvent } from "@/hooks/use-event";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, setHours, setMinutes } from "date-fns";
import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar01Icon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import type { Event } from "@/lib/supabase/types";

interface FinalizeDialogProps {
	event: Event;
}

const TIME_OPTIONS = Array.from({ length: 24 }, (_, i) => {
	const hour = i.toString().padStart(2, "0");
	return [`${hour}:00`, `${hour}:30`];
}).flat();

export function FinalizeDialog({ event }: FinalizeDialogProps) {
	const [open, setOpen] = useState(false);
	const [selectedDate, setSelectedDate] = useState<Date>();
	const [startTime, setStartTime] = useState("09:00");
	const [endTime, setEndTime] = useState("10:00");
	const finalizeEvent = useFinalizeEvent();

	const handleFinalize = async () => {
		if (!selectedDate) return;

		const [startHour, startMin] = startTime.split(":").map(Number);
		const [endHour, endMin] = endTime.split(":").map(Number);

		const start = setMinutes(setHours(selectedDate, startHour), startMin);
		const end = setMinutes(setHours(selectedDate, endHour), endMin);

		await finalizeEvent.mutateAsync({
			id: event.id,
			slug: event.slug,
			start,
			end
		});

		setOpen(false);
	};

	const isFinalized = !!event.finalized_start;

	if (isFinalized) {
		return (
			<div className="flex items-center gap-2 text-green-600 dark:text-green-400">
				<HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-5" />
				<span className="text-sm font-medium">Event finalized</span>
			</div>
		);
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button>Finalize Event</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Finalize Event Time</DialogTitle>
					<DialogDescription>Choose the final date and time for this event.</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-4">
					<div className="space-y-2">
						<Label>Date</Label>
						<Popover>
							<PopoverTrigger asChild>
								<Button variant="outline" className="w-full justify-start text-left font-normal">
									<HugeiconsIcon icon={Calendar01Icon} className="mr-2 size-4" />
									{selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-auto p-0">
								<Calendar
									mode="single"
									selected={selectedDate}
									onSelect={setSelectedDate}
									disabled={{ before: new Date() }}
								/>
							</PopoverContent>
						</Popover>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>Start Time</Label>
							<Select value={startTime} onValueChange={setStartTime}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{TIME_OPTIONS.map((time) => (
										<SelectItem key={time} value={time}>
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
									{TIME_OPTIONS.map((time) => (
										<SelectItem key={time} value={time}>
											{time}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => setOpen(false)}>
						Cancel
					</Button>
					<Button onClick={handleFinalize} disabled={!selectedDate || finalizeEvent.isPending}>
						{finalizeEvent.isPending ? "Finalizing..." : "Confirm"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
