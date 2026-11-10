// Never send emails, user IDs, or legacy profileImage values to the image host.
export const AVATAR_SEEDS = [
  "Felix", "Luna", "Milo", "Cleo", "Jasper", "Iris",
  "Oscar", "Poppy", "Theo", "Ruby", "Leo", "Willow",
] as const;

export function safeAvatarSeed(seed: string | null | undefined): string {
  return AVATAR_SEEDS.find((allowed) => allowed === seed) ?? "Felix";
}

export function avatarUrl(seed: string | null | undefined): string {
  return `https://api.dicebear.com/9.x/lorelei-neutral/svg?seed=${encodeURIComponent(safeAvatarSeed(seed))}`;
}
