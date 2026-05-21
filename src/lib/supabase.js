import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://endskypeazfotxpnyrzr.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVuZHNreXBlYXpmb3R4cG55cnpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyODE3MTEsImV4cCI6MjA5NDg1NzcxMX0.QRXUfbQZpgPEEI2VWeeCZl52r_ffE7EJGfMet7gpfbY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true }
})
