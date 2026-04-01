export type StorefrontThemeId =
  | 'modern-minimal-grid'
  | 'hero-category-tiles'
  | 'editorial-lookbook';

export type StorefrontThemeApiId =
  | 'market-grid'
  | 'catalog-flow'
  | 'boutique-editorial';

export type StorefrontThemeOption = {
  id: StorefrontThemeId;
  name: string;
  tone: string;
  summary: string;
  highlights: [string, string, string];
};

export const STOREFRONT_THEME_OPTIONS: StorefrontThemeOption[] = [
  {
    id: 'modern-minimal-grid',
    name: 'Modern Minimal Grid',
    tone: 'DTC-ready layout with clean structure, whitespace, and premium pacing.',
    summary:
      'Centered 12-column composition with fast-scanning product cards for modern brands.',
    highlights: ['Clean 12-column structure', '3-4 / 2 / 1 product grid', 'Premium minimal look'],
  },
  {
    id: 'hero-category-tiles',
    name: 'Hero + Category Tiles',
    tone: 'Marketplace-first experience built for category discovery and quick jumps.',
    summary:
      'Large hero moment up top followed by symmetric category cards for rapid navigation.',
    highlights: ['Asymmetric hero section', 'Symmetric category tile grid', 'SKU discovery focused'],
  },
  {
    id: 'editorial-lookbook',
    name: 'Editorial / Lookbook',
    tone: 'Story-driven storefront with magazine rhythm and curated product moments.',
    summary:
      'Alternating narrative blocks with mixed-grid product strips for boutique positioning.',
    highlights: ['Alternating story blocks', 'Curated 3-column strips', 'Luxury brand storytelling'],
  },
];

export function normalizeStorefrontTheme(
  template: string | null | undefined,
): StorefrontThemeId {
  if (
    template === 'modern-minimal-grid' ||
    template === 'hero-category-tiles' ||
    template === 'editorial-lookbook'
  ) {
    return template;
  }

  // Backward compatibility for stores that still have legacy template values.
  if (template === 'market-grid') {
    return 'modern-minimal-grid';
  }

  if (template === 'catalog-flow') {
    return 'hero-category-tiles';
  }

  if (template === 'boutique-editorial') {
    return 'editorial-lookbook';
  }

  return 'modern-minimal-grid';
}

export function toStorefrontThemeApiValue(
  template: StorefrontThemeId,
): StorefrontThemeApiId {
  if (template === 'modern-minimal-grid') return 'market-grid';
  if (template === 'hero-category-tiles') return 'catalog-flow';
  return 'boutique-editorial';
}
