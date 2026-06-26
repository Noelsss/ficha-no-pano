import { createClient } from '@supabase/supabase-js'

// Credenciais públicas (a anon key é feita para ficar no app, protegida por RLS).
const SUPABASE_URL = 'https://zdmspyprtdassvvletti.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkbXNweXBydGRhc3N2dmxldHRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0OTk5MjEsImV4cCI6MjA5ODA3NTkyMX0.yJWJdzYX_M5JKxRxfQ4hhnb2IRoeJUnqve8c_aFYvd4'

// E-mail do administrador (quem pode registrar/editar). Deve bater com o RLS.
export const ADMIN_EMAIL = 'glbrpinto@gmail.com'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
