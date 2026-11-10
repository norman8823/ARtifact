import { post } from "aws-amplify/api";
import { fetchAuthSession } from "aws-amplify/auth";
import * as AppleAuthentication from "expo-apple-authentication";
import { revokeAppleToken } from "../appleRevocation";

jest.mock("aws-amplify/api", () => ({ post: jest.fn() }));
jest.mock("aws-amplify/auth", () => ({ fetchAuthSession: jest.fn() }));
jest.mock("@sentry/react-native", () => ({ captureException: jest.fn() }));
jest.mock("expo-apple-authentication", () => ({
  signInAsync: jest.fn(), AppleAuthenticationScope: { EMAIL: 0 },
}));

const token = (email: string) => `header.${btoa(JSON.stringify({ email }))}.signature`;

beforeEach(() => {
  jest.resetAllMocks();
  (fetchAuthSession as jest.Mock).mockResolvedValue({
    tokens: { idToken: { payload: { email: "alice@example.com" }, toString: () => "cognito-token" } },
  });
  (AppleAuthentication.signInAsync as jest.Mock).mockResolvedValue({
    authorizationCode: "apple-code", identityToken: token("alice@example.com"),
  });
  (post as jest.Mock).mockReturnValue({
    response: Promise.resolve({ body: { json: async () => ({ revoked: true }) } }),
  });
});

it("reports confirmed revocation for the matching account", async () => {
  expect(await revokeAppleToken()).toBe(true);
  expect(post).toHaveBeenCalledWith(expect.objectContaining({ path: "/revokeApple" }));
});

it("never revokes a different Apple account selected in the sheet", async () => {
  (AppleAuthentication.signInAsync as jest.Mock).mockResolvedValue({
    authorizationCode: "other-code", identityToken: token("bob@example.com"),
  });
  expect(await revokeAppleToken()).toBe(false);
  expect(post).not.toHaveBeenCalled();
});

it("returns the manual fallback on cancellation", async () => {
  (AppleAuthentication.signInAsync as jest.Mock).mockRejectedValue({ code: "ERR_REQUEST_CANCELED" });
  expect(await revokeAppleToken()).toBe(false);
  expect(post).not.toHaveBeenCalled();
});

it("returns the manual fallback on an unavailable endpoint", async () => {
  (post as jest.Mock).mockImplementation(() => { throw new Error("offline"); });
  expect(await revokeAppleToken()).toBe(false);
});

it("does not treat an unconfirmed response as successful revocation", async () => {
  (post as jest.Mock).mockReturnValue({ response: Promise.resolve({ body: { json: async () => ({}) } }) });
  expect(await revokeAppleToken()).toBe(false);
});
