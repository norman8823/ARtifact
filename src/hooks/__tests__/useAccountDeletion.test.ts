import { generateClient } from "aws-amplify/api";
import { deleteUser } from "aws-amplify/auth";
import { forgetAppleAccount, isKnownAppleAccount } from "@/src/utils/appleAccount";
import { revokeAppleToken } from "@/src/utils/appleRevocation";
import { useAccountDeletion } from "../useAccountDeletion";

// Exercise orchestration without mounting UI; state rendering is not under test.
jest.mock("react", () => ({
  ...jest.requireActual("react"),
  useCallback: (fn: unknown) => fn,
  useState: () => [false, jest.fn()],
}));
jest.mock("@/src/contexts/AuthContext", () => ({
  useAuthContext: () => ({ user: { userId: "alice" } }),
}));
jest.mock("aws-amplify/api", () => ({ generateClient: jest.fn() }));
jest.mock("aws-amplify/auth", () => ({ deleteUser: jest.fn() }));
jest.mock("@/src/utils/appleAccount", () => ({
  forgetAppleAccount: jest.fn(), isKnownAppleAccount: jest.fn(),
}));
jest.mock("@/src/utils/appleRevocation", () => ({ revokeAppleToken: jest.fn() }));
jest.mock("@sentry/react-native", () => ({ addBreadcrumb: jest.fn(), captureException: jest.fn(), captureMessage: jest.fn() }));

const graphql = jest.fn();
beforeEach(() => {
  jest.resetAllMocks();
  (generateClient as jest.Mock).mockReturnValue({ graphql });
  graphql.mockImplementation(async ({ query }: { query: string }) => {
    const list = query.match(/\b(listFavoriteds|listVisiteds|listUserQuests|listUserXPS|listUsers)\s*\(/)?.[1];
    if (!list) throw new Error("Unexpected operation");
    return { data: { [list]: { items: [], nextToken: null } } };
  });
  (isKnownAppleAccount as jest.Mock).mockResolvedValue(true);
  (revokeAppleToken as jest.Mock).mockResolvedValue(true);
  (deleteUser as jest.Mock).mockResolvedValue(undefined);
});

it("deletes the identity only after data collection and confirmed revocation", async () => {
  const result = await useAccountDeletion().deleteAccount();
  expect(result).toEqual({ ok: true, rowsDeleted: 0, appleRevocation: "revoked" });
  expect(revokeAppleToken).toHaveBeenCalledTimes(1);
  expect((deleteUser as jest.Mock).mock.invocationCallOrder[0]).toBeGreaterThan(
    (revokeAppleToken as jest.Mock).mock.invocationCallOrder[0]
  );
  expect(forgetAppleAccount).toHaveBeenCalledWith("alice");
});

it("preserves deletion access and reports manual removal after revocation fails", async () => {
  (revokeAppleToken as jest.Mock).mockResolvedValue(false);
  expect(await useAccountDeletion().deleteAccount()).toMatchObject({ ok: true, appleRevocation: "manual" });
  expect(deleteUser).toHaveBeenCalledTimes(1);
});

it("gives legacy or other-device accounts manual instructions without using someone else's hint", async () => {
  (isKnownAppleAccount as jest.Mock).mockResolvedValue(false);
  expect(await useAccountDeletion().deleteAccount()).toMatchObject({ ok: true, appleRevocation: "manual" });
  expect(revokeAppleToken).not.toHaveBeenCalled();
});

it("keeps the account hint when identity deletion fails so the operation can be retried", async () => {
  (deleteUser as jest.Mock).mockRejectedValue(new Error("offline"));
  expect(await useAccountDeletion().deleteAccount()).toMatchObject({ ok: false });
  expect(forgetAppleAccount).not.toHaveBeenCalled();
});

it("does not mistake a malformed list response for an empty account", async () => {
  graphql.mockResolvedValue({ data: {} });
  expect(await useAccountDeletion().deleteAccount()).toMatchObject({ ok: false });
  expect(deleteUser).not.toHaveBeenCalled();
  expect(revokeAppleToken).not.toHaveBeenCalled();
});

it("keeps the identity when an owned row cannot be deleted", async () => {
  graphql.mockImplementation(async ({ query }: { query: string }) => {
    const list = query.match(/\b(listFavoriteds|listVisiteds|listUserQuests|listUserXPS|listUsers)\s*\(/)?.[1];
    if (list) return { data: { [list]: { items: list === "listFavoriteds" ? [{ id: "favorite" }] : [], nextToken: null } } };
    return { errors: [{ message: "offline" }] };
  });
  const log = jest.spyOn(console, "error").mockImplementation(() => {});
  try {
    expect(await useAccountDeletion().deleteAccount()).toMatchObject({ ok: false, reason: "data-incomplete" });
    expect(deleteUser).not.toHaveBeenCalled();
    expect(revokeAppleToken).not.toHaveBeenCalled();
  } finally {
    log.mockRestore();
  }
});
