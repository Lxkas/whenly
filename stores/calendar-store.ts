import { create } from "zustand";
import { addMonths, subMonths, isSameDay } from "date-fns";
import type { CalendarView } from "@/types";

interface CalendarState {
	currentDate: Date;
	selectedDay: Date | null;
	selectedDays: Date[];
	view: CalendarView;
	isDraggingDays: boolean;
	dragStartDay: Date | null;
	preDragSelection: Date[]; // selection before drag started
	hasDragged: boolean; // whether mouse moved during drag (to distinguish click vs drag)

	setCurrentDate: (date: Date) => void;
	setSelectedDay: (date: Date | null) => void;
	setView: (view: CalendarView) => void;
	goToNextMonth: () => void;
	goToPrevMonth: () => void;

	// day view navigation
	openDay: (date: Date) => void;
	closeDay: () => void;

	// multi-day selection
	toggleDaySelection: (date: Date) => void;
	startDayDrag: (date: Date) => void;
	updateDayDrag: (date: Date) => void;
	endDayDrag: () => boolean; // returns true if was a drag (not just a click)
	clearDaySelection: () => void;
	selectDays: (days: Date[]) => void;
	isDaySelected: (date: Date) => boolean;
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
	currentDate: new Date(),
	selectedDay: null,
	selectedDays: [],
	view: "month",
	isDraggingDays: false,
	dragStartDay: null,
	preDragSelection: [],
	hasDragged: false,

	setCurrentDate: (date) => set({ currentDate: date }),

	setSelectedDay: (date) => set({ selectedDay: date }),

	setView: (view) => set({ view }),

	goToNextMonth: () =>
		set((state) => ({
			currentDate: addMonths(state.currentDate, 1)
		})),

	goToPrevMonth: () =>
		set((state) => ({
			currentDate: subMonths(state.currentDate, 1)
		})),

	openDay: (date) =>
		set({
			selectedDay: date,
			view: "day",
			selectedDays: [] // clear multi-selection when opening day view
		}),

	closeDay: () =>
		set({
			selectedDay: null,
			view: "month"
		}),

	// toggle a single day in multi-selection
	toggleDaySelection: (date) =>
		set((state) => {
			const isSelected = state.selectedDays.some((d) => isSameDay(d, date));
			if (isSelected) {
				return {
					selectedDays: state.selectedDays.filter((d) => !isSameDay(d, date))
				};
			} else {
				return {
					selectedDays: [...state.selectedDays, date]
				};
			}
		}),

	// start dragging across days - don't change selection yet
	startDayDrag: (date) =>
		set((state) => ({
			isDraggingDays: true,
			dragStartDay: date,
			preDragSelection: [...state.selectedDays],
			hasDragged: false
		})),

	// update selection while dragging - add drag range to pre-drag selection
	updateDayDrag: (date) =>
		set((state) => {
			if (!state.isDraggingDays || !state.dragStartDay) return state;

			// mark that actual dragging occurred
			const actuallyDragged = !isSameDay(state.dragStartDay, date);

			// calculate all days between dragStartDay and current date
			const start = state.dragStartDay < date ? state.dragStartDay : date;
			const end = state.dragStartDay < date ? date : state.dragStartDay;

			const draggedDays: Date[] = [];
			const current = new Date(start);
			while (current <= end) {
				draggedDays.push(new Date(current));
				current.setDate(current.getDate() + 1);
			}

			// merge with pre-drag selection (avoid duplicates)
			const merged = [...state.preDragSelection];
			for (const day of draggedDays) {
				if (!merged.some((d) => isSameDay(d, day))) {
					merged.push(day);
				}
			}

			return {
				selectedDays: merged,
				hasDragged: actuallyDragged || state.hasDragged
			};
		}),

	// returns true if was a drag, false if just a click
	endDayDrag: () => {
		const state = get();
		const wasDrag = state.hasDragged;

		set({
			isDraggingDays: false,
			dragStartDay: null,
			preDragSelection: [],
			hasDragged: false
		});

		return wasDrag;
	},

	clearDaySelection: () =>
		set({
			selectedDays: [],
			isDraggingDays: false,
			dragStartDay: null,
			preDragSelection: [],
			hasDragged: false
		}),

	selectDays: (days) => set({ selectedDays: days }),

	isDaySelected: (date) => {
		const state = get();
		return state.selectedDays.some((d) => isSameDay(d, date));
	}
}));
