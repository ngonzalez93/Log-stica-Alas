// ============================================================
//  Configuración de Supabase (login del equipo)
//  ------------------------------------------------------------
//  Reemplazá estos dos valores por los de TU proyecto Supabase:
//    Supabase → Project Settings → API
//      - Project URL      →  SUPABASE_URL
//      - anon / public key →  SUPABASE_ANON_KEY
//
//  La "anon key" es pública por diseño: puede ir en el código.
//  NO pongas aquí la "service_role" key.
// ============================================================
window.SUPABASE_CONFIG = {
  url: "https://zaspadkyergjncbmeryx.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inphc3BhZGt5ZXJnam5jYm1lcnl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2Mjg3NzksImV4cCI6MjEwMDIwNDc3OX0.UZ44oIsM-7fmHzXg8vuFo1wMlsULfZeCe7Ox4jtNdqo",

  // Login por USUARIO (no email). El usuario escribe solo su nombre; internamente
  // se arma "usuario@<usernameDomain>" para Supabase Auth. Al crear cada usuario
  // en Supabase, usá este mismo dominio (ej: juan@alas.local) y marcá "Auto Confirm".
  usernameDomain: "alas.local"
};
