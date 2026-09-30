import { describe, it, expect } from "vitest";
import { callLink, whatsappLink, mailtoLink } from "../phone.js";

describe("callLink", () => {
  it("builds a tel: link from a normalized phone number", () => {
    expect(callLink("+260971234567")).toBe("tel:+260971234567");
  });
});

describe("whatsappLink", () => {
  it("strips the leading + for wa.me links", () => {
    expect(whatsappLink("+260971234567")).toBe("https://wa.me/260971234567");
  });

  it("leaves a number with no + unchanged", () => {
    expect(whatsappLink("260971234567")).toBe("https://wa.me/260971234567");
  });
});

describe("mailtoLink", () => {
  it("builds a mailto: link", () => {
    expect(mailtoLink("pastor@example.com")).toBe("mailto:pastor@example.com");
  });
});
