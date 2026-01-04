const adjectives = [
	"swift",
	"bright",
	"calm",
	"eager",
	"fair",
	"gentle",
	"happy",
	"jolly",
	"keen",
	"lively",
	"merry",
	"noble",
	"proud",
	"quick",
	"rare",
	"sunny",
	"tender",
	"vivid",
	"warm",
	"zesty"
];

const nouns = [
	"aurora",
	"breeze",
	"canyon",
	"dawn",
	"echo",
	"falcon",
	"grove",
	"haven",
	"isle",
	"jade",
	"karma",
	"lotus",
	"meadow",
	"nebula",
	"oasis",
	"peak",
	"quest",
	"river",
	"summit",
	"tide"
];

function randomElement<T>(arr: T[]): T {
	return arr[Math.floor(Math.random() * arr.length)];
}

function randomSuffix(length: number = 4): string {
	const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
	let result = "";
	for (let i = 0; i < length; i++) {
		result += chars[Math.floor(Math.random() * chars.length)];
	}
	return result;
}

export function generateSlug(): string {
	const adjective = randomElement(adjectives);
	const noun = randomElement(nouns);
	const suffix = randomSuffix(4);

	return `${adjective}-${noun}-${suffix}`;
}

export function generateToken(): string {
	const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
	let result = "";
	for (let i = 0; i < 32; i++) {
		result += chars[Math.floor(Math.random() * chars.length)];
	}
	return result;
}

// participant colors for visual distinction
const participantColors = [
	"#3b82f6", // blue
	"#10b981", // emerald
	"#f59e0b", // amber
	"#ef4444", // red
	"#8b5cf6", // violet
	"#ec4899", // pink
	"#06b6d4", // cyan
	"#84cc16", // lime
	"#f97316", // orange
	"#6366f1" // indigo
];

export function getParticipantColor(index: number): string {
	return participantColors[index % participantColors.length];
}
