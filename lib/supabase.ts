import { createClient } from '@supabase/supabase-js';

// Configuration based on provided credentials
// Project ID extracted from URL: wxyvknzmjycfsfszsgbv
const SUPABASE_URL = 'https://wxyvknzmjycfsfszsgbv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4eXZrbnptanljZnNmc3pzZ2J2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1ODE5NzQsImV4cCI6MjA3NDE1Nzk3NH0.O3Uv4eI668rZLV2k-rNpGzp3qzAM7okLLIyTQNyNIcE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);