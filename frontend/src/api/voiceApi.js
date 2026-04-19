import axiosClient from "./axiosClient";

export const transcribeVoice = (blob, filename = "voice-search.webm") => {
  const formData = new FormData();
  formData.append("file", blob, filename);
  return axiosClient.post("/voice/transcribe", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};
