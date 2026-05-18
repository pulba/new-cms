import type { APIRoute } from "astro";
import { db } from "@/db";
import { schoolProfile } from "@/db/schema";
import { 
  generateThemeTokens, hexToRgb, rgbToHex, getLuminance, 
  getContrastText, lighten, darken, isDark 
} from "@/lib/themeEngine";

/**
 * Generates a full Material Design 3 compatible CSS variable set
 * from the 10 CMS base colors + derived semantic tokens.
 * 
 * The frontend's global.css references these as:
 *   var(--theme-primary, <fallback>)
 *   var(--theme-on-primary, <fallback>)
 *   etc.
 * 
 * Injecting these overrides cascades to ALL frontend components automatically.
 */
function generateMD3Tokens(data: Record<string, any>) {
  const t = generateThemeTokens(data);

  // ---- PRIMARY family ----
  const primaryContainer = darken(t.primary, 15);
  const onPrimaryContainer = lighten(t.primary, 60);
  const primarySoft = lighten(t.primary, 85);
  const primarySoftDim = lighten(t.primary, 70);
  const inversePrimary = lighten(t.primary, 70);

  // ---- SECONDARY family (from accent) ----
  const secondary = t.accent;
  const onSecondary = getContrastText(secondary);
  const secondaryContainer = t.accent;
  const onSecondaryContainer = getContrastText(t.accent);
  const secondaryFixed = lighten(t.accent, 70);
  const secondaryFixedDim = lighten(t.accent, 50);
  const onSecondaryFixed = getContrastText(lighten(t.accent, 70));
  const onSecondaryFixedVariant = darken(t.accent, 30);

  // ---- TERTIARY family (derived from primary shifted) ----
  const { r, g, b } = hexToRgb(t.primary);
  const tertiary = rgbToHex(Math.min(255, r + 60), Math.max(0, g - 20), Math.min(255, b + 30));
  const onTertiary = getContrastText(tertiary);
  const tertiaryContainer = darken(tertiary, 15);
  const onTertiaryContainer = lighten(tertiary, 60);
  const tertiaryFixed = lighten(tertiary, 70);
  const tertiaryFixedDim = lighten(tertiary, 50);
  const onTertiaryFixed = getContrastText(lighten(tertiary, 70));
  const onTertiaryFixedVariant = darken(tertiary, 30);

  // ---- SURFACE family (5-level container system) ----
  const bg = t.background;
  const bgDark = isDark(bg);
  const surfaceLowest = bgDark ? lighten(bg, 4) : '#ffffff';
  const surfaceLow = bgDark ? lighten(bg, 6) : darken(bg, 2);
  const surfaceContainer = bgDark ? lighten(bg, 9) : darken(bg, 4);
  const surfaceHigh = bgDark ? lighten(bg, 12) : darken(bg, 6);
  const surfaceHighest = bgDark ? lighten(bg, 16) : darken(bg, 9);
  const surfaceVariant = bgDark ? lighten(bg, 14) : darken(bg, 8);
  const surfaceDim = bgDark ? darken(bg, 10) : darken(bg, 12);
  const inverseSurface = bgDark ? lighten(bg, 80) : darken(bg, 80);
  const inverseOnSurface = getContrastText(inverseSurface);

  // ---- ON-SURFACE family ----
  const onSurface = t.heading; // headings = strongest text
  const onBackground = t.heading;
  const onSurfaceVariant = t.text; // body text = softer

  // ---- OUTLINE family ----
  const outline = bgDark ? lighten(t.border, 30) : darken(t.border, 20);
  const outlineVariant = t.border;

  return `
/**
 * CMS Dynamic Theme — Material Design 3 Token Bridge
 * Generated at: ${new Date().toISOString()}
 * Engine: themeEngine.ts → Smart Contrast + Derived Semantics
 */

:root {
  /* ===== PRIMARY ===== */
  --theme-primary: ${t.primary};
  --theme-on-primary: ${t.onPrimaryText};
  --theme-primary-container: ${primaryContainer};
  --theme-on-primary-container: ${onPrimaryContainer};
  --theme-primary-soft: ${primarySoft};
  --theme-primary-soft-dim: ${primarySoftDim};
  --theme-on-primary-fixed: ${getContrastText(primarySoft)};
  --theme-on-primary-fixed-variant: ${darken(t.primary, 20)};
  --theme-inverse-primary: ${inversePrimary};

  /* ===== SECONDARY (Accent) ===== */
  --theme-secondary: ${secondary};
  --theme-on-secondary: ${onSecondary};
  --theme-secondary-container: ${secondaryContainer};
  --theme-on-secondary-container: ${onSecondaryContainer};
  --theme-secondary-fixed: ${secondaryFixed};
  --theme-secondary-fixed-dim: ${secondaryFixedDim};
  --theme-on-secondary-fixed: ${onSecondaryFixed};
  --theme-on-secondary-fixed-variant: ${onSecondaryFixedVariant};

  /* ===== TERTIARY ===== */
  --theme-tertiary: ${tertiary};
  --theme-on-tertiary: ${onTertiary};
  --theme-tertiary-container: ${tertiaryContainer};
  --theme-on-tertiary-container: ${onTertiaryContainer};
  --theme-tertiary-fixed: ${tertiaryFixed};
  --theme-tertiary-fixed-dim: ${tertiaryFixedDim};
  --theme-on-tertiary-fixed: ${onTertiaryFixed};
  --theme-on-tertiary-fixed-variant: ${onTertiaryFixedVariant};

  /* ===== ERROR ===== */
  --theme-error: #ba1a1a;
  --theme-on-error: #ffffff;
  --theme-error-container: #ffdad6;
  --theme-on-error-container: #93000a;

  /* ===== SURFACES ===== */
  --theme-background: ${bg};
  --theme-on-background: ${onBackground};
  --theme-surface: ${bg};
  --theme-surface-variant: ${surfaceVariant};
  --theme-on-surface: ${onSurface};
  --theme-on-surface-variant: ${onSurfaceVariant};
  --theme-inverse-surface: ${inverseSurface};
  --theme-inverse-on-surface: ${inverseOnSurface};

  /* ===== SURFACE CONTAINERS ===== */
  --theme-surface-container-lowest: ${surfaceLowest};
  --theme-surface-container-low: ${surfaceLow};
  --theme-surface-container: ${surfaceContainer};
  --theme-surface-container-high: ${surfaceHigh};
  --theme-surface-container-highest: ${surfaceHighest};

  /* ===== OUTLINES ===== */
  --theme-outline: ${outline};
  --theme-outline-variant: ${outlineVariant};

  /* ===== TYPOGRAPHY ===== */
  --theme-font-base: '${t.fontFamily}', sans-serif;

  /* ===== CMS EXTENDED TOKENS ===== */
  --theme-color-link: ${t.link};
  --theme-color-link-hover: ${t.linkHover};
  --theme-color-badge: ${t.badge};
  --theme-muted-text: ${t.mutedText};
  --theme-soft-accent-bg: ${t.softAccentBackground};
  --theme-soft-primary-bg: ${t.softPrimaryBackground};
  --theme-border-soft: ${t.borderSoft};
  --theme-hover-heading-safe: ${t.hoverHeadingSafe};
  --theme-hover-link-safe: ${t.hoverLinkSafe};
  --theme-hover-primary-safe: ${t.hoverPrimarySafe};
}
  `.trim();
}

export const GET: APIRoute = async () => {
  try {
    const allProfiles = await db.select().from(schoolProfile).limit(1);
    
    let profileData: Record<string, any> = {};
    if (allProfiles.length > 0) {
      profileData = allProfiles[0];
    }

    const cssContent = generateMD3Tokens(profileData);

    return new Response(cssContent, {
      status: 200,
      headers: { 
        "Content-Type": "text/css; charset=utf-8",
        "Cache-Control": "public, max-age=60"
      },
    });
  } catch (error) {
    console.error(error);
    return new Response("/* Internal Server Error */", { 
      status: 500, 
      headers: { "Content-Type": "text/css" } 
    });
  }
};
