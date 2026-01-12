/**
 * AUTH MANAGER - Sistema de Autenticação Profissional
 * Gerencia usuários, login, permissões e sessões
 * Integrado com Supabase
 */

const AuthManager = (() => {
  // Singleton pattern para autenticação
  const state = {
    currentUser: null,
    session: null,
    permissions: {},
    isAuthenticated: false,
  };

  // Carregar usuário do localStorage
  const loadSessionFromStorage = () => {
    try {
      const stored = localStorage.getItem('guf_session');
      if (stored) {
        const data = JSON.parse(stored);
        state.currentUser = data.user;
        state.session = data.token;
        state.isAuthenticated = true;
        return true;
      }
    } catch (err) {
      console.error('Erro ao carregar sessão:', err);
    }
    return false;
  };

  // Salvar sessão
  const saveSession = (user, token) => {
    try {
      localStorage.setItem('guf_session', JSON.stringify({
        user,
        token,
        timestamp: Date.now(),
      }));
      state.currentUser = user;
      state.session = token;
      state.isAuthenticated = true;
    } catch (err) {
      console.error('Erro ao salvar sessão:', err);
    }
  };

  // Limpar sessão
  const clearSession = () => {
    try {
      localStorage.removeItem('guf_session');
      state.currentUser = null;
      state.session = null;
      state.isAuthenticated = false;
      state.permissions = {};
    } catch (err) {
      console.error('Erro ao limpar sessão:', err);
    }
  };

  // Login com email/senha (exemplo com Supabase)
  const login = async (email, password) => {
    try {
      if (!supabase) throw new Error('Supabase não inicializado');

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const userData = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name || email,
        avatar: data.user.user_metadata?.avatar_url || null,
        role: data.user.user_metadata?.role || 'user',
      };

      saveSession(userData, data.session.access_token);
      await loadPermissions(userData.role);

      return {
        success: true,
        user: userData,
      };
    } catch (err) {
      console.error('Erro ao fazer login:', err);
      return {
        success: false,
        error: err.message,
      };
    }
  };

  // Logout
  const logout = async () => {
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
      clearSession();
      return { success: true };
    } catch (err) {
      console.error('Erro ao fazer logout:', err);
      return { success: false, error: err.message };
    }
  };

  // Carregar permissões do usuário
  const loadPermissions = async (role) => {
    try {
      const permissions = {
        admin: ['create', 'read', 'update', 'delete', 'manage_users', 'view_reports', 'export_data'],
        manager: ['create', 'read', 'update', 'delete', 'view_reports'],
        user: ['read', 'create'],
      };

      state.permissions = permissions[role] || permissions.user;
      localStorage.setItem('guf_permissions', JSON.stringify(state.permissions));
    } catch (err) {
      console.error('Erro ao carregar permissões:', err);
    }
  };

  // Verificar permissão
  const hasPermission = (permission) => {
    return state.permissions?.includes(permission) || false;
  };

  // Registrar novo usuário
  const register = async (email, password, name) => {
    try {
      if (!supabase) throw new Error('Supabase não inicializado');

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role: 'user',
          },
        },
      });

      if (error) throw error;

      return {
        success: true,
        user: data.user,
        message: 'Usuário criado com sucesso. Verifique seu email.',
      };
    } catch (err) {
      console.error('Erro ao registrar:', err);
      return {
        success: false,
        error: err.message,
      };
    }
  };

  // Redefinir senha
  const resetPassword = async (email) => {
    try {
      if (!supabase) throw new Error('Supabase não inicializado');

      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) throw error;

      return {
        success: true,
        message: 'Email de redefinição enviado',
      };
    } catch (err) {
      console.error('Erro ao redefinir senha:', err);
      return {
        success: false,
        error: err.message,
      };
    }
  };

  // Obter usuário atual
  const getCurrentUser = () => {
    return state.currentUser;
  };

  // Verificar se está autenticado
  const isLoggedIn = () => {
    return state.isAuthenticated;
  };

  // Inicializar
  const initialize = () => {
    loadSessionFromStorage();
    if (state.isAuthenticated && state.currentUser) {
      loadPermissions(state.currentUser.role);
    }
  };

  // API pública
  return {
    login,
    logout,
    register,
    resetPassword,
    hasPermission,
    getCurrentUser,
    isLoggedIn,
    initialize,
    loadPermissions,
  };
})();

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
  AuthManager.initialize();
});
