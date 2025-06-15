import { useCallback, useState } from "react";

interface GalleryMap {
  id: string;
  galleryNumber: string;
  mapURL: string;
}

// Import the JSON file directly
const galleryMapsData =
  require("../../seed/json/galleryMaps.json") as GalleryMap[];

export function useGalleryMaps() {
  const [galleryMaps, setGalleryMaps] = useState<GalleryMap[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadGalleryMaps = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Use the imported JSON data directly
      setGalleryMaps(galleryMapsData);
    } catch (err) {
      console.error("Error loading gallery maps:", err);
      setError(
        err instanceof Error ? err : new Error("Unknown error occurred")
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getMapURLByGalleryNumber = useCallback(
    (galleryNumber: string) => {
      const galleryMap = galleryMaps.find(
        (map) => map.galleryNumber === galleryNumber
      );
      return galleryMap?.mapURL || null;
    },
    [galleryMaps]
  );

  return {
    galleryMaps,
    isLoading,
    error,
    loadGalleryMaps,
    getMapURLByGalleryNumber,
  };
}
