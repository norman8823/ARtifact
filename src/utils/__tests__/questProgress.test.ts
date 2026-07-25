import {
  applyArtworkVisit,
  questRequiresArtwork,
  seedQuestProgress,
} from "../questProgress";

describe("seedQuestProgress", () => {
  it("credits only the visited artworks that the quest requires", () => {
    const result = seedQuestProgress(["1", "2", "3"], ["2", "99"]);
    expect(result.artworksVisited).toEqual(["2"]);
    expect(result.isCompleted).toBe(false);
  });

  it("preserves required-artwork order regardless of visit order", () => {
    const result = seedQuestProgress(["1", "2", "3"], ["3", "1"]);
    expect(result.artworksVisited).toEqual(["1", "3"]);
  });

  it("auto-completes when every required artwork was already visited", () => {
    const result = seedQuestProgress(["1", "2"], ["2", "1", "50"]);
    expect(result.isCompleted).toBe(true);
    expect(result.artworksVisited).toEqual(["1", "2"]);
  });

  it("starts empty and incomplete when nothing relevant was visited", () => {
    const result = seedQuestProgress(["1", "2"], ["7", "8"]);
    expect(result.artworksVisited).toEqual([]);
    expect(result.isCompleted).toBe(false);
  });

  it("treats a quest with no required artworks as complete", () => {
    // Degenerate seed data; documents current behavior.
    expect(seedQuestProgress([], ["1"]).isCompleted).toBe(true);
  });
});

describe("questRequiresArtwork", () => {
  const quest = { requiredArtworks: ["1", "2"], isCompleted: false };

  it("matches an incomplete quest that requires the artwork", () => {
    expect(questRequiresArtwork(quest, "1")).toBe(true);
  });

  it("ignores artworks the quest does not require", () => {
    expect(questRequiresArtwork(quest, "42")).toBe(false);
  });

  it("ignores quests that are already completed", () => {
    expect(questRequiresArtwork({ ...quest, isCompleted: true }, "1")).toBe(
      false
    );
  });
});

describe("applyArtworkVisit", () => {
  it("adds a new artwork without completing an unfinished quest", () => {
    const result = applyArtworkVisit(["1", "2", "3"], ["1"], "2");
    expect(result).toEqual({
      artworksVisited: ["1", "2"],
      isCompleted: false,
    });
  });

  it("completes the quest when the final artwork is visited", () => {
    const result = applyArtworkVisit(["1", "2"], ["1"], "2");
    expect(result).toEqual({
      artworksVisited: ["1", "2"],
      isCompleted: true,
    });
  });

  it("returns null when the artwork is already counted", () => {
    expect(applyArtworkVisit(["1", "2"], ["1"], "1")).toBeNull();
  });

  it("does not mutate the input visited list", () => {
    const visited = ["1"];
    applyArtworkVisit(["1", "2"], visited, "2");
    expect(visited).toEqual(["1"]);
  });
});
