import { createContext, useContext, useState } from "react";

const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
  const [current, setCurrent] = useState(null); // the sermon object currently loaded

  const play = (sermon) => setCurrent(sermon);
  const close = () => setCurrent(null);

  return <PlayerContext.Provider value={{ current, play, close }}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}
