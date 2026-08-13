import { createClient } from '@supabase/supabase-js'

// Credenciais públicas (a anon key é feita para ficar no app, protegida por RLS).
// Sozinha ela não lê nada: as policies exigem estar em `autorizados`.
const SUPABASE_URL = 'https://thulkjfgebexnerrtnnr.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRodWxramZnZWJleG5lcnJ0bm5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2NDYyODgsImV4cCI6MjEwMjIyMjI4OH0.xQIfwv3l1_0cVmNr64rkMThrzcoWJoe8UltvZ0PdEZQ'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
