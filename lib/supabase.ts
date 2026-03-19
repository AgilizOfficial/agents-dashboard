// Backward compat — re-export browser client as singleton
import { createClient } from "@/lib/supabase/client";
export const supabase = createClient();
