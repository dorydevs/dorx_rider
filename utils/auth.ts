// utils/auth.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User } from "../types";

/**
 * Get the stored user from AsyncStorage
 * Returns null if no user is found or if data is invalid
 */
export const getStoredUser = async (): Promise<User | null> => {
  try {
    const storedUser = await AsyncStorage.getItem("user");
    if (!storedUser) return null;

    const user: User = JSON.parse(storedUser);
    return user;
  } catch (error) {
    console.error("Error reading stored user:", error);
    return null;
  }
};

/**
 * Clear user session (logout)
 */
export const clearSession = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem("user");
  } catch (error) {
    console.error("Error clearing session:", error);
  }
};
