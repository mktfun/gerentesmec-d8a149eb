import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const DEFAULT_URL = "https://qtjitszradxsmnilnqtj.supabase.co";
// Get custom URL/Key if set by Monitor (David) in config, otherwise use default
const supabaseUrl = localStorage.getItem('stealth_supabase_url') || DEFAULT_URL;
const supabaseAnonKey = localStorage.getItem('stealth_supabase_anon_key') || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0aml0c3pyYWR4c21uaWxucXRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4Mjk5MTAsImV4cCI6MjA2NTQwNTkxMH0.5X9SiM2Bj6hReTR3eILTCR9R4UMrTBa0tnNGB8R0Pr4";

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);