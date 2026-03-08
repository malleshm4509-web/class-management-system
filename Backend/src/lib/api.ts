// src/lib/api.ts
import axios from "axios";

const IS_LOCAL = typeof window !== "undefined" && window.location.hostname === "localhost";

// Use absolute backend URL in dev to avoid Vite proxy issues
const BASE_URL = IS_LOCAL ? "http://localhost:8080/api" : "/api";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 20000,
});

export default api;
