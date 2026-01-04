"use client";

import { useSelectionStore } from "@/stores/selection-store";
import { AvailabilityBlock } from "./availability-block";
import type { Availability } from "@/lib/supabase/types";

interface AvailabilityWithParticipant extends Availability {
	participantId: string;
	participantName: string;
	participantColor: string;
}

interface AvailabilityLayerProps {
	availability: AvailabilityWithParticipant[];
	startHour: number;
	totalHours: number;
	hourHeight: number;
	currentParticipantId?: string;
}

export function AvailabilityLayer({
	availability,
	startHour,
	totalHours,
	hourHeight,
	currentParticipantId
}: AvailabilityLayerProps) {
	const { editingBlockId, editingBlockCurrent } = useSelectionStore();

	// group availability by participant for layering
	const participantIds = [...new Set(availability.map((a) => a.participantId))];
	const participantCount = participantIds.length;

	// calculate width offset for each participant to show overlapping blocks
	const getParticipantOffset = (participantId: string): { left: string; width: string } => {
		const index = participantIds.indexOf(participantId);
		if (participantCount <= 1) {
			return { left: "0%", width: "100%" };
		}
		// stack blocks horizontally with overlap
		const widthPercent = 100 / participantCount + 20; // slight overlap
		const leftPercent = (index * (100 - widthPercent)) / (participantCount - 1);
		return {
			left: `${leftPercent}%`,
			width: `${widthPercent}%`
		};
	};

	return (
		<>
			{availability.map((a) => {
				const offset = getParticipantOffset(a.participantId);
				const isOwn = a.participantId === currentParticipantId;
				const isEditing = a.id === editingBlockId;

				return (
					<AvailabilityBlock
						key={a.id}
						block={{
							id: a.id,
							participantId: a.participantId,
							participantName: a.participantName,
							participantColor: a.participantColor,
							start: new Date(a.slot_start),
							end: new Date(a.slot_end)
						}}
						startHour={startHour}
						totalHours={totalHours}
						hourHeight={hourHeight}
						style={offset}
						isOwn={isOwn}
						isEditing={isEditing}
						editedBlock={isEditing ? editingBlockCurrent : null}
					/>
				);
			})}
		</>
	);
}
