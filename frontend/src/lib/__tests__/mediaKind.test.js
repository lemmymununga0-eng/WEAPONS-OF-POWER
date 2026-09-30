import { describe, it, expect } from "vitest";
import { sermonMediaKind } from "../mediaKind.js";

describe("sermonMediaKind", () => {
  it("detects audio from the uploaded file extension", () => {
    expect(sermonMediaKind({ media_path: "/uploads/abc123.mp3", external_link: "" })).toBe("audio");
    expect(sermonMediaKind({ media_path: "/uploads/abc123.m4a", external_link: "" })).toBe("audio");
  });

  it("detects video from the uploaded file extension", () => {
    expect(sermonMediaKind({ media_path: "/uploads/abc123.mp4", external_link: "" })).toBe("video");
  });

  it("treats any external link as video", () => {
    expect(sermonMediaKind({ media_path: "", external_link: "https://youtu.be/abc123" })).toBe("video");
  });

  it("prefers the uploaded file over an external link when both are set", () => {
    expect(sermonMediaKind({ media_path: "/uploads/abc123.mp3", external_link: "https://youtu.be/xyz" })).toBe("audio");
  });

  it("returns null when there's no media at all", () => {
    expect(sermonMediaKind({ media_path: "", external_link: "" })).toBeNull();
  });
});
