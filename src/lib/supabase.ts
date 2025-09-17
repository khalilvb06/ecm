import { createClient } from "@supabase/supabase-js";

// Centralized Supabase client for the whole app
// Usage: import { supabase } from "@/lib/supabase";

const supabaseUrl = 'https://onkdmgqbkknulmqccoex.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ua2RtZ3Fia2tudWxtcWNjb2V4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NTgyNjEsImV4cCI6MjA2NzAzNDI2MX0.nGC1ohKBaJfJrabPK5VfXjqwZu1rRXA0vNEaZgNwz34';

export const supabase = createClient(supabaseUrl, supabaseKey);

export type SupabaseClientType = typeof supabase;


