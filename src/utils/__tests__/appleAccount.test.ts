import AsyncStorage from "@react-native-async-storage/async-storage";
import { forgetAppleAccount, isKnownAppleAccount, rememberAppleAccount } from "../appleAccount";

jest.mock("@react-native-async-storage/async-storage", () =>
  jest.requireActual("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

beforeEach(async () => { await AsyncStorage.clear(); });

it("does not carry Apple linkage from one account to another", async () => {
  await rememberAppleAccount("alice");
  expect(await isKnownAppleAccount("alice")).toBe(true);
  expect(await isKnownAppleAccount("bob")).toBe(false);
});

it("does not attribute a legacy device flag to the current account", async () => {
  await AsyncStorage.setItem("artifact.appleLinked", "true");
  expect(await isKnownAppleAccount("bob")).toBe(false);
});

it("cleans only the deleted account's hint", async () => {
  await rememberAppleAccount("alice");
  await rememberAppleAccount("bob");
  await forgetAppleAccount("alice");
  expect(await isKnownAppleAccount("alice")).toBe(false);
  expect(await isKnownAppleAccount("bob")).toBe(true);
});
