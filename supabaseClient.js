// supabaseClient.js
const SUPABASE_URL = "https://vtwqaqvtzsnapeykikxr.supabase.co";
const SUPABASE_KEY = "sb_publishable_5xvqMgxplVeEQ58LqSvUbg_HYiikX9m";

// O supabase global vem do CDN carregado no HTML
const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

// Exportar para uso global
window.supabaseClient = supabaseClient;

console.log('Supabase Client inicializado ✅');
