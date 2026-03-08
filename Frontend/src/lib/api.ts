// src/lib/api.ts
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080/api", // Spring Boot base API
  headers: {
    "Content-Type": "application/json",
  },
});

// Automatically attach token if stored
api.interceptors.request.use((config) => {
  try {
    const session = localStorage.getItem("app_session_v1");

    if (session) {
      const parsed = JSON.parse(session);

      if (parsed.token) {
        config.headers.Authorization = `Bearer ${parsed.token}`;
      }
    }
  } catch (err) {
    console.error("Session parse error", err);
  }

  return config;
});

export default api;