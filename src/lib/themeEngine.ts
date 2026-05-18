// --- Color Utilities ---
export function hexToRgb(hex: string) {
  const c = (hex || '#000000').replace('#', '');
  return { r: parseInt(c.substring(0, 2), 16) || 0, g: parseInt(c.substring(2, 4), 16) || 0, b: parseInt(c.substring(4, 6), 16) || 0 };
}

export function rgbToHex(r: number, g: number, b: number) {
  return '#' + [r, g, b].map(x => Math.round(x).toString(16).padStart(2, '0')).join('');
}

export function getLuminance(r: number, g: number, b: number) {
  const [rs, gs, bs] = [r, g, b].map(c => { 
    c = c / 255; 
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); 
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function getContrastText(hex: string) { 
  const { r, g, b } = hexToRgb(hex); 
  return getLuminance(r, g, b) > 0.35 ? '#1a1b21' : '#ffffff'; 
}

export function lighten(hex: string, pct: number) { 
  const { r, g, b } = hexToRgb(hex); 
  return rgbToHex(
    Math.min(255, r + (255 - r) * pct / 100), 
    Math.min(255, g + (255 - g) * pct / 100), 
    Math.min(255, b + (255 - b) * pct / 100)
  ); 
}

export function darken(hex: string, pct: number) { 
  const { r, g, b } = hexToRgb(hex); 
  return rgbToHex(
    Math.max(0, r * (1 - pct / 100)), 
    Math.max(0, g * (1 - pct / 100)), 
    Math.max(0, b * (1 - pct / 100))
  ); 
}

export function isDark(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  return getLuminance(r, g, b) <= 0.35;
}

export function generateThemeTokens(data: Record<string, any>) {
  // Base Colors
  const primary = data.themeColorPrimary || '#1e3a8a';
  const background = data.themeColorBackground || '#f8fafc';
  const surface = data.themeColorSurface || '#ffffff';
  const text = data.themeColorText || '#334155';
  const heading = data.themeColorHeading || '#0f172a';
  const link = data.themeColorLink || '#1e40af';
  const linkHover = data.themeColorLinkHover || '#1e3a8a';
  const border = data.themeColorBorder || '#e2e8f0';
  const accent = data.themeColorAccent || '#3b82f6';
  const badge = data.themeColorBadge || '#dbeafe';

  // Derived Semantic Tokens
  const onPrimaryText = getContrastText(primary);
  const onAccentText = getContrastText(accent);
  const onSurfaceText = getContrastText(surface);
  
  // Muted Text
  const bgIsDark = isDark(background);
  const mutedText = bgIsDark ? lighten(text, 40) : darken(text, -40);

  // Soft Backgrounds
  const softAccentBackground = isDark(background) ? darken(accent, 70) : lighten(accent, 85);
  const softPrimaryBackground = isDark(background) ? darken(primary, 70) : lighten(primary, 85);

  // Border Soft
  const borderSoft = isDark(background) ? lighten(background, 15) : darken(background, 10);

  // Hover States (Safe)
  const hoverHeadingSafe = isDark(background) ? lighten(heading, 20) : darken(heading, 20);
  // Ensure link hover is visible against background
  const hoverLinkSafe = isDark(background) ? lighten(link, 20) : darken(link, 20);

  // Primary Hover (Safe)
  const hoverPrimarySafe = isDark(primary) ? lighten(primary, 15) : darken(primary, 15);

  return {
    primary, background, surface, text, heading, link, linkHover, border, accent, badge,
    onPrimaryText, onAccentText, onSurfaceText, mutedText,
    softAccentBackground, softPrimaryBackground, borderSoft,
    hoverHeadingSafe, hoverLinkSafe, hoverPrimarySafe,
    fontFamily: data.themeFontFamily || 'Inter',
    radius: data.themeRadius || 'md',
    shadowLevel: data.themeShadowLevel || 'md'
  };
}
