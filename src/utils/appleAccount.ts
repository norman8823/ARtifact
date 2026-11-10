import AsyncStorage from "@react-native-async-storage/async-storage";

const LEGACY_KEY = "artifact.appleLinked";
const keyForUser = (userId: string) => `artifact.appleLinked.v2:${userId}`;

// This is only a hint to offer automatic revocation on this device, not an
// authoritative account association. Missing/legacy hints use the documented
// manual fallback; never assign an unscoped legacy flag to the current user.
export async function rememberAppleAccount(userId: string): Promise<void> {
  await AsyncStorage.setItem(keyForUser(userId), "true");
  await AsyncStorage.removeItem(LEGACY_KEY);
}

export async function isKnownAppleAccount(userId: string): Promise<boolean> {
  return (await AsyncStorage.getItem(keyForUser(userId))) === "true";
}

export async function forgetAppleAccount(userId: string): Promise<void> {
  await AsyncStorage.multiRemove([keyForUser(userId), LEGACY_KEY]);
}

export const APPLE_MANUAL_REVOCATION_MESSAGE =
  "If you used Sign in with Apple, also remove ARtifact in your Apple Account settings under Sign in with Apple. Automatic removal could not be confirmed.";
