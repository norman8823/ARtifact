import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";

interface FavoritesContextType {
  triggerRefresh: () => void;
  lastRefreshTime: number;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(
  undefined
);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [lastRefreshTime, setLastRefreshTime] = useState(Date.now());

  const triggerRefresh = useCallback(() => {
    setLastRefreshTime(Date.now());
  }, []);

  return (
    <FavoritesContext.Provider value={{ triggerRefresh, lastRefreshTime }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavoritesContext() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error(
      "useFavoritesContext must be used within a FavoritesProvider"
    );
  }
  return context;
}
