import { CreateEventForm } from "@/components/event/create-event-form";
import { ThemeToggler } from "@/components/ui/theme-toggler";

export default function HomePage() {
	return (
		<main className="flex min-h-screen flex-col items-center justify-center p-4">
			<div className="absolute top-4 right-4">
				<ThemeToggler />
			</div>

			<div className="mb-8 text-center">
				<h1 className="mb-2 text-4xl font-bold">Whenly</h1>
				<p className="text-muted-foreground">Find the perfect time for everyone</p>
			</div>

			<CreateEventForm />
		</main>
	);
}
