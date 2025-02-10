import * as SecureStore from "expo-secure-store";

// ✅ Store token securely
export const storeToken = async (token: string) => {
  try {
    await SecureStore.setItemAsync("access_token", token);
  } catch (error) {
    console.error("Failed to save token:", error);
  }
};

// ✅ Retrieve token
export const getToken = async () => {
  try {
    return await SecureStore.getItemAsync("access_token");
  } catch (error) {
    console.error("Failed to retrieve token:", error);
    return null;
  }
};

// ❌ Skip token validation for now
export const isAuthenticated = async () => {
  const token = await getToken();
  return !!token; // ✅ If token exists, consider user logged in (MVP approach)
};

// ✅ Remove token (Logout)
export const removeToken = async () => {
  try {
    await SecureStore.deleteItemAsync("access_token");
  } catch (error) {
    console.error("Failed to remove token:", error);
  }
};
