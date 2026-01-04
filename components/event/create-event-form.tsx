"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { DateRange } from "react-day-picker";
import { useCreateEvent } from "@/hooks/use-event";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import type { DateMode } from "@/types";

// hook to detect mobile screen size for responsive calendar
function useIsMobile() {
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		const checkMobile = () => setIsMobile(window.innerWidth < 640);
		checkMobile();
		window.addEventListener("resize", checkMobile);
		return () => window.removeEventListener("resize", checkMobile);
	}, []);

	return isMobile;
}

const formSchema = z.object({
	title: z.string().min(1, "Title is required"),
	description: z.string().optional(),
	hostName: z.string().min(1, "Your name is required"),
	dateMode: z.enum(["range", "specific"]),
	timeRangeStart: z.string().optional(),
	timeRangeEnd: z.string().optional()
});

type FormData = z.infer<typeof formSchema>;

const TIME_OPTIONS = [
	"06:00",
	"07:00",
	"08:00",
	"09:00",
	"10:00",
	"11:00",
	"12:00",
	"13:00",
	"14:00",
	"15:00",
	"16:00",
	"17:00",
	"18:00",
	"19:00",
	"20:00",
	"21:00",
	"22:00",
	"23:00"
];

export function CreateEventForm() {
	const router = useRouter();
	const createEvent = useCreateEvent();
	const isMobile = useIsMobile();
	const [dateMode, setDateMode] = useState<DateMode>("range");
	const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
	const [specificDates, setSpecificDates] = useState<Date[]>([]);

	const {
		register,
		handleSubmit,
		formState: { errors },
		setValue,
		watch
	} = useForm<FormData>({
		defaultValues: {
			dateMode: "range",
			timeRangeStart: "09:00",
			timeRangeEnd: "18:00"
		}
	});

	const onSubmit = async (data: FormData) => {
		try {
			const result = await createEvent.mutateAsync({
				title: data.title,
				description: data.description,
				hostName: data.hostName,
				dateMode: data.dateMode,
				dateRangeStart: dateRange?.from,
				dateRangeEnd: dateRange?.to,
				specificDates: specificDates,
				timeRangeStart: data.timeRangeStart,
				timeRangeEnd: data.timeRangeEnd,
				timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
			});

			router.push(`/e/${result.event.slug}`);
		} catch (error) {
			console.error("Failed to create event:", error);
		}
	};

	const handleDateModeChange = (mode: DateMode) => {
		setDateMode(mode);
		setValue("dateMode", mode);
		setDateRange(undefined);
		setSpecificDates([]);
	};

	return (
		<Card className="w-full max-w-lg">
			<CardHeader>
				<CardTitle>Create a New Event</CardTitle>
				<CardDescription>Set up your event and share it with others to find the best time.</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
					{/* title */}
					<div className="space-y-2">
						<Label htmlFor="title">Event Title</Label>
						<Input
							id="title"
							placeholder="Team lunch, Project meeting..."
							{...register("title", { required: "Title is required" })}
						/>
						{errors.title && <p className="text-destructive text-sm">{errors.title.message}</p>}
					</div>

					{/* description */}
					<div className="space-y-2">
						<Label htmlFor="description">Description (optional)</Label>
						<Textarea
							id="description"
							placeholder="Add any details about the event..."
							{...register("description")}
						/>
					</div>

					{/* host name */}
					<div className="space-y-2">
						<Label htmlFor="hostName">Your Name</Label>
						<Input
							id="hostName"
							placeholder="Enter your name"
							{...register("hostName", { required: "Your name is required" })}
						/>
						{errors.hostName && <p className="text-destructive text-sm">{errors.hostName.message}</p>}
					</div>

					{/* date mode selection */}
					<div className="space-y-2">
						<Label>Date Selection Mode</Label>
						<div className="flex gap-2">
							<Button
								type="button"
								variant={dateMode === "range" ? "default" : "outline"}
								size="sm"
								onClick={() => handleDateModeChange("range")}
							>
								Date Range
							</Button>
							<Button
								type="button"
								variant={dateMode === "specific" ? "default" : "outline"}
								size="sm"
								onClick={() => handleDateModeChange("specific")}
							>
								Specific Dates
							</Button>
						</div>
					</div>

					{/* date picker */}
					<div className="space-y-2">
						<Label>{dateMode === "range" ? "Select Date Range" : "Select Dates"}</Label>
						<Popover>
							<PopoverTrigger asChild>
								<Button
									variant="outline"
									className={cn(
										"w-full justify-start text-left font-normal",
										!dateRange?.from && specificDates.length === 0 && "text-muted-foreground"
									)}
								>
									<HugeiconsIcon icon={Calendar01Icon} className="mr-2 size-4" />
									{dateMode === "range" ? (
										dateRange?.from ? (
											dateRange.to ? (
												<>
													{format(dateRange.from, "LLL dd, y")} -{" "}
													{format(dateRange.to, "LLL dd, y")}
												</>
											) : (
												format(dateRange.from, "LLL dd, y")
											)
										) : (
											"Pick a date range"
										)
									) : specificDates.length > 0 ? (
										`${specificDates.length} date(s) selected`
									) : (
										"Pick dates"
									)}
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-auto p-0" align="start">
								{dateMode === "range" ? (
									<Calendar
										mode="range"
										selected={dateRange}
										onSelect={setDateRange}
										numberOfMonths={isMobile ? 1 : 2}
										disabled={{ before: new Date() }}
									/>
								) : (
									<Calendar
										mode="multiple"
										selected={specificDates}
										onSelect={(dates) => setSpecificDates(dates || [])}
										numberOfMonths={isMobile ? 1 : 2}
										disabled={{ before: new Date() }}
									/>
								)}
							</PopoverContent>
						</Popover>
					</div>

					{/* time range */}
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>Start Time</Label>
							<Select defaultValue="09:00" onValueChange={(value) => setValue("timeRangeStart", value)}>
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
							<Select defaultValue="18:00" onValueChange={(value) => setValue("timeRangeEnd", value)}>
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

					{/* submit */}
					<Button type="submit" className="w-full" disabled={createEvent.isPending}>
						{createEvent.isPending ? "Creating..." : "Create Event"}
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}
