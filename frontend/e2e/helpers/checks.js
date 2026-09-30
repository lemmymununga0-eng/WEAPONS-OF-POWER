// A 1x1 transparent PNG, used to satisfy map-tile requests without a real
// network call — avoids tile-load noise in tests that aren't specifically
// testing the map-tile-failure fallback.
const BLANK_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64"
);

export function trackConsoleErrors(page) {
  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));
  return errors;
}

export async function hasHorizontalOverflow(page) {
  return page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
}

/** Blocks/mocks external requests (fonts, map tiles, video embeds) so
 * network flakiness never counts as an app failure. */
export async function mockExternalNetwork(page) {
  // Fulfilled (not aborted) — an aborted <link rel="stylesheet"> load logs
  // its own "Failed to load resource" console error, which would then get
  // flagged by trackConsoleErrors as if it were a real app bug.
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) =>
    route.fulfill({ status: 200, contentType: "text/css", body: "" })
  );
  await page.route(/tile\.openstreetmap\.org/, (route) =>
    route.fulfill({ status: 200, contentType: "image/png", body: BLANK_PNG })
  );
  await page.route(/youtube\.com|facebook\.com/, (route) =>
    route.fulfill({ status: 200, contentType: "text/html", body: "" })
  );
}
