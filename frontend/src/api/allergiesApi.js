import axiosClient from "./axiosClient";

export const listAllergies = () => {
  return axiosClient.get("/allergies/");
};
