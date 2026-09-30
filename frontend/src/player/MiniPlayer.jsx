import { usePlayer } from "./PlayerContext.jsx";
import { mediaUrl } from "../api/client.js";

export default function MiniPlayer() {
  const { current, close } = usePlayer();

  if (!current) return null;

  return (
    <div className="mini-player" role="region" aria-label="Now playing">
      <div className="mini-player-info">
        <b>{current.title}</b>
        {current.speaker && <span>{current.speaker}</span>}
      </div>
      <audio controls autoPlay src={mediaUrl(current.media_path)} className="mini-player-audio">
        Your browser doesn't support audio playback.
      </audio>
      <button type="button" className="mini-player-close" onClick={close} aria-label="Close player">
        ✕
      </button>
    </div>
  );
}
