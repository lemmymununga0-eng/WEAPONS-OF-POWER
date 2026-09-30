import { describe, it, expect } from "vitest";
import { toEmbedUrl } from "../embedUrl.js";

describe("toEmbedUrl", () => {
  it("converts a youtu.be link", () => {
    expect(toEmbedUrl("https://youtu.be/dQw4w9WgXcQ")).toBe("https://www.youtube.com/embed/dQw4w9WgXcQ");
  });

  it("converts a youtube.com/watch?v= link", () => {
    expect(toEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      "https://www.youtube.com/embed/dQw4w9WgXcQ"
    );
  });

  it("converts a youtube.com/live/ link", () => {
    expect(toEmbedUrl("https://www.youtube.com/live/dQw4w9WgXcQ")).toBe("https://www.youtube.com/embed/dQw4w9WgXcQ");
  });

  it("converts a facebook.com video link to the video plugin URL", () => {
    const result = toEmbedUrl("https://www.facebook.com/church/videos/123456789");
    expect(result).toContain("https://www.facebook.com/plugins/video.php?href=");
    expect(result).toContain(encodeURIComponent("https://www.facebook.com/church/videos/123456789"));
  });

  it("returns an empty string for an unrecognized link", () => {
    expect(toEmbedUrl("https://example.com/not-a-video")).toBe("");
  });

  it("returns an empty string for no link", () => {
    expect(toEmbedUrl("")).toBe("");
  });
});
