import { create } from "zustand";
import type { NewAvailabilityBlock } from "@/types";

interface DragPosition {
    y: number;
    time: Date;
}

type EditMode = "move" | "resize-top" | "resize-bottom" | null;

interface SelectionState {
    // creating new blocks
    isDragging: boolean;
    dragStart: DragPosition | null;
    dragEnd: DragPosition | null;

    // editing existing blocks
    editMode: EditMode;
    editingBlockId: string | null;
    editingBlockOriginal: NewAvailabilityBlock | null;
    editingBlockCurrent: NewAvailabilityBlock | null;
    editStartY: number | null;

    // block being edited in dialog
    dialogBlock: { id: string; start: Date; end: Date } | null;

    // existing blocks for collision detection
    existingBlocks: NewAvailabilityBlock[];

    // actions for creating
    startDrag: (y: number, time: Date) => void;
    updateDrag: (y: number, time: Date, existingBlocks: NewAvailabilityBlock[]) => void;
    endDrag: (existingBlocks: NewAvailabilityBlock[]) => NewAvailabilityBlock | null;

    // actions for editing
    startEditBlock: (id: string, block: NewAvailabilityBlock, mode: "move" | "resize-top" | "resize-bottom", y: number) => void;
    updateEditBlock: (y: number, time: Date, gridStartTime: Date, gridEndTime: Date, existingBlocks: NewAvailabilityBlock[]) => void;
    endEditBlock: () => { id: string; block: NewAvailabilityBlock } | null;
    cancelEditBlock: () => void;

    // dialog actions
    openEditDialog: (id: string, start: Date, end: Date) => void;
    closeEditDialog: () => void;
    updateDialogBlock: (start: Date, end: Date) => void;
}

// check if two time blocks overlap
function blocksOverlap(a: NewAvailabilityBlock, b: NewAvailabilityBlock): boolean {
    return a.start < b.end && a.end > b.start;
}

// check if a block overlaps with any existing blocks (excluding itself by ID)
function hasCollision(
    block: NewAvailabilityBlock,
    existingBlocks: NewAvailabilityBlock[],
    excludeId?: string
): boolean {
    return existingBlocks.some((existing) => {
        // skip self if editing
        if (excludeId && (existing as { id?: string }).id === excludeId) return false;
        return blocksOverlap(block, existing);
    });
}

export const useSelectionStore = create<SelectionState>((set, get) => ({
    isDragging: false,
    dragStart: null,
    dragEnd: null,
    editMode: null,
    editingBlockId: null,
    editingBlockOriginal: null,
    editingBlockCurrent: null,
    editStartY: null,
    dialogBlock: null,
    existingBlocks: [],

    // creating new blocks
    startDrag: (y, time) =>
        set({
            isDragging: true,
            dragStart: { y, time },
            dragEnd: { y, time }
        }),

    updateDrag: (y, time, existingBlocks) =>
        set((state) => {
            if (!state.isDragging || !state.dragStart) return state;

            // check if proposed block would overlap with existing
            const proposedStart = state.dragStart.time < time ? state.dragStart.time : time;
            const proposedEnd = state.dragStart.time < time ? time : state.dragStart.time;
            const proposedBlock = { start: proposedStart, end: proposedEnd };

            // if collision, don't update the end position
            if (hasCollision(proposedBlock, existingBlocks)) {
                return state;
            }

            return {
                dragEnd: { y, time }
            };
        }),

    endDrag: (existingBlocks) => {
        const state = get();
        if (!state.dragStart || !state.dragEnd) {
            set({ isDragging: false, dragStart: null, dragEnd: null });
            return null;
        }

        const start = state.dragStart.time < state.dragEnd.time ? state.dragStart.time : state.dragEnd.time;
        const end = state.dragStart.time < state.dragEnd.time ? state.dragEnd.time : state.dragStart.time;

        // must have at least 15 minutes
        if (end.getTime() - start.getTime() < 15 * 60 * 1000) {
            set({ isDragging: false, dragStart: null, dragEnd: null });
            return null;
        }

        const newBlock: NewAvailabilityBlock = { start, end };

        // check for collision before creating
        if (hasCollision(newBlock, existingBlocks)) {
            set({ isDragging: false, dragStart: null, dragEnd: null });
            return null;
        }

        set({
            isDragging: false,
            dragStart: null,
            dragEnd: null
        });

        return newBlock;
    },

    // editing existing blocks - start immediately
    startEditBlock: (id, block, mode, y) =>
        set({
            editMode: mode,
            editingBlockId: id,
            // clone the block to avoid reference issues
            editingBlockOriginal: { start: new Date(block.start), end: new Date(block.end) },
            editingBlockCurrent: { start: new Date(block.start), end: new Date(block.end) },
            editStartY: y
        }),

    updateEditBlock: (y, time, gridStartTime, gridEndTime, existingBlocks) =>
        set((state) => {
            if (!state.editMode || !state.editingBlockOriginal || state.editStartY === null) return state;

            const original = state.editingBlockOriginal;
            const duration = original.end.getTime() - original.start.getTime();

            let newBlock: NewAvailabilityBlock;

            if (state.editMode === "move") {
                // calculate time delta based on mouse movement
                const deltaY = y - state.editStartY;
                // convert pixels to time (roughly 1px = 1 min at 60px/hour)
                const deltaMs = deltaY * 60 * 1000;

                let newStart = new Date(original.start.getTime() + deltaMs);
                let newEnd = new Date(original.end.getTime() + deltaMs);

                // snap to 15 minute intervals
                const snapMs = 15 * 60 * 1000;
                newStart = new Date(Math.round(newStart.getTime() / snapMs) * snapMs);
                newEnd = new Date(newStart.getTime() + duration);

                // clamp to grid bounds
                if (newStart < gridStartTime) {
                    newStart = gridStartTime;
                    newEnd = new Date(newStart.getTime() + duration);
                }
                if (newEnd > gridEndTime) {
                    newEnd = gridEndTime;
                    newStart = new Date(newEnd.getTime() - duration);
                }

                newBlock = { start: newStart, end: newEnd };
            } else if (state.editMode === "resize-top") {
                // snap time to 15 minute intervals
                const snapMs = 15 * 60 * 1000;
                let newStart = new Date(Math.round(time.getTime() / snapMs) * snapMs);

                if (newStart < gridStartTime) newStart = gridStartTime;
                if (newStart >= original.end) newStart = new Date(original.end.getTime() - 15 * 60 * 1000);

                newBlock = { start: newStart, end: original.end };
            } else {
                // snap time to 15 minute intervals
                const snapMs = 15 * 60 * 1000;
                let newEnd = new Date(Math.round(time.getTime() / snapMs) * snapMs);

                if (newEnd > gridEndTime) newEnd = gridEndTime;
                if (newEnd <= original.start) newEnd = new Date(original.start.getTime() + 15 * 60 * 1000);

                newBlock = { start: original.start, end: newEnd };
            }

            // check for collision with other blocks (excluding self)
            if (hasCollision(newBlock, existingBlocks, state.editingBlockId || undefined)) {
                return state; // don't update if would cause collision
            }

            return { editingBlockCurrent: newBlock };
        }),

    endEditBlock: () => {
        const state = get();

        // clear all editing state
        set({
            editMode: null,
            editingBlockId: null,
            editingBlockOriginal: null,
            editingBlockCurrent: null,
            editStartY: null
        });

        // only return result if block position actually changed
        if (!state.editingBlockId || !state.editingBlockCurrent || !state.editingBlockOriginal) {
            return null;
        }

        // check if position actually changed
        const orig = state.editingBlockOriginal;
        const curr = state.editingBlockCurrent;
        if (orig.start.getTime() === curr.start.getTime() && orig.end.getTime() === curr.end.getTime()) {
            return null;
        }

        return {
            id: state.editingBlockId,
            block: state.editingBlockCurrent
        };
    },

    cancelEditBlock: () =>
        set({
            editMode: null,
            editingBlockId: null,
            editingBlockOriginal: null,
            editingBlockCurrent: null,
            editStartY: null
        }),

    // dialog actions
    openEditDialog: (id, start, end) =>
        set({
            dialogBlock: { id, start, end }
        }),

    closeEditDialog: () => set({ dialogBlock: null }),

    updateDialogBlock: (start, end) =>
        set((state) => {
            if (!state.dialogBlock) return state;
            return {
                dialogBlock: { ...state.dialogBlock, start, end }
            };
        })
}));
