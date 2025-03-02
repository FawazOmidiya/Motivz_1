import * as SecureStore from "expo-secure-store";

export async function storeToken(token: string) {
  await SecureStore.setItemAsync("authToken", token);
}

export async function getToken() {
  return await SecureStore.getItemAsync("authToken");
}

export async function removeToken() {
  await SecureStore.deleteItemAsync("authToken");
}
