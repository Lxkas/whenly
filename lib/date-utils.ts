import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    addMonths,
    subMonths,
    isSameMonth,
    isSameDay,
    isWithinInterval,
    parseISO,
    setHours,
    setMinutes,
    addMinutes,
    differenceInMinutes,
    startOfDay,
    endOfDay
} from "date-fns";

// calendar grid helpers
export function getCalendarDays(date: Date): Date[] {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
}

export function getMonthName(date: Date): string {
    return format(date, "MMMM yyyy");
}

export function getDayName(date: Date): string {
    return format(date, "EEEE, MMMM d, yyyy");
}

export function getShortDayName(date: Date): string {
    return format(date, "EEE");
}

export function getDayNumber(date: Date): number {
    return parseInt(format(date, "d"), 10);
}

export function formatTime(date: Date): string {
    return format(date, "h:mm a");
}

export function formatTimeShort(date: Date): string {
    return format(date, "h a");
}

// navigation
export function nextMonth(date: Date): Date {
    return addMonths(date, 1);
}

export function prevMonth(date: Date): Date {
    return subMonths(date, 1);
}

// comparisons
export { isSameMonth, isSameDay, isWithinInterval };

// time grid helpers
export function generateTimeSlots(
    startHour: number = 8,
    endHour: number = 22,
    intervalMinutes: number = 30
): Date[] {
    const baseDate = new Date();
    const slots: Date[] = [];

    let current = setMinutes(setHours(startOfDay(baseDate), startHour), 0);
    const end = setMinutes(setHours(startOfDay(baseDate), endHour), 0);

    while (current <= end) {
        slots.push(current);
        current = addMinutes(current, intervalMinutes);
    }

    return slots;
}

export function getTimeFromDate(date: Date): { hours: number; minutes: number } {
    return {
        hours: date.getHours(),
        minutes: date.getMinutes()
    };
}

export function setTimeOnDate(date: Date, hours: number, minutes: number): Date {
    return setMinutes(setHours(date, hours), minutes);
}

// availability block helpers
export function calculateBlockPosition(
    slotStart: Date,
    dayStart: Date,
    dayEnd: Date,
    containerHeight: number
): { top: number; height: number } {
    const totalMinutes = differenceInMinutes(dayEnd, dayStart);
    const offsetMinutes = differenceInMinutes(slotStart, dayStart);
    const top = (offsetMinutes / totalMinutes) * containerHeight;

    return { top, height: 0 };
}

export function calculateBlockHeight(
    slotStart: Date,
    slotEnd: Date,
    dayStart: Date,
    dayEnd: Date,
    containerHeight: number
): number {
    const totalMinutes = differenceInMinutes(dayEnd, dayStart);
    const blockMinutes = differenceInMinutes(slotEnd, slotStart);

    return (blockMinutes / totalMinutes) * containerHeight;
}

// parse dates from database
export function parseDateString(dateString: string): Date {
    return parseISO(dateString);
}

export function parseTimeString(timeString: string, baseDate: Date = new Date()): Date {
    const [hours, minutes] = timeString.split(":").map(Number);
    return setMinutes(setHours(baseDate, hours), minutes || 0);
}

// date range helpers
export function getDatesInRange(start: Date, end: Date): Date[] {
    return eachDayOfInterval({ start, end });
}

export function isDateInRange(date: Date, start: Date, end: Date): boolean {
    return isWithinInterval(date, { start: startOfDay(start), end: endOfDay(end) });
}

// formatting for database
export function formatDateForDB(date: Date): string {
    return format(date, "yyyy-MM-dd");
}

export function formatTimeForDB(date: Date): string {
    return format(date, "HH:mm:ss");
}

export function formatDateTimeForDB(date: Date): string {
    return date.toISOString();
}
