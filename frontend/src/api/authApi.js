import axiosClient from "./axiosClient";

export const signup = (email, password, full_name) => {
  return axiosClient.post("/users/", {
    email,
    password,
    full_name,
  });
};

export const login = (email, password) => {
  const body = new URLSearchParams();
  body.set("username", email);
  body.set("password", password);
  return axiosClient.post("/auth/login/access-token", body, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
};

export const getMe = () => {
  return axiosClient.get("/users/me");
};
