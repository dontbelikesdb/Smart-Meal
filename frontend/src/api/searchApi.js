import axiosClient from "./axiosClient";

export const searchNL = (query, limit = 10) => {
  return axiosClient.post("/search/nl", { query, limit });
};
