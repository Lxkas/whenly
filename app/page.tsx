import { CreateEventForm } from "@/components/event/create-event-form";
import { ThemeToggler } from "@/components/ui/theme-toggler";

export default function HomePage() {
    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-4">
            <div className="absolute top-4 right-4">
                <ThemeToggler />
            </div>

            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold mb-2">Whenly</h1>
                <p className="text-muted-foreground">Find the perfect time for everyone</p>
            </div>

            <CreateEventForm />
        </main>
    );
}
