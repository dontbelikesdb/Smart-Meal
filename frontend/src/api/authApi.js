export const signup = async (email, password, full_name) => {
  const users = JSON.parse(localStorage.getItem("users") || "[]");

  if (users.find(u => u.email === email)) {
    throw new Error("User already exists");
  }

  users.push({ email, password, full_name });
  localStorage.setItem("users", JSON.stringify(users));

  return { data: { success: true } };
};

export const login = async (email, password) => {
  const users = JSON.parse(localStorage.getItem("users") || "[]");
  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    throw new Error("Invalid credentials");
  }

  return { data: { access_token: email } };
};
