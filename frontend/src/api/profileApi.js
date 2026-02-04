import axiosClient from "./axiosClient";

export const saveProfile = (payload) => {
  return axiosClient.post("/profile", payload);
};

export const getMyAllergies = () => {
  return axiosClient.get("/profile/allergies");
};

export const setMyAllergies = (allergy_ids) => {
  return axiosClient.post("/profile/allergies", { allergy_ids });
};
