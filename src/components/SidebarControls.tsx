import React from 'react';
import { ClothesCategory, ClothingItem, BodyConfig } from '../types';
import {
  Sparkles,
  Smile,
  Scissors,
  Palette,
  Layers,
  ChevronRight,
  Eye,
  EyeOff
} from 'lucide-react';

interface SidebarControlsProps {
  activeCategory: ClothesCategory;
  onSelectCategory: (cat: ClothesCategory) => void;
  items: Record<ClothesCategory, ClothingItem>;
  onUpdateItem: (cat: ClothesCategory, updated: Partial<ClothingItem>) => void;
  body: BodyConfig;
  onUpdateBody: (updated: Partial<BodyConfig>) => void;
}

// Curated vibrant color palette options
const COLOR_PRESETS = [
  { name: 'Cosmic Indigo', value: '#4F46E5' },
  { name: 'Sky Slate', value: '#0EA5E9' },
  { name: 'Emerald Forest', value: '#10B981' },
  { name: 'Canary Yellow', value: '#FBBF24' },
  { name: 'Charcoal Minimal', value: '#374151' },
  { name: 'Coral Sunrise', value: '#F87171' },
  { name: 'Soft Peach', value: '#FFEDD5' },
  { name: 'Plum Noir', value: '#701A75' },
  { name: 'Matcha Soft', value: '#A7F3D0' },
  { name: 'Royal Crimson', value: '#BE123C' },
  { name: 'Nordic Cream', value: '#FAFAF9' },
  { name: 'Terracotta', value: '#C2410C' },
  { name: 'Cyber Neon', value: '#06B6D4' },
  { name: 'Lavender Mist', value: '#E9D5FF' },
  { name: 'Classic Gold', value: '#D97706' }
];

const SKIN_TONES = [
  { id: 'porcelain', name: 'Porcelain Sand', hex: '#FFF0E5' },
  { id: 'sand', name: 'Golden Sand', hex: '#F3D2C1' },
  { id: 'caramel', name: 'Rich Caramel', hex: '#C58F71' },
  { id: 'cocoa', name: 'Deep Cocoa', hex: '#8D5B4C' },
  { id: 'obsidian', name: 'Warm Obsidian', hex: '#452A22' },
  // Fantasy options
  { id: 'emerald', name: 'Elven Green', hex: '#A7F3D0' },
  { id: 'violet', name: 'Aether Violet', hex: '#DDD6FE' },
  { id: 'silver', name: 'Cyborg Silver', hex: '#E2E8F0' }
];

const CATEGORY_INFO: Record<ClothesCategory, { label: string; desc: string; icon: any }> = {
  body: { label: 'Mannequin', desc: 'Physique proportions', icon: Smile },
  hair: { label: 'Hair Cut', desc: 'Flowing hairstyle layers', icon: Sparkles },
  headwear: { label: 'Headwear', desc: 'Caps, crowns and hats', icon: Layers },
  top: { label: 'Upper Fit', desc: 'Hoodies, tees, and blazers', icon: Scissors },
  bottom: { label: 'Trousers', desc: 'Jeans, joggers and skirts', icon: Scissors },
  footwear: { label: 'Shoes', desc: 'Sneakers, sandals and boots', icon: Layers },
  accessories: { label: 'Accessories', desc: 'Glasses, wings and scarfs', icon: Palette }
};

// Available Styles mapping per category
const STYLES_POOL: Record<ClothesCategory, { id: string; name: string; desc: string }[]> = {
  body: [
    { id: 'neutral', name: 'Standard Aesthetic', desc: 'Minimal symmetric model pose' }
  ],
  hair: [
    { id: 'crop', name: 'Urban Chop', desc: 'Sleek, textured short layers' },
    { id: 'waves', name: 'Long Cascade', desc: 'Voluminous beach waves' },
    { id: 'bob', name: 'Neat Bob', desc: 'Sharp retro contour sweep' },
    { id: 'mohawk', name: 'Rebel Spike', desc: 'Anarchic mohawk ridge' },
    { id: 'bun', name: 'TopKnot Bun', desc: 'Sleek, neat circular lock' },
    { id: 'braids', name: 'Box Braids', desc: 'Tapered structured twin braids' },
    { id: 'none', name: 'Smooth / Bald', desc: 'Minimalist aerodynamic look' }
  ],
  headwear: [
    { id: 'none', name: 'Bare Crown', desc: 'Show off your hairstyle' },
    { id: 'cap', name: 'Baseball Cap', desc: 'Streetwear staple curved visor' },
    { id: 'beanie', name: 'Ribbed Beanie', desc: 'Cozy knitted slouch skullcap' },
    { id: 'sunhat', name: 'Sun Hat', desc: 'Floppy broad-brimmed straw classic' },
    { id: 'crown', name: 'Golden Regalia', desc: 'Monarchial pointed crown jewels' },
    { id: 'headband', name: 'Retro Sweatband', desc: 'Sporty dynamic stretch wrap' }
  ],
  top: [
    { id: 'tshirt', name: 'Crewneck Tee', desc: 'Classic everyday fit' },
    { id: 'hoodie', name: 'Cosy Hoodie', desc: 'Kangaroo pouch relaxed fleece' },
    { id: 'sweater', name: 'Knit Pullover', desc: 'Nordic pattern stitching warmth' },
    { id: 'croptop', name: 'Midriff Crop', desc: 'Breezy athleisure shoulder straps' },
    { id: 'tanktop', name: 'Ribbed Tank', desc: 'Deep cut breathable classic' },
    { id: 'blazer', name: 'Tailored Suit', desc: 'Chic double lapels & tie accessory' }
  ],
  bottom: [
    { id: 'jeans', name: 'Vintage Jeans', desc: 'Authentic stitch straight trousers' },
    { id: 'shorts', name: 'Flared Shorts', desc: 'Lightweight side pockets shorts' },
    { id: 'skirt', name: 'Pleated Skirt', desc: 'High-waisted elegant pleated flair' },
    { id: 'cargo', name: 'Utilitarian Cargo', desc: 'Rugged blocky military gear bags' },
    { id: 'joggers', name: 'Fleece Joggers', desc: 'Cuffed ankle snug loungewear' }
  ],
  footwear: [
    { id: 'sneakers', name: 'Aero Sneakers', desc: 'Plump white soles performance lace' },
    { id: 'boots', name: 'Tread Combat Boot', desc: 'Reinforced block platform lug' },
    { id: 'sandals', name: 'Gladiator Straps', desc: 'Comfortable cross straps beachwear' },
    { id: 'dress_shoes', name: 'Polished Oxfords', desc: 'Sleek leather formal slip-on' }
  ],
  accessories: [
    { id: 'none', name: 'Minimalist Clean', desc: 'No heavy overlay accessories' },
    { id: 'glasses', name: 'Round Spec-Frames', desc: 'Vintage lightweight prescription' },
    { id: 'scarf', name: 'Fringe Muffler', desc: 'Chunky wool double-draped wrap' },
    { id: 'necklace', name: 'Astral Pendant', desc: 'Gold link string with dynamic charm' },
    { id: 'wings', name: 'Arch wings', desc: 'Ethereal feathered backing' },
    { id: 'satchel', name: 'Messenger Satchel', desc: 'Leather hip pouch with cross strap' }
  ]
};

// Available Patterns
const PATTERNS_LIST = [
  { id: 'solid', name: 'Solid Paint', desc: 'Uniform clean color block' },
  { id: 'stripes-h', name: 'Horizontal Rib', desc: 'Parallel aesthetic layers' },
  { id: 'stripes-v', name: 'Pinstripe Column', desc: 'Sleek vertical threads' },
  { id: 'dots', name: 'Classic Dotted', desc: 'Balanced polka microdots' },
  { id: 'checkerboard', name: 'Granular Grid', desc: 'Skater punk checkered tiles' },
  { id: 'stars', name: 'Nebula Constellation', desc: 'Mini galactic star markers' }
] as const;

export const SidebarControls: React.FC<SidebarControlsProps> = ({
  activeCategory,
  onSelectCategory,
  items,
  onUpdateItem,
  body,
  onUpdateBody
}) => {
  const categoriesList = Object.keys(CATEGORY_INFO) as ClothesCategory[];
  const activeItem = items[activeCategory];
  const activeStyles = STYLES_POOL[activeCategory];

  return (
    <div className="w-full flex flex-col gap-6" id="controls-panel">
      {/* Category Tabs */}
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 p-1.5 bg-slate-100 rounded-xl border border-slate-200">
        {categoriesList.map((catKey) => {
          const cat = CATEGORY_INFO[catKey];
          const isActive = activeCategory === catKey;
          const isCategoryHidden = !items[catKey]?.visible && catKey !== 'body';
          
          return (
            <button
              key={catKey}
              onClick={() => onSelectCategory(catKey)}
              className={`relative flex flex-col items-center justify-center p-2 rounded-lg text-center transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
              }`}
            >
              <cat.icon className={`h-4.5 w-4.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span className="text-[10px] font-medium tracking-tight mt-1 truncate max-w-full">
                {cat.label}
              </span>
              {isCategoryHidden && (
                <div className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-rose-500" title="Layer is currently disabled" />
              )}
            </button>
          );
        })}
      </div>

      {/* Dynamic Selector Area */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-6">
        {/* Category Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-slate-800">
              {CATEGORY_INFO[activeCategory].label} Setup
            </h3>
            <p className="text-[11px] text-slate-500">
              {CATEGORY_INFO[activeCategory].desc}
            </p>
          </div>

          {/* Visibility toggle for layers other than body */}
          {activeCategory !== 'body' && (
            <button
              onClick={() => onUpdateItem(activeCategory, { visible: !activeItem.visible })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                activeItem.visible
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {activeItem.visible ? (
                <>
                  <Eye className="h-3.5 w-3.5" /> Checked On
                </>
              ) : (
                <>
                  <EyeOff className="h-3.5 w-3.5" /> Hidden
                </>
              )}
            </button>
          )}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* BODY CONFIGURATOR SECTION                                     */}
        {/* ------------------------------------------------------------- */}
        {activeCategory === 'body' && (
          <div className="flex flex-col gap-6 animate-fade-in">
            {/* Skin Tone Selector */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-2.5">
                Skin Tone Palette
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {SKIN_TONES.map((tone) => {
                  const isSelected = body.skinTone === tone.id;
                  return (
                    <button
                      key={tone.id}
                      onClick={() => onUpdateBody({ skinTone: tone.id })}
                      className={`h-11 rounded-lg border-2 flex items-center justify-center p-1 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-indigo-600 ring-2 ring-indigo-100 scale-105'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                      title={tone.name}
                    >
                      <span
                        className="w-full h-full rounded shadow-inner"
                        style={{ backgroundColor: tone.hex }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Scale sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
              <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-100">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-medium text-slate-600">Model Width</span>
                  <span className="text-xs font-mono font-bold text-indigo-600">{(body.bodyScaleX * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.80"
                  max="1.25"
                  step="0.05"
                  value={body.bodyScaleX}
                  onChange={(e) => onUpdateBody({ bodyScaleX: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-100">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-medium text-slate-600">Model Height</span>
                  <span className="text-xs font-mono font-bold text-indigo-600">{(body.bodyScaleY * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.85"
                  max="1.15"
                  step="0.05"
                  value={body.bodyScaleY}
                  onChange={(e) => onUpdateBody({ bodyScaleY: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* GENERAL CLOTHES LAYER CONFIGURATOR (Style + Colors + Patterns) */}
        {/* ------------------------------------------------------------- */}
        {activeCategory !== 'body' && (
          <div className={`flex flex-col gap-6 ${!activeItem.visible ? 'opacity-40 pointer-events-none' : ''}`}>
            
            {/* Style Selector */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-2.5">
                Style Variation
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activeStyles.map((style) => {
                  const isSelected = activeItem.style === style.id;
                  return (
                    <button
                      key={style.id}
                      onClick={() => onUpdateItem(activeCategory, { style: style.id })}
                      className={`text-left p-2.5 rounded-xl border-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/20'
                          : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="font-semibold text-slate-800 text-xs flex items-center justify-between">
                        {style.name}
                        {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                        {style.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Colors Section (Only if styling is not none/bald etc.) */}
            {activeItem.style !== 'none' && (
              <div className="pt-5 border-t border-slate-100 space-y-5">
                
                {/* Primary, Secondary, Accent Pickers */}
                {(['primary', 'secondary', 'accent'] as const).map((colorKey) => {
                  const label = colorKey.charAt(0).toUpperCase() + colorKey.slice(1) + ' Tint';
                  const activeColorVal = activeItem.color[colorKey];

                  return (
                    <div key={colorKey} className="bg-slate-50/40 p-3 rounded-xl border border-slate-100/80">
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <span className="text-xs font-medium text-slate-700">{label}</span>
                        
                        {/* Native Hex Picker Row aligned on right */}
                        <div className="flex items-center gap-1.5 bg-white border border-slate-200 pl-2 pr-1 py-1 rounded-lg">
                          <span className="text-[10px] font-mono text-slate-500 uppercase">{activeColorVal}</span>
                          <input
                            type="color"
                            value={activeColorVal}
                            onChange={(e) => onUpdateItem(activeCategory, {
                              color: { ...activeItem.color, [colorKey]: e.target.value }
                            })}
                            className="h-5 w-5 rounded border-0 cursor-pointer p-0 w-max"
                          />
                        </div>
                      </div>

                      {/* Quick curations palette selection */}
                      <div className="flex flex-wrap gap-1.5">
                        {COLOR_PRESETS.map((preset) => (
                          <button
                            key={preset.value}
                            onClick={() => onUpdateItem(activeCategory, {
                              color: { ...activeItem.color, [colorKey]: preset.value }
                            })}
                            className={`h-5 w-5 rounded-full border border-slate-900/10 transition-transform cursor-pointer relative hover:scale-110 active:scale-95`}
                            style={{ backgroundColor: preset.value }}
                            title={preset.name}
                          >
                            {activeColorVal === preset.value && (
                              <span className="absolute inset-0 m-auto h-1.5 w-1.5 rounded-full bg-white shadow-sm" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}

              </div>
            )}

            {/* Patterns Section (Only if style is valid) */}
            {activeItem.style !== 'none' && (
              <div className="pt-5 border-t border-slate-100">
                <label className="text-xs font-semibold text-slate-700 block mb-2.5">
                  Fabric Pattern Print
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PATTERNS_LIST.map((pat) => {
                    const isSelected = activeItem.pattern.type === pat.id;
                    return (
                      <button
                        key={pat.id}
                        onClick={() => onUpdateItem(activeCategory, {
                          pattern: { ...activeItem.pattern, type: pat.id as any }
                        })}
                        className={`p-2 rounded-xl text-center border-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/20'
                            : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <span className="block font-semibold text-[11px] text-slate-700">{pat.name}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Print Opacity if pattern not solid */}
                {activeItem.pattern.type !== 'solid' && (
                  <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 mt-3 flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Pattern Intensity</span>
                      <span className="text-xs font-mono font-bold text-indigo-600">{(activeItem.pattern.opacity * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.10"
                      max="1.00"
                      step="0.05"
                      value={activeItem.pattern.opacity}
                      onChange={(e) => onUpdateItem(activeCategory, {
                        pattern: { ...activeItem.pattern, opacity: parseFloat(e.target.value) }
                      })}
                      className="w-full h-1 bg-slate-200 rounded appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};
