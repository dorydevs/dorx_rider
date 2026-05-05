import axios from "axios";

const axiosInstance = (token?: string) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return axios.create({
    // baseURL: "https://dorxbackend-production.up.railway.app",
    baseURL: "http://192.168.100.57:9001",
    headers,
  });
};

export default axiosInstance;
