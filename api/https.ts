import { getToken, removeToken } from "@/context/AuthContext";
import axios from "axios";

// Optional: keep token in memory for performance
let memoryToken: string | null = null;

export const setMemoryToken = (token: string | null) => {
  memoryToken = token;
};

const https = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL,
});

// Request interceptor
https.interceptors.request.use(
  async (config) => {
    let token = memoryToken;

    // Fall back to storage once if the in-memory token is empty.
    if (!token) {
      token = await getToken();
      setMemoryToken(token);
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
https.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;

    if (status === 401) {
      console.log("Token expired or invalid");

      await removeToken();
      setMemoryToken(null);
    }

    return Promise.reject(error);
  }
);

export default https;
