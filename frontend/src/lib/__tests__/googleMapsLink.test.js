import { describe, it, expect } from "vitest";
import { parseGoogleMapsLink } from "../googleMapsLink.js";

describe("parseGoogleMapsLink", () => {
  it("parses an @lat,lng link", () => {
    const result = parseGoogleMapsLink("https://www.google.com/maps/@-15.4067,28.2871,15z");
    expect(result).toEqual({ lat: -15.4067, lng: 28.2871 });
  });

  it("parses a ?q=lat,lng link", () => {
    const result = parseGoogleMapsLink("https://maps.google.com/?q=-15.4067,28.2871");
    expect(result).toEqual({ lat: -15.4067, lng: 28.2871 });
  });

  it("parses a &q=lat,lng link embedded in a longer URL", () => {
    const result = parseGoogleMapsLink("https://www.google.com/maps?some=param&q=-12.8024,28.2132&z=10");
    expect(result).toEqual({ lat: -12.8024, lng: 28.2132 });
  });

  it("parses plain 'lat,lng' text", () => {
    const result = parseGoogleMapsLink("-15.4067, 28.2871");
    expect(result).toEqual({ lat: -15.4067, lng: 28.2871 });
  });

  it("throws a clear error for shortened links", () => {
    expect(() => parseGoogleMapsLink("https://maps.app.goo.gl/abc123")).toThrow(/shortened/i);
  });

  it("throws a clear error for empty input", () => {
    expect(() => parseGoogleMapsLink("")).toThrow(/paste/i);
  });

  it("throws a clear error when no coordinates can be found", () => {
    expect(() => parseGoogleMapsLink("https://example.com/not-a-map-link")).toThrow(/couldn't find coordinates/i);
  });
});
