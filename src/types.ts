export type ClothesCategory = 'body' | 'hair' | 'headwear' | 'top' | 'bottom' | 'footwear' | 'accessories';

export interface ColorConfig {
  primary: string;
  secondary: string;
  accent: string;
}

export interface PatternConfig {
  type: 'solid' | 'stripes-h' | 'stripes-v' | 'dots' | 'checkerboard' | 'stars';
  scale: number;
  opacity: number;
}

export interface ClothingItem {
  id: string;
  name: string;
  category: ClothesCategory;
  // Visual variations
  style: string; 
  color: ColorConfig;
  pattern: PatternConfig;
  visible: boolean;
}

export interface BodyConfig {
  skinTone: string;
  bodyScaleX: number; // For scaling width
  bodyScaleY: number; // For scaling height
  genderNeutralPose: 'neutral' | 'model' | 'active';
}

export interface CustomOutfit {
  id: string;
  name: string;
  items: Record<ClothesCategory, ClothingItem>;
  body: BodyConfig;
  createdAt: string;
}

export interface PresetOutfit {
  name: string;
  description: string;
  theme: string;
  items: Partial<Record<ClothesCategory, Partial<ClothingItem>>>;
  body: Partial<BodyConfig>;
}
