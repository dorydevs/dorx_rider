import axios from "axios";

const axiosInstance = (token?: string) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return axios.create({
    baseURL: "https://dorxbackend-production.up.railway.app",
    headers,
  });
};

export default axiosInstance;
