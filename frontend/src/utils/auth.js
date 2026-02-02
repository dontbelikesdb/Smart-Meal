export const setToken = (email) => {
  localStorage.setItem("token", email);
};

export const getToken = () => {
  return localStorage.getItem("token");
};

export const logout = () => {
  localStorage.removeItem("token");
};

export const getCurrentUser = () => {
  const email = getToken();
  if (!email) return null;
  const users = JSON.parse(localStorage.getItem("users") || "[]");
  return users.find(u => u.email === email);
};
