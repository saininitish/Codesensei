import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || "https://mock.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "mock-key";

let supabaseInstance = null;

try {
  // Initialize the Supabase client if URL is somewhat valid
  if (supabaseUrl && supabaseUrl.startsWith('http')) {
    supabaseInstance = createClient(supabaseUrl, supabaseKey);
  }
} catch (e) {
  console.warn("⚠️ Supabase initialization failed. Check your SUPABASE_URL in .env");
}

export const supabase = supabaseInstance;
