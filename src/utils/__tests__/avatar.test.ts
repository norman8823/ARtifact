import { avatarUrl } from "../avatar";

it.each([
  "alice@example.com",
  "alice@example.com-variant",
  "d9464a70-cd83-4c6e-b4b7-1c5b76c801ce",
  "Felix&email=alice@example.com",
])("never sends a legacy personal seed (%s) to the external host", (seed) => {
  expect(avatarUrl(seed)).toBe("https://api.dicebear.com/9.x/lorelei-neutral/svg?seed=Felix");
});
