// supabaseClient.js
const SUPABASE_URL = "https://vtwqaqvtzsnapeykikxr.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0d3FhcXZ0enNuYXBleWtpa3hyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxNzkzMzMsImV4cCI6MjA4Mzc1NTMzM30.0as4-IHts660c98znpR_dNDm4_Hz3EScTa11GvNZW64";

// O supabase global vem do CDN carregado no HTML
const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

// Exportar para uso global
window.supabaseClient = supabaseClient;

console.log('Supabase Client inicializado ✅');
