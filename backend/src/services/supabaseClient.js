import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || "mock-url";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "mock-key";

// Initialize the Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);
