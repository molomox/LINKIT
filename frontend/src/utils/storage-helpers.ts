// Helper functions pour les tests
// frontend/src/utils/storage.ts - functions helpers

export const saveUser = (userData: { user_id: string; username: string; token: string }) => {
  sessionStorage.setItem('user_id', userData.user_id);
  sessionStorage.setItem('username', userData.username);
  sessionStorage.setItem('token', userData.token);
};

export const getUser = () => {
  const user_id = sessionStorage.getItem('user_id');
  const username = sessionStorage.getItem('username');
  const token = sessionStorage.getItem('token');

  if (!user_id || !username || !token) {
    return null;
  }

  return { user_id, username, token };
};

export const clearUser = () => {
  sessionStorage.removeItem('user_id');
  sessionStorage.removeItem('username');
  sessionStorage.removeItem('token');
};

export const isAuthenticated = () => {
  const user_id = sessionStorage.getItem('user_id');
  const token = sessionStorage.getItem('token');
  return !!(user_id && token);
};
