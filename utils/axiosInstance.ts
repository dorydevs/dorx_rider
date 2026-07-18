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
    // baseURL: "https://dorx.dorydelivery.com",
    baseURL: "http://192.168.100.73:9001",
    headers,
  });
};

export default axiosInstance;
