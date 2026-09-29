/**
 * The church's real logo (public/logo.png — cropped/trimmed from the
 * supplied artwork, transparent background so it drops onto any surface:
 * the navy nav bar, the hero, the footer, or the white admin login card).
 */
export default function Logo({ size = 34 }) {
  return (
    <img
      src="/logo.png"
      alt="Weapons of Power Ministry International logo"
      style={{ height: size, width: "auto", display: "block" }}
    />
  );
}
