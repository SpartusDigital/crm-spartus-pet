import axios from 'axios';

export interface TenantTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  bgColor: string;
  textColor: string;
  fontFamily: string;
  logoUrl?: string;
  faviconUrl?: string;
  borderRadius: string;
}

export interface TenantConfig {
  name: string;
  slug: string;
  theme: TenantTheme;
  settings: { petTypeLabel: string; currency: string; timezone: string };
}

export async function fetchTenantConfig(slug: string): Promise<TenantConfig | null> {
  try {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/whitelabel/theme/${slug}`,
    );
    return res.data;
  } catch {
    return null;
  }
}

export function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '99 102 241';
  return `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}`;
}

export function themeToCSS(theme: TenantTheme): string {
  return `
    :root {
      --color-primary: ${hexToRgb(theme.primaryColor)};
      --color-secondary: ${hexToRgb(theme.secondaryColor)};
      --color-accent: ${hexToRgb(theme.accentColor)};
      --bg-color: ${theme.bgColor};
      --text-color: ${theme.textColor};
      --font-family: ${theme.fontFamily};
      --border-radius: ${theme.borderRadius};
    }
  `;
}
