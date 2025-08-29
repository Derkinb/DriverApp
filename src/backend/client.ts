import { createClient, SupabaseClient } from "@supabase/supabase-js";
const SUPABASE_URL = "https://uvjdyykarhamrjtqqjoi.supabase.co"; const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2amR5eWthcmhhbXJqdHFxam9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0OTgyNzcsImV4cCI6MjA3MjA3NDI3N30.Ri1Pe4c1vqi5HQTcliE71IVLeQJ6dmmoxRmccAJemHU";
let client: SupabaseClient | null = null; if(SUPABASE_URL && SUPABASE_ANON_KEY){ client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth:{ persistSession:false } }); }
export const cloud = { enabled: !!client, client };
