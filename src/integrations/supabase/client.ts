import { createClient } from '@supabase/supabase-js';

// .env se values lein
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    // 👇 YAHAN CHANGE KIYA: localStorage hata kar sessionStorage laga diya
    storage: sessionStorage, 
    persistSession: true,
    autoRefreshToken: true,
  }
});