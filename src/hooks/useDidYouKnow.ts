import { useCallback, useState } from "react";

interface DidYouKnowFact {
  id: string;
  fact: string;
}

// Import the JSON file directly
const didYouKnowData =
  require("../../seed/json/didYouKnow.json") as DidYouKnowFact[];

export function useDidYouKnow() {
  const [facts, setFacts] = useState<DidYouKnowFact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadFacts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Use the imported JSON data directly
      setFacts(didYouKnowData);
    } catch (err) {
      console.error("Error loading did you know facts:", err);
      setError(
        err instanceof Error ? err : new Error("Unknown error occurred")
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getRandomFact = useCallback(() => {
    if (facts.length === 0) {
      return null;
    }
    const randomIndex = Math.floor(Math.random() * facts.length);
    return facts[randomIndex];
  }, [facts]);

  return {
    facts,
    isLoading,
    error,
    loadFacts,
    getRandomFact,
  };
}
