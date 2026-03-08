import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080", // your backend URL
});

// Optional: send token automatically
api.interceptors.request.use((config) => {
  const session = localStorage.getItem("app_session_v1");
  if (session) {
    const parsed = JSON.parse(session);
    if (parsed.token) {
      config.headers.Authorization = `Bearer ${parsed.token}`;
    }
  }
  return config;
});

export default api;

