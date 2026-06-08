import axios from "axios";

export const apiClient = axios.create({
  baseURL: "http://localhost:3000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(async (config) => {
  const token = localStorage.getItem("nateat.session");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
