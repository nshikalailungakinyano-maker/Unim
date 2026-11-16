// js/supabaseClient.js
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://uomuplfhkrjhxbhkcfku.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_V47O9q1VLU0GCNUiMISvEA_8J3nK_9f';

// Initialisation et exportation du client Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
