// supabase-ceasa.js
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// 🔹 DADOS DO SEU SUPABASE
const supabaseUrl = "https://vtwqaqvtzsnapeykikxr.supabase.co";
const supabaseKey = "sb_publishable_5xvqMgxplVeEQ58LqSvUbg_HYiikX9m";

const supabase = createClient(supabaseUrl, supabaseKey);

// 🔹 OBJETO GLOBAL PARA O CEASA
window.CeasaDB = {

  // BUSCAR TODAS AS COMPRAS
  async listar() {
    const { data, error } = await supabase
      .from("ceasa_compras")
      .select("*")
      .order("data_criacao", { ascending: false });

    if (error) {
      console.error("Erro ao buscar compras:", error);
      return [];
    }

    return data || [];
  },

  // SALVAR NOVA COMPRA
  async adicionar(compra) {
    const { error } = await supabase
      .from("ceasa_compras")
      .insert([{
        ...compra,
        data_criacao: new Date().toISOString()
      }]);

    if (error) {
      console.error("Erro ao salvar compra:", error);
      alert("Erro ao salvar no servidor");
    }
  },

  // ATUALIZAR COMPRA
  async atualizar(id, dados) {
    const { error } = await supabase
      .from("ceasa_compras")
      .update(dados)
      .eq("id", id);

    if (error) {
      console.error("Erro ao atualizar compra:", error);
    }
  },

  // REMOVER COMPRA
  async remover(id) {
    const { error } = await supabase
      .from("ceasa_compras")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Erro ao remover compra:", error);
    }
  }
};

console.log("Supabase Ceasa conectado ✅");
