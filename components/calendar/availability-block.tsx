"use client";

import { useCallback } from "react";
import { formatTime } from "@/lib/date-utils";
import { useSelectionStore } from "@/stores/selection-store";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { AvailabilityBlock as AvailabilityBlockType } from "@/types";

interface AvailabilityBlockProps {
    block: AvailabilityBlockType;
    startHour: number;
    totalHours: number;
    hourHeight: number;
    style?: { left: string; width: string };
    isPending?: boolean;
    isOwn?: boolean;
    isEditing?: boolean;
    editedBlock?: { start: Date; end: Date } | null;
}

export function AvailabilityBlock({
    block,
    startHour,
    totalHours,
    hourHeight,
    style,
    isPending,
    isOwn,
    isEditing,
    editedBlock
}: AvailabilityBlockProps) {
    const { startEditBlock, openEditDialog, cancelEditBlock } = useSelectionStore();

    // use edited values if editing, otherwise use original
    const displayStart = isEditing && editedBlock ? editedBlock.start : block.start;
    const displayEnd = isEditing && editedBlock ? editedBlock.end : block.end;

    // calculate position
    const startMinutes = displayStart.getHours() * 60 + displayStart.getMinutes();
    const endMinutes = displayEnd.getHours() * 60 + displayEnd.getMinutes();
    const dayStartMinutes = startHour * 60;
    const totalMinutes = totalHours * 60;

    const top = ((startMinutes - dayStartMinutes) / totalMinutes) * (totalHours * hourHeight);
    const height = ((endMinutes - startMinutes) / totalMinutes) * (totalHours * hourHeight);

    const blockStyle = {
        top: `${top}px`,
        height: `${Math.max(height, 20)}px`,
        left: style?.left || "0%",
        width: style?.width || "100%",
        backgroundColor: isPending ? "rgba(59, 130, 246, 0.5)" : `${block.participantColor}40`
    };

    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            if (!isOwn || isPending) return;
            e.stopPropagation();
            e.preventDefault();
            startEditBlock(block.id, { start: block.start, end: block.end }, "move", e.clientY);
        },
        [isOwn, isPending, block.id, block.start, block.end, startEditBlock]
    );

    const handleResizeTopMouseDown = useCallback(
        (e: React.MouseEvent) => {
            if (!isOwn || isPending) return;
            e.stopPropagation();
            e.preventDefault();
            startEditBlock(block.id, { start: block.start, end: block.end }, "resize-top", e.clientY);
        },
        [isOwn, isPending, block.id, block.start, block.end, startEditBlock]
    );

    const handleResizeBottomMouseDown = useCallback(
        (e: React.MouseEvent) => {
            if (!isOwn || isPending) return;
            e.stopPropagation();
            e.preventDefault();
            startEditBlock(block.id, { start: block.start, end: block.end }, "resize-bottom", e.clientY);
        },
        [isOwn, isPending, block.id, block.start, block.end, startEditBlock]
    );

    const handleDoubleClick = useCallback(
        (e: React.MouseEvent) => {
            if (!isOwn || isPending) return;
            e.stopPropagation();
            e.preventDefault();
            // cancel any in-progress editing before opening dialog
            cancelEditBlock();
            openEditDialog(block.id, block.start, block.end);
        },
        [isOwn, isPending, block.id, block.start, block.end, openEditDialog, cancelEditBlock]
    );

    const content = (
        <div
            className={cn(
                "absolute rounded-sm text-xs overflow-hidden",
                "border-l-2 transition-opacity",
                isPending && "border-dashed animate-pulse",
                isOwn && !isPending && "cursor-move",
                isEditing && "ring-2 ring-primary z-10"
            )}
            style={{
                ...blockStyle,
                borderLeftColor: block.participantColor
            }}
            onMouseDown={handleMouseDown}
            onDoubleClick={handleDoubleClick}
        >
            {/* resize handle top */}
            {isOwn && !isPending && (
                <div
                    className="absolute top-0 left-0 right-0 h-2 cursor-n-resize hover:bg-primary/20 transition-colors"
                    onMouseDown={handleResizeTopMouseDown}
                />
            )}

            {/* content */}
            <div className="px-1 py-0.5 pointer-events-none">
                <div className="font-medium truncate" style={{ color: block.participantColor }}>
                    {block.participantName}
                </div>
                {height > 30 && (
                    <div className="text-[10px] text-muted-foreground">
                        {formatTime(displayStart)} - {formatTime(displayEnd)}
                    </div>
                )}
            </div>

            {/* resize handle bottom */}
            {isOwn && !isPending && (
                <div
                    className="absolute bottom-0 left-0 right-0 h-2 cursor-s-resize hover:bg-primary/20 transition-colors"
                    onMouseDown={handleResizeBottomMouseDown}
                />
            )}
        </div>
    );

    // always use the same DOM structure to preserve double-click detection
    // disable tooltip when editing or pending to avoid interference
    const showTooltip = !isPending && !isEditing;

    return (
        <TooltipProvider>
            <Tooltip open={showTooltip ? undefined : false}>
                <TooltipTrigger asChild>{content}</TooltipTrigger>
                <TooltipContent>
                    <p className="font-medium">{block.participantName}</p>
                    <p className="text-xs text-muted-foreground">
                        {formatTime(displayStart)} - {formatTime(displayEnd)}
                    </p>
                    {isOwn && <p className="text-xs text-muted-foreground mt-1">Double-click to edit times</p>}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
