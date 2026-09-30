const AUDIO_EXTS = ["mp3", "m4a", "wav", "ogg"];
const VIDEO_EXTS = ["mp4", "webm", "mov"];

// "audio" | "video" | null (no media attached at all)
export function sermonMediaKind(sermon) {
  if (sermon.media_path) {
    const ext = sermon.media_path.split(".").pop().toLowerCase();
    if (AUDIO_EXTS.includes(ext)) return "audio";
    if (VIDEO_EXTS.includes(ext)) return "video";
  }
  if (sermon.external_link) return "video";
  return null;
}
