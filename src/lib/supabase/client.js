import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL is not set. Please add it to your .env.local file.",
  );
}
if (!supabaseAnonKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. Please add it to your .env.local file.",
  );
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
