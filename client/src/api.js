import axios from "axios";

// A pre-configured axios instance. Every request goes through here.
const api = axios.create({
  baseURL: "/api",
});

// Before every request, automatically attach the saved login token
// so the backend knows who we are.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
