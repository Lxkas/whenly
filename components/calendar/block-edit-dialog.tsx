"use client";

import { useState, useEffect } from "react";
import { useSelectionStore } from "@/stores/selection-store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupabaseBrowser } from "@/lib/supabase/client";
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

interface BlockEditDialogProps {
	eventId: string;
	eventSlug: string;
	day: Date;
	timeRange: { start: string; end: string };
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

export function BlockEditDialog({ eventId, eventSlug, day, timeRange }: BlockEditDialogProps) {
	const supabase = useSupabaseBrowser();
	const queryClient = useQueryClient();
	const { dialogBlock, closeEditDialog } = useSelectionStore();

	const [startTime, setStartTime] = useState("09:00");
	const [endTime, setEndTime] = useState("10:00");

	// parse time range for options
	const startHour = parseInt(timeRange.start.split(":")[0], 10);
	const endHour = parseInt(timeRange.end.split(":")[0], 10);
	const timeOptions = generateTimeOptions(startHour, endHour);

	// initialize times from dialog block
	useEffect(() => {
		if (dialogBlock) {
			setStartTime(format(dialogBlock.start, "HH:mm"));
			setEndTime(format(dialogBlock.end, "HH:mm"));
		}
	}, [dialogBlock]);

	const updateMutation = useMutation({
		mutationFn: async () => {
			if (!dialogBlock) return;

			const [startH, startM] = startTime.split(":").map(Number);
			const [endH, endM] = endTime.split(":").map(Number);

			const newStart = setMinutes(setHours(day, startH), startM);
			const newEnd = setMinutes(setHours(day, endH), endM);

			const { error } = await supabase
				.from("availability")
				.update({
					slot_start: newStart.toISOString(),
					slot_end: newEnd.toISOString()
				})
				.eq("id", dialogBlock.id);

			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["event", eventSlug] });
			closeEditDialog();
		}
	});

	const deleteMutation = useMutation({
		mutationFn: async () => {
			if (!dialogBlock) return;

			const { error } = await supabase.from("availability").delete().eq("id", dialogBlock.id);

			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["event", eventSlug] });
			closeEditDialog();
		}
	});

	const handleSave = () => {
		updateMutation.mutate();
	};

	const handleDelete = () => {
		deleteMutation.mutate();
	};

	const isPending = updateMutation.isPending || deleteMutation.isPending;

	return (
		<Dialog open={!!dialogBlock} onOpenChange={(open) => !open && closeEditDialog()}>
			<DialogContent className="sm:max-w-[400px]">
				<DialogHeader>
					<DialogTitle>Edit Availability</DialogTitle>
					<DialogDescription>
						Adjust the time range for this availability block on {format(day, "MMMM d, yyyy")}.
					</DialogDescription>
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
				</div>

				<DialogFooter className="flex justify-between sm:justify-between">
					<Button variant="destructive" onClick={handleDelete} disabled={isPending}>
						Delete
					</Button>
					<div className="flex gap-2">
						<Button variant="outline" onClick={closeEditDialog} disabled={isPending}>
							Cancel
						</Button>
						<Button onClick={handleSave} disabled={isPending}>
							{updateMutation.isPending ? "Saving..." : "Save"}
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
