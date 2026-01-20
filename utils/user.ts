// utils/user.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

// Flexible user type for complex objects
export type User = {
  [key: string]: any; // allows any additional properties
};

// Key used in AsyncStorage
const USER_KEY = 'user';

/**
 * Save the current user to AsyncStorage
 * @param user - the user object to store
 */
export const setCurrentUser = async (user: User): Promise<void> => {
  try {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    console.log('User saved to AsyncStorage');
  } catch (err) {
    console.error('Failed to save user:', err);
  }
};

/**
 * Get the current user from AsyncStorage
 * @returns the stored user object or null
 */
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const storedUser = await AsyncStorage.getItem(USER_KEY);
    if (!storedUser) return null;
    return JSON.parse(storedUser);
  } catch (err) {
    console.error('Failed to get user:', err);
    return null;
  }
};

/**
 * Remove the current user from AsyncStorage
 */
export const removeCurrentUser = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(USER_KEY);
    console.log('User removed from AsyncStorage');
  } catch (err) {
    console.error('Failed to remove user:', err);
  }
};
