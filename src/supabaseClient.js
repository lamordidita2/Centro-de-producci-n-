import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://hjiopknrpbbcxjrmluej.supabase.co";
const supabaseKey = "sb_publishable_pZL1KTyU9wk_FYPA0llW4w_GOLVvjdY";

export const supabase = createClient(supabaseUrl, supabaseKey);
