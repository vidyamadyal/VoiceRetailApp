import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://vjqjqcyglovugglhyzpk.supabase.co";  // from Project Settings → API
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqcWpxY3lnbG92dWdnbGh5enBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1Nzk5ODcsImV4cCI6MjA3MjE1NTk4N30.Th-33qhp1udnmPgWsc8YpVmoUVtky6sGgcaZcHBXUJ0"; // the long anon public key
export const supabase = createClient(supabaseUrl, supabaseKey);
