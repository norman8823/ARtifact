import { useCallback, useState } from "react";
import { useArtwork } from "./useArtwork";
import { useUserQuests } from "./useUserQuests";
import { useUserXP } from "./useUserXP";
import { useVisited } from "./useVisited";

interface ScanResult {
  success: boolean;
  confidence: number;
  labels: Array<{
    Name: string;
    Confidence: number;
  }>;
}

interface ScanSuccessResult {
  isNewVisit: boolean;
  artworkTitle: string;
  xpAwarded: number;
  questsUpdated: Array<{
    title: string;
    isCompleted: boolean;
    progress: string;
  }>;
}

export function useScanSuccess() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { getArtworkById } = useArtwork();
  const { checkIfArtworkVisited, createVisitRecord } = useVisited();
  const { awardXP } = useUserXP();
  const { updateQuestProgress } = useUserQuests();

  const processScanSuccess = useCallback(
    async (scanResult: ScanResult): Promise<ScanSuccessResult | null> => {
      setIsProcessing(true);
      setError(null);

      try {
        // Check if we have a successful recognition with labels
        if (
          !scanResult.success ||
          !scanResult.labels ||
          scanResult.labels.length === 0
        ) {
          return null;
        }

        // Get the artwork ID from the first label
        const artworkId = scanResult.labels[0].Name;
        console.log(`🎯 Processing scan success for artwork: ${artworkId}`);

        // Get artwork details
        const artwork = await getArtworkById(artworkId);
        if (!artwork) {
          throw new Error("Artwork not found in database");
        }

        // Check if user has already visited this artwork
        const existingVisit = await checkIfArtworkVisited(artworkId);
        const isNewVisit = !existingVisit;

        let xpAwarded = 0;
        let questsUpdated: ScanSuccessResult["questsUpdated"] = [];

        if (isNewVisit) {
          console.log(
            "🆕 New visit detected - creating visit record and awarding XP"
          );

          // Create visit record
          await createVisitRecord(artworkId);

          // Award 50 XP points
          await awardXP(50);
          xpAwarded = 50;

          console.log("✅ Visit recorded and XP awarded");
        } else {
          console.log("🔄 User has already visited this artwork");
        }

        // Update quest progress regardless of whether it's a new visit
        try {
          const updatedQuests = await updateQuestProgress(artworkId);
          questsUpdated = updatedQuests.map((quest) => ({
            title: quest.title,
            isCompleted: quest.isCompleted,
            progress: `${quest.artworksVisited.length}/${quest.requiredArtworks.length}`,
          }));
        } catch (questError) {
          console.warn("⚠️ Error updating quest progress:", questError);
          // Don't throw here - quest update failures shouldn't block the main flow
        }

        return {
          isNewVisit,
          artworkTitle: artwork.title,
          xpAwarded,
          questsUpdated,
        };
      } catch (err) {
        console.error("❌ Error processing scan success:", err);
        setError(
          err instanceof Error ? err : new Error("Unknown error occurred")
        );
        throw err;
      } finally {
        setIsProcessing(false);
      }
    },
    [
      getArtworkById,
      checkIfArtworkVisited,
      createVisitRecord,
      awardXP,
      updateQuestProgress,
    ]
  );

  return {
    processScanSuccess,
    isProcessing,
    error,
  };
}
