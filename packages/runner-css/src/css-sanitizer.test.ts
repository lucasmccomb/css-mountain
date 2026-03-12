import { describe, it, expect } from "vitest";
import { sanitizeCSS } from "./css-sanitizer";

describe("sanitizeCSS", () => {
  describe("empty and whitespace input", () => {
    it("returns empty string for empty input", () => {
      const result = sanitizeCSS("");
      expect(result.sanitized).toBe("");
      expect(result.warnings).toHaveLength(0);
    });

    it("returns empty string for whitespace-only input", () => {
      const result = sanitizeCSS("   \n\t  ");
      expect(result.sanitized).toBe("");
      expect(result.warnings).toHaveLength(0);
    });

    it("returns empty string for null-ish input", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = sanitizeCSS(undefined as any);
      expect(result.sanitized).toBe("");
    });
  });

  describe("@import stripping", () => {
    it("strips @import with url string", () => {
      const result = sanitizeCSS('@import url("https://evil.com/malicious.css");');
      expect(result.sanitized).not.toContain("@import");
      expect(result.sanitized).not.toContain("evil.com");
      expect(result.warnings.some((w) => w.includes("@import"))).toBe(true);
    });

    it("strips @import with bare string", () => {
      const result = sanitizeCSS("@import 'https://evil.com/styles.css';");
      expect(result.sanitized).not.toContain("@import");
      expect(result.sanitized).not.toContain("evil.com");
    });

    it("strips multiple @import rules", () => {
      const css = `
        @import url("a.css");
        @import url("b.css");
        body { color: red; }
      `;
      const result = sanitizeCSS(css);
      expect(result.sanitized).not.toContain("@import");
      expect(result.sanitized).toContain("color");
    });
  });

  describe("@font-face stripping", () => {
    it("strips @font-face rule", () => {
      const css = `
        @font-face {
          font-family: 'Evil';
          src: url('https://evil.com/track.woff2');
        }
        body { color: blue; }
      `;
      const result = sanitizeCSS(css);
      expect(result.sanitized).not.toContain("@font-face");
      expect(result.sanitized).not.toContain("evil.com");
      expect(result.warnings.some((w) => w.includes("@font-face"))).toBe(true);
    });
  });

  describe("url() stripping", () => {
    it("strips background-image url()", () => {
      const css = 'body { background-image: url("https://evil.com/steal"); }';
      const result = sanitizeCSS(css);
      expect(result.sanitized).not.toContain("evil.com");
      expect(result.sanitized).not.toMatch(/url\s*\(/i);
      expect(result.warnings.some((w) => w.includes("url()"))).toBe(true);
    });

    it("strips data: uri in url()", () => {
      const css =
        'body { background: url("data:image/svg+xml;base64,PHN2Zy..."); }';
      const result = sanitizeCSS(css);
      expect(result.sanitized).not.toContain("data:");
    });

    it("strips list-style-image url()", () => {
      const css = 'li { list-style-image: url("https://evil.com/tracker.png"); }';
      const result = sanitizeCSS(css);
      expect(result.sanitized).not.toContain("evil.com");
    });
  });

  describe("expression() stripping", () => {
    it("strips expression() function", () => {
      const css = "body { width: expression(alert(1)); }";
      const result = sanitizeCSS(css);
      expect(result.sanitized).not.toContain("expression");
      expect(result.sanitized).not.toContain("alert");
      expect(result.warnings.some((w) => w.includes("expression"))).toBe(true);
    });
  });

  describe("-moz-binding stripping", () => {
    it("strips -moz-binding property", () => {
      const css = 'body { -moz-binding: url("https://evil.com/xbl"); }';
      const result = sanitizeCSS(css);
      expect(result.sanitized).not.toContain("-moz-binding");
      expect(result.sanitized).not.toContain("evil.com");
      expect(result.warnings.some((w) => w.includes("-moz-binding"))).toBe(true);
    });
  });

  describe("behavior stripping", () => {
    it("strips behavior property", () => {
      const css = "body { behavior: url(evil.htc); }";
      const result = sanitizeCSS(css);
      expect(result.sanitized).not.toContain("behavior");
      expect(result.warnings.some((w) => w.includes("behavior"))).toBe(true);
    });
  });

  describe("preserves valid CSS", () => {
    it("preserves basic properties", () => {
      const css = "body { color: red; font-size: 16px; display: flex; }";
      const result = sanitizeCSS(css);
      expect(result.sanitized).toContain("color");
      expect(result.sanitized).toContain("red");
      expect(result.sanitized).toContain("font-size");
      expect(result.sanitized).toContain("display");
      expect(result.sanitized).toContain("flex");
      expect(result.warnings).toHaveLength(0);
    });

    it("preserves flexbox properties", () => {
      const css = `.container {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 1rem;
      }`;
      const result = sanitizeCSS(css);
      expect(result.sanitized).toContain("flex-direction");
      expect(result.sanitized).toContain("justify-content");
      expect(result.sanitized).toContain("align-items");
      expect(result.sanitized).toContain("gap");
      expect(result.warnings).toHaveLength(0);
    });

    it("preserves grid properties", () => {
      const css = `.grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        grid-gap: 10px;
      }`;
      const result = sanitizeCSS(css);
      expect(result.sanitized).toContain("grid");
      expect(result.sanitized).toContain("grid-template-columns");
      expect(result.warnings).toHaveLength(0);
    });

    it("preserves CSS custom properties", () => {
      const css = `:root { --primary: #00ff00; } body { color: var(--primary); }`;
      const result = sanitizeCSS(css);
      expect(result.sanitized).toContain("--primary");
      expect(result.sanitized).toContain("var(--primary)");
      expect(result.warnings).toHaveLength(0);
    });

    it("preserves media queries", () => {
      const css = `@media (max-width: 768px) { body { font-size: 14px; } }`;
      const result = sanitizeCSS(css);
      expect(result.sanitized).toContain("@media");
      expect(result.sanitized).toContain("font-size");
      expect(result.warnings).toHaveLength(0);
    });

    it("preserves keyframe animations", () => {
      const css = `@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`;
      const result = sanitizeCSS(css);
      expect(result.sanitized).toContain("@keyframes");
      expect(result.sanitized).toContain("fadeIn");
      expect(result.warnings).toHaveLength(0);
    });

    it("preserves pseudo-classes and pseudo-elements", () => {
      const css = `a:hover { color: blue; } p::first-line { font-weight: bold; }`;
      const result = sanitizeCSS(css);
      expect(result.sanitized).toContain(":hover");
      expect(result.sanitized).toContain("::first-line");
      expect(result.warnings).toHaveLength(0);
    });

    it("preserves transform and transition", () => {
      const css = `.box { transform: rotate(45deg); transition: all 0.3s ease; }`;
      const result = sanitizeCSS(css);
      expect(result.sanitized).toContain("transform");
      expect(result.sanitized).toContain("rotate");
      expect(result.sanitized).toContain("transition");
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe("mixed safe and dangerous CSS", () => {
    it("strips dangerous while preserving safe CSS", () => {
      const css = `
        @import url("evil.css");
        body {
          color: green;
          background-image: url("https://track.me/pixel.gif");
          font-size: 16px;
        }
        .safe { display: flex; }
      `;
      const result = sanitizeCSS(css);
      expect(result.sanitized).not.toContain("@import");
      expect(result.sanitized).not.toContain("track.me");
      expect(result.sanitized).toContain("color");
      expect(result.sanitized).toContain("green");
      expect(result.sanitized).toContain("font-size");
      expect(result.sanitized).toContain("display");
      expect(result.sanitized).toContain("flex");
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe("malformed CSS handling", () => {
    it("handles unclosed braces gracefully", () => {
      const css = "body { color: red;";
      expect(() => sanitizeCSS(css)).not.toThrow();
      const result = sanitizeCSS(css);
      // Should return something, not crash
      expect(typeof result.sanitized).toBe("string");
    });

    it("handles garbage input gracefully", () => {
      const css = "{{{{ not css at all }}}}";
      expect(() => sanitizeCSS(css)).not.toThrow();
    });

    it("handles deeply nested garbage", () => {
      const css = "a { b { c { d { e { f { g: h; } } } } } }";
      expect(() => sanitizeCSS(css)).not.toThrow();
    });
  });

  describe("warnings are descriptive", () => {
    it("returns distinct warnings per stripped construct", () => {
      const css = `
        @import url("a.css");
        @font-face { font-family: 'X'; src: url('x.woff'); }
        body { -moz-binding: url("xbl"); behavior: url(htc); }
      `;
      const result = sanitizeCSS(css);
      expect(result.warnings.some((w) => w.includes("@import"))).toBe(true);
      expect(result.warnings.some((w) => w.includes("@font-face"))).toBe(true);
      expect(result.warnings.some((w) => w.includes("-moz-binding") || w.includes("behavior"))).toBe(true);
    });
  });
});
