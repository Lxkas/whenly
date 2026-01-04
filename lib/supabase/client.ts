import { createBrowserClient } from "@supabase/ssr";
import { useMemo } from "react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

let client: ReturnType<typeof createBrowserClient> | undefined;

function getSupabaseBrowserClient() {
	if (client) return client;
	client = createBrowserClient(supabaseUrl, supabaseKey);
	return client;
}

export function useSupabaseBrowser() {
	return useMemo(getSupabaseBrowserClient, []);
}

export const createClient = () => createBrowserClient(supabaseUrl, supabaseKey);
