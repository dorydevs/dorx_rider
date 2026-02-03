import axios from "axios";

const axiosInstance = (token?: string) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return axios.create({
    baseURL: "http://192.168.1.64:9001",
    headers,
  });
};

export default axiosInstance;
