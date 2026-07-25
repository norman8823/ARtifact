import { getRankForXP } from "../rankUtils";

const ranks = [
  { id: "r1", title: "Novice", minXP: 0, maxXP: 299 },
  { id: "r2", title: "Apprentice", minXP: 300, maxXP: 899 },
  { id: "r3", title: "Curator", minXP: 900, maxXP: 1999 },
];

describe("getRankForXP", () => {
  it("returns the rank whose band contains the XP", () => {
    expect(getRankForXP(ranks, 500)?.title).toBe("Apprentice");
  });

  it("includes both band boundaries", () => {
    expect(getRankForXP(ranks, 300)?.title).toBe("Apprentice");
    expect(getRankForXP(ranks, 899)?.title).toBe("Apprentice");
  });

  it("maps zero XP to the first rank", () => {
    expect(getRankForXP(ranks, 0)?.title).toBe("Novice");
  });

  it("falls back to the first rank for XP in a gap between bands", () => {
    const gappyRanks = [
      { id: "r1", title: "Novice", minXP: 0, maxXP: 100 },
      { id: "r2", title: "Curator", minXP: 200, maxXP: 300 },
    ];
    expect(getRankForXP(gappyRanks, 150)?.title).toBe("Novice");
  });

  it("maps XP above the top band to the TOP rank (open-ended, never wraps)", () => {
    // The top rank means "this XP or greater". Live data uses a 999999
    // maxXP sentinel, but the code must not rely on it.
    expect(getRankForXP(ranks, 5000)?.title).toBe("Curator");
    expect(getRankForXP(ranks, 1_000_000)?.title).toBe("Curator");
  });

  it("returns undefined for an empty rank list", () => {
    expect(getRankForXP([], 100)).toBeUndefined();
  });
});
