import { getAuthToken } from "@/lib/authToken";
import axios from "axios";

const https = axios.create({
    baseURL : process.env.EXPO_PUBLIC_API_BASE_URL
});

https.interceptors.request.use(
  async (config) => {
    const token = await getAuthToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);





export default https;

