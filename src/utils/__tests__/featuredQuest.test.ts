import { dateSeed, pickFeaturedQuest } from "../featuredQuest";

const quests = [
  { id: "q1", isPremium: false },
  { id: "q2", isPremium: true },
  { id: "q3", isPremium: true },
  { id: "q4", isPremium: false },
];

const none = new Set<string>();

describe("dateSeed", () => {
  it("is deterministic for the same date string", () => {
    expect(dateSeed("Mon Jul 13 2026")).toBe(dateSeed("Mon Jul 13 2026"));
  });

  it("differs across days", () => {
    expect(dateSeed("Mon Jul 13 2026")).not.toBe(dateSeed("Tue Jul 14 2026"));
  });

  it("returns 0 for an empty string", () => {
    expect(dateSeed("")).toBe(0);
  });
});

describe("pickFeaturedQuest", () => {
  it("returns the same quest for the same day", () => {
    const a = pickFeaturedQuest(quests, none, "Mon Jul 13 2026");
    const b = pickFeaturedQuest(quests, none, "Mon Jul 13 2026");
    expect(a).not.toBeNull();
    expect(a).toBe(b);
  });

  it("never returns a completed quest while others remain", () => {
    const completed = new Set(["q1", "q2"]);
    for (const day of [
      "Mon Jul 13 2026",
      "Tue Jul 14 2026",
      "Wed Jul 15 2026",
      "Thu Jul 16 2026",
      "Fri Jul 17 2026",
    ]) {
      const pick = pickFeaturedQuest(quests, completed, day);
      expect(pick).not.toBeNull();
      expect(completed.has(pick!.id)).toBe(false);
    }
  });

  it("falls back to the full list once every quest is completed", () => {
    const allDone = new Set(quests.map((q) => q.id));
    const pick = pickFeaturedQuest(quests, allDone, "Mon Jul 13 2026");
    expect(pick).not.toBeNull();
    expect(quests).toContain(pick);
  });

  it("returns null for an empty quest list", () => {
    expect(pickFeaturedQuest([], none, "Mon Jul 13 2026")).toBeNull();
  });

  it("always returns a member of the input list", () => {
    for (let d = 1; d <= 28; d++) {
      const pick = pickFeaturedQuest(quests, none, `2026-07-${d}`);
      expect(quests).toContain(pick);
    }
  });

  it("can feature a premium quest (shown locked, not excluded)", () => {
    // Premium quests must remain eligible — the home card advertises the tier.
    const picks = new Set<string>();
    for (let d = 1; d <= 28; d++) {
      const pick = pickFeaturedQuest(quests, none, `2026-07-${d}`);
      if (pick) picks.add(pick.id);
    }
    const featuredAPremiumQuest = [...picks].some(
      (id) => quests.find((q) => q.id === id)?.isPremium === true
    );
    expect(featuredAPremiumQuest).toBe(true);
  });

  it("handles a single-quest catalog", () => {
    const one = [{ id: "only", isPremium: true }];
    expect(pickFeaturedQuest(one, none, "Mon Jul 13 2026")?.id).toBe("only");
    expect(pickFeaturedQuest(one, new Set(["only"]), "Mon Jul 13 2026")?.id).toBe(
      "only"
    );
  });
});
