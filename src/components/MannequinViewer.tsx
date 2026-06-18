import React from 'react';
import { ClothingItem, BodyConfig, ClothesCategory } from '../types';

interface MannequinViewerProps {
  items: Record<ClothesCategory, ClothingItem>;
  body: BodyConfig;
  activeZoom: 'full' | 'head' | 'torso' | 'feet';
}

export const MannequinViewer: React.FC<MannequinViewerProps> = ({
  items,
  body,
  activeZoom
}) => {
  const { skinTone, bodyScaleX, bodyScaleY } = body;

  // Zooming class or transform
  const getZoomStyle = () => {
    switch (activeZoom) {
      case 'head':
        return { transform: 'scale(1.9) translateY(45px)', transformOrigin: 'center top' };
      case 'torso':
        return { transform: 'scale(1.4) translateY(-10px)', transformOrigin: 'center center' };
      case 'feet':
        return { transform: 'scale(2) translateY(-145px)', transformOrigin: 'center bottom' };
      default:
        return { transform: 'scale(1) translateY(0px)', transformOrigin: 'center' };
    }
  };

  // Preset Skin Tones Hex
  const getSkinToneHex = (tone: string) => {
    switch (tone) {
      case 'porcelain': return '#FFF0E5';
      case 'sand': return '#F3D2C1';
      case 'caramel': return '#C58F71';
      case 'cocoa': return '#8D5B4C';
      case 'obsidian': return '#452A22';
      // Fun colors
      case 'emerald': return '#A7F3D0';
      case 'violet': return '#DDD6FE';
      case 'silver': return '#E2E8F0';
      default: return tone;
    }
  };

  const skinColor = getSkinToneHex(skinTone);
  const shadowSkinColor = adjustColorBrightness(skinColor, -25);
  const blushColor = adjustColorBrightness(skinColor, -15);

  // Helper to adjust color for shadows
  function adjustColorBrightness(hex: string, percent: number) {
    let R = parseInt(hex.substring(1, 3), 16);
    let G = parseInt(hex.substring(3, 5), 16);
    let B = parseInt(hex.substring(5, 7), 16);

    R = parseInt((R * (100 + percent)) / 100 as any);
    G = parseInt((G * (100 + percent)) / 100 as any);
    B = parseInt((B * (100 + percent)) / 100 as any);

    R = (R < 255) ? R : 255;
    G = (G < 255) ? G : 255;
    B = (B < 255) ? B : 255;

    R = (R > 0) ? R : 0;
    G = (G > 0) ? G : 0;
    B = (B > 0) ? B : 0;

    const rHex = R.toString(16).padStart(2, '0');
    const gHex = G.toString(16).padStart(2, '0');
    const bHex = B.toString(16).padStart(2, '0');

    return `#${rHex}${gHex}${bHex}`;
  }

  // Pattern overlays
  const renderPatternMask = (item: ClothingItem, shapeId: string) => {
    if (!item.visible || item.pattern.type === 'solid') return null;
    return (
      <path
        d={shapeId}
        fill={`url(#pat-${item.pattern.type})`}
        style={{ opacity: item.pattern.opacity }}
        pointerEvents="none"
      />
    );
  };

  return (
    <div className="relative w-full h-[520px] rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4 shadow-inner border border-slate-200 overflow-hidden">
      {/* Background Grid Pattern Decors */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#cbd5e120_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e120_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

      {/* Shadow floor */}
      <div className="absolute bottom-6 w-32 h-4 bg-slate-900/10 rounded-full blur-sm" />

      {/* Core SVG Workspace */}
      <svg
        id="mannequin-canvas"
        viewBox="0 0 400 500"
        className="w-full h-full max-w-[380px] drop-shadow-xl transition-all duration-500 ease-out"
        style={getZoomStyle()}
      >
        <defs>
          {/* STRIPES HORIZONTAL */}
          <pattern id="pat-stripes-h" width="20" height="20" patternUnits="userSpaceOnUse">
            <line x1="0" y1="10" x2="20" y2="10" stroke="#000000" strokeWidth="6" strokeLinecap="square" />
          </pattern>

          {/* STRIPES VERTICAL */}
          <pattern id="pat-stripes-v" width="20" height="20" patternUnits="userSpaceOnUse">
            <line x1="10" y1="0" x2="10" y2="20" stroke="#000000" strokeWidth="6" strokeLinecap="square" />
          </pattern>

          {/* POLKA DOTS */}
          <pattern id="pat-dots" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="12" cy="12" r="5" fill="#000000" />
          </pattern>

          {/* CHECKERBOARD */}
          <pattern id="pat-checkerboard" width="30" height="30" patternUnits="userSpaceOnUse">
            <rect width="15" height="15" fill="#000000" />
            <rect x="15" y="15" width="15" height="15" fill="#000000" />
          </pattern>

          {/* STARS */}
          <pattern id="pat-stars" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 20 8 L 24 16 L 33 17 L 26 23 L 28 32 L 20 27 L 12 32 L 14 23 L 7 17 L 16 16 Z" fill="#000000" transform="scale(0.65) translate(10, 10)" />
          </pattern>

          {/* Flat shadow values */}
          <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" floodOpacity="0.1" />
          </filter>
        </defs>

        {/* ===================================================================== */}
        {/* CHARACTER / MANNEQUIN CORE GROUP                                     */}
        {/* ===================================================================== */}
        <g transform={`translate(${200 - 200 * bodyScaleX}, ${230 - 230 * bodyScaleY}) scale(${bodyScaleX}, ${bodyScaleY})`}>
          
          {/* --- BASE BODY / SKIN LAYER --- */}
          {/* Back Hair Layer (For long waves style) */}
          {items.hair.visible && items.hair.style === 'waves' && (
            <path
              d="M 155 100 C 130 140 125 210 145 250 C 145 230 160 170 180 140 Z M 245 100 C 270 140 275 210 255 250 C 255 230 240 170 220 140 Z"
              fill={items.hair.color.primary}
            />
          )}

          {/* Left Wing Accessory (Rendered behind body) */}
          {items.accessories.visible && items.accessories.style === 'wings' && (
            <g opacity="0.9" filter="url(#shadow)">
              {/* Outer feathered wing Left */}
              <path
                d="M 160 160 C 80 100 20 160 40 240 C 60 210 110 200 160 185 Z"
                fill={items.accessories.color.primary}
              />
              <path
                d="M 150 175 C 90 135 45 180 60 230 C 80 210 120 205 150 195 Z"
                fill={items.accessories.color.secondary}
              />
              {/* Right Wing */}
              <path
                d="M 240 160 C 320 100 380 160 360 240 C 340 210 290 200 240 185 Z"
                fill={items.accessories.color.primary}
              />
              <path
                d="M 250 175 C 310 135 355 180 340 230 C 320 210 280 205 250 195 Z"
                fill={items.accessories.color.secondary}
              />
            </g>
          )}

          {/* Ears */}
          <circle cx="170" cy="90" r="7" fill={skinColor} />
          <circle cx="230" cy="90" r="7" fill={skinColor} />
          {/* Ear shadow details */}
          <circle cx="171" cy="90" r="4" fill={shadowSkinColor} />
          <circle cx="229" cy="90" r="4" fill={shadowSkinColor} />

          {/* Neck */}
          <path d="M 188 112 L 212 112 L 210 137 L 190 137 Z" fill={skinColor} />
          <path d="M 188 112 L 212 112 L 210 121 L 190 121 Z" fill={shadowSkinColor} /> {/* neck shadow */}

          {/* Arms (Base) */}
          {/* L Arm */}
          <path d="M 155 140 C 130 180 120 220 120 260 C 120 270 128 270 132 260 C 138 220 148 180 168 140 Z" fill={skinColor} />
          {/* R Arm */}
          <path d="M 245 140 C 270 180 280 220 280 260 C 280 270 272 270 268 260 C 262 220 252 180 232 140 Z" fill={skinColor} />
          
          {/* Torso & Hip Base */}
          <path d="M 155 135 L 245 135 L 235 240 L 165 240 Z" fill={skinColor} />
          <path d="M 165 240 L 235 240 L 240 285 L 160 285 Z" fill={skinColor} stroke={shadowSkinColor} strokeWidth="1" />

          {/* Leg Base */}
          {/* L Leg */}
          <path d="M 160 280 L 195 280 C 190 330 182 380 180 430 L 160 430 C 163 380 165 330 160 280 Z" fill={skinColor} />
          {/* R Leg */}
          <path d="M 205 280 L 240 280 C 237 330 235 380 220 430 L 240 430 C 235 380 225 330 205 280 Z" fill={skinColor} />

          {/* Hands */}
          <circle cx="123" cy="264" r="8" fill={skinColor} />
          <circle cx="277" cy="264" r="8" fill={skinColor} />

          {/* --- FACE DETAILS --- */}
          <g>
            {/* Blushing cheeks */}
            <ellipse cx="183" cy="98" rx="5" ry="3" fill={blushColor} opacity="0.6" />
            <ellipse cx="217" cy="98" rx="5" ry="3" fill={blushColor} opacity="0.6" />
            {/* Cute sleeping eyes */}
            <path d="M 180 92 Q 185 96 190 92" fill="none" stroke="#2D3748" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 210 92 Q 215 96 220 92" fill="none" stroke="#2D3748" strokeWidth="2.5" strokeLinecap="round" />
            {/* Smile */}
            <path d="M 197 101 Q 200 105 203 101" fill="none" stroke="#2D3748" strokeWidth="2.5" strokeLinecap="round" />
          </g>

          {/* Head Sphere (Placed above ears/neck but behind hair & specs) */}
          <path d="M 170 90 C 170 54 230 54 230 90 C 230 115 170 115 170 90 Z" fill={skinColor} />

          {/* Underwear (Standard default so it's not empty) */}
          <path d="M 165 145 H 235 V 170 H 165 Z" fill="#4B5563" opacity="0.8" /> {/* default tube top */}
          <path d="M 160 268 H 240 L 230 285 H 170 Z" fill="#4B5563" opacity="0.8" /> {/* default briefs */}

          {/* ===================================================================== */}
          {/* TOPS LAYER                                                           */}
          {/* ===================================================================== */}
          {items.top.visible && (
            <g filter="url(#shadow)">
              {/* T-SHIRT */}
              {items.top.style === 'tshirt' && (
                <>
                  {/* Chest & Torso */}
                  <path id="top-tshirt-body" d="M 153 135 H 247 L 237 230 H 163 Z" fill={items.top.color.primary} />
                  {/* Stripes, dot, etc patterns for Main chest */}
                  {renderPatternMask(items.top, "M 153 135 H 247 L 237 230 H 163 Z")}

                  {/* Collar details */}
                  <path d="M 185 135 C 185 148 215 148 215 135 Z" fill={items.top.color.secondary} />

                  {/* Left Sleeve */}
                  <path d="M 155 135 L 135 175 L 148 181 L 168 145 Z" fill={items.top.color.primary} />
                  {/* Right Sleeve */}
                  <path d="M 245 135 L 265 175 L 252 181 L 232 145 Z" fill={items.top.color.primary} />
                </>
              )}

              {/* HOODIE */}
              {items.top.style === 'hoodie' && (
                <>
                  {/* Main Pullover */}
                  <path id="top-hoodie-body" d="M 150 135 H 250 L 240 245 H 160 Z" fill={items.top.color.primary} />
                  {renderPatternMask(items.top, "M 150 135 H 250 L 240 245 H 160 Z")}

                  {/* Kangaroo Hand Pocket */}
                  <path d="M 175 195 H 225 L 220 235 H 180 Z" fill={items.top.color.secondary} />
                  {/* Kangaroo Pocket Openings */}
                  <circle cx="181" cy="215" r="4" fill={items.top.color.accent} />
                  <circle cx="219" cy="215" r="4" fill={items.top.color.accent} />

                  {/* Bulky Sleeves */}
                  {/* L Slv */}
                  <path d="M 155 135 L 122 235 L 138 240 L 168 150 Z" fill={items.top.color.primary} />
                  <rect x="122" y="235" width="16" height="5" rx="2" fill={items.top.color.secondary} transform="rotate(-15, 122, 235)" />
                  {/* R Slv */}
                  <path d="M 245 135 L 278 235 L 262 240 L 232 150 Z" fill={items.top.color.primary} />
                  <rect x="262" y="240" width="16" height="5" rx="2" fill={items.top.color.secondary} transform="rotate(15, 262, 240)" />

                  {/* Cozy Hood behind/around neckline */}
                  <path d="M 175 135 C 175 110 225 110 225 135 C 225 145 175 145 175 135 Z" fill={items.top.color.secondary} />
                  {/* Strings */}
                  <line x1="190" y1="135" x2="190" y2="165" stroke={items.top.color.accent} strokeWidth="3" strokeLinecap="round" />
                  <line x1="210" y1="135" x2="210" y2="165" stroke={items.top.color.accent} strokeWidth="3" strokeLinecap="round" />
                </>
              )}

              {/* SWEATER */}
              {items.top.style === 'sweater' && (
                <>
                  {/* Torso */}
                  <path id="top-sweater-body" d="M 152 135 H 248 L 236 235 H 164 Z" fill={items.top.color.primary} />
                  {renderPatternMask(items.top, "M 152 135 H 248 L 236 235 H 164 Z")}

                  {/* Ribbed Hem & Neckline */}
                  <path d="M 164 228 H 236 V 235 H 164 Z" fill={items.top.color.secondary} />
                  <path d="M 183 135 H 217 V 144 H 183 Z" fill={items.top.color.secondary} />

                  {/* Sleeves */}
                  <path d="M 154 135 L 123 245 L 137 248 L 166 148 Z" fill={items.top.color.primary} />
                  <path d="M 246 135 L 277 245 L 263 248 L 234 148 Z" fill={items.top.color.primary} />
                  {/* Ribbed Cuffs */}
                  <rect x="121" y="243" width="14" height="6" rx="1" fill={items.top.color.secondary} transform="rotate(-15, 121, 243)" />
                  <rect x="264" y="243" width="14" height="6" rx="1" fill={items.top.color.secondary} transform="rotate(15, 264, 243)" />
                </>
              )}

              {/* CROP TOP */}
              {items.top.style === 'croptop' && (
                <>
                  <path id="top-crop-body" d="M 154 135 H 246 L 240 185 H 160 Z" fill={items.top.color.primary} />
                  {renderPatternMask(items.top, "M 154 135 H 246 L 240 185 H 160 Z")}

                  {/* Strap/Sleeves */}
                  <path d="M 154 135 L 140 160 L 150 165 L 162 142 Z" fill={items.top.color.secondary} />
                  <path d="M 246 135 L 260 160 L 250 165 L 238 142 Z" fill={items.top.color.secondary} />
                </>
              )}

              {/* TANK TOP */}
              {items.top.style === 'tanktop' && (
                <>
                  <path id="top-tank-body" d="M 162 135 H 238 L 234 220 H 166 Z" fill={items.top.color.primary} />
                  {renderPatternMask(items.top, "M 162 135 H 238 L 234 220 H 166 Z")}

                  {/* Deep neck curve */}
                  <path d="M 180 135 C 180 152 220 152 220 135 Z" fill={skinColor} />
                  {/* Trim bindings */}
                  <path d="M 162 135 H 178 V 142 H 162 Z" fill={items.top.color.accent} />
                  <path d="M 222 135 H 238 V 142 H 222 Z" fill={items.top.color.accent} />
                </>
              )}

              {/* BLAZER / SUIT JACKET */}
              {items.top.style === 'blazer' && (
                <>
                  {/* Inside Shirt & Tie */}
                  <path d="M 178 135 L 222 135 L 200 185 Z" fill="#F8FAFC" />
                  <path d="M 197 142 L 203 142 L 205 175 L 200 182 L 195 175 Z" fill={items.top.color.accent} /> {/* Tie */}

                  {/* Main Blazer Outline */}
                  <path d="M 150 135 H 178 L 195 210 L 200 240 L 205 210 L 222 135 H 250 L 240 240 H 160 Z" fill={items.top.color.primary} />
                  {/* Collar Lapels */}
                  <path d="M 150 135 L 175 185 L 188 185 L 178 135 Z" fill={items.top.color.secondary} />
                  <path d="M 250 135 L 225 185 L 212 185 L 222 135 Z" fill={items.top.color.secondary} />

                  {/* Golden Single Button */}
                  <circle cx="200" cy="210" r="3.5" fill="#EAB308" />

                  {/* Tailored Sleeves */}
                  <path d="M 154 135 L 124 245 L 138 248 L 166 148 Z" fill={items.top.color.primary} />
                  <path d="M 246 135 L 276 245 L 262 248 L 234 148 Z" fill={items.top.color.primary} />
                  {/* Wrist detail cuffs */}
                  <path d="M 124 240 L 134 243 H 138 L 128 240 Z" fill={items.top.color.secondary} stroke={items.top.color.primary} strokeWidth="1" />
                </>
              )}
            </g>
          )}

          {/* ===================================================================== */}
          {/* BOTTOMS LAYER                                                        */}
          {/* ===================================================================== */}
          {items.bottom.visible && (
            <g filter="url(#shadow)">
              {/* JEANS */}
              {items.bottom.style === 'jeans' && (
                <>
                  {/* Pants Hip & Legs */}
                  <path id="bottom-jeans" d="M 160 235 H 240 L 238 280 C 238 310 231 360 228 420 H 204 C 204 360 202 310 200 285 C 198 310 196 360 196 420 H 172 C 169 360 162 310 162 280 Z" fill={items.bottom.color.primary} />
                  {renderPatternMask(items.bottom, "M 160 235 H 240 L 238 280 C 238 310 231 360 228 420 H 204 C 204 360 202 310 200 285 C 198 310 196 360 196 420 H 172 C 169 360 162 310 162 280 Z")}

                  {/* Belt loops & pockets stitches */}
                  <path d="M 160 235 H 240 V 246 H 160 Z" fill={items.bottom.color.secondary} opacity="0.9" />
                  <line x1="160" y1="246" x2="240" y2="246" stroke={items.bottom.color.accent} strokeWidth="1.5" strokeDasharray="3 2" />
                  {/* Pockets */}
                  <path d="M 165 246 Q 170 262 178 259" fill="none" stroke={items.bottom.color.accent} strokeWidth="1.5" />
                  <path d="M 235 246 Q 230 262 222 259" fill="none" stroke={items.bottom.color.accent} strokeWidth="1.5" />
                </>
              )}

              {/* SHORTS */}
              {items.bottom.style === 'shorts' && (
                <>
                  <path id="bottom-shorts" d="M 160 235 H 240 L 244 320 H 205 L 200 275 L 195 320 H 156 Z" fill={items.bottom.color.primary} />
                  {renderPatternMask(items.bottom, "M 160 235 H 240 L 244 320 H 205 L 200 275 L 195 320 H 156 Z")}

                  {/* Drawstring or belt */}
                  <path d="M 160 235 H 240 V 244 H 160 Z" fill={items.bottom.color.secondary} />
                  <circle cx="200" cy="240" r="3.5" fill={items.bottom.color.accent} />
                  {/* Small loose ribbons hanging */}
                  <path d="M 198 240 Q 192 255 194 262" fill="none" stroke={items.bottom.color.accent} strokeWidth="2.5" />
                  <path d="M 202 240 Q 208 255 206 262" fill="none" stroke={items.bottom.color.accent} strokeWidth="2.5" />
                </>
              )}

              {/* PLEATED SKIRT */}
              {items.bottom.style === 'skirt' && (
                <>
                  <path id="bottom-skirt" d="M 165 235 H 235 L 255 330 H 145 Z" fill={items.bottom.color.primary} />
                  {renderPatternMask(items.bottom, "M 165 235 H 235 L 255 330 H 145 Z")}

                  {/* Waistband */}
                  <path d="M 165 235 H 235 V 246 H 165 Z" fill={items.bottom.color.secondary} />
                  {/* Pleat lines */}
                  <g stroke={items.bottom.color.accent} strokeWidth="2" opacity="0.6">
                    <line x1="180" y1="246" x2="165" y2="330" />
                    <line x1="193" y1="246" x2="185" y2="330" />
                    <line x1="207" y1="246" x2="215" y2="330" />
                    <line x1="220" y1="246" x2="235" y2="330" />
                  </g>
                </>
              )}

              {/* CARGO PANTS */}
              {items.bottom.style === 'cargo' && (
                <>
                  {/* Heavy legs with folded creases */}
                  <path id="bottom-cargo" d="M 158 235 H 242 L 244 280 C 244 310 236 350 232 420 H 205 C 205 365 203 310 200 288 C 197 310 195 365 195 420 H 168 C 164 350 156 310 156 280 Z" fill={items.bottom.color.primary} />
                  {renderPatternMask(items.bottom, "M 158 235 H 242 L 244 280 C 244 310 236 350 232 420 H 205 C 205 365 203 310 200 288 C 197 310 195 365 195 420 H 168 C 164 350 156 310 156 280 Z")}

                  {/* Bulky Side Pockets */}
                  <path d="M 154 300 H 163 V 335 H 154 Z" fill={items.bottom.color.secondary} />
                  <path d="M 237 300 H 246 V 335 H 237 Z" fill={items.bottom.color.secondary} />
                  {/* Pocket Flaps */}
                  <path d="M 153 298 H 164 V 306 H 153 Z" fill={items.bottom.color.accent} />
                  <path d="M 236 298 H 247 V 306 H 236 Z" fill={items.bottom.color.accent} />

                  {/* Elastic waistband */}
                  <path d="M 158 235 H 242 V 246 H 158 Z" fill={items.bottom.color.secondary} />
                </>
              )}

              {/* COZY JOGGERS */}
              {items.bottom.style === 'joggers' && (
                <>
                  <path id="bottom-joggers" d="M 159 235 H 241 L 241 280 C 241 310 232 360 226 414 H 210 C 208 385 203 310 200 286 C 197 310 192 385 190 414 H 174 C 168 360 159 310 159 280 Z" fill={items.bottom.color.primary} />
                  {renderPatternMask(items.bottom, "M 159 235 H 241 L 241 280 C 241 310 232 360 226 414 H 210 C 208 385 203 310 200 286 C 197 310 192 385 190 414 H 174 C 168 360 159 310 159 280 Z")}

                  {/* Cuff Ankles */}
                  <rect x="174" y="414" width="16" height="7" rx="2.2" fill={items.bottom.color.secondary} />
                  <rect x="210" y="414" width="16" height="7" rx="2.2" fill={items.bottom.color.secondary} />

                  {/* Slanted stylish stripes on the leg sides */}
                  <path d="M 160 260 L 162 310" stroke={items.bottom.color.accent} strokeWidth="3.5" strokeLinecap="round" />
                  <path d="M 240 260 L 238 310" stroke={items.bottom.color.accent} strokeWidth="3.5" strokeLinecap="round" />
                </>
              )}
            </g>
          )}

          {/* ===================================================================== */}
          {/* FOOTWEAR LAYER                                                       */}
          {/* ===================================================================== */}
          {items.footwear.visible && (
            <g filter="url(#shadow)">
              {/* SNEAKERS */}
              {items.footwear.style === 'sneakers' && (
                <>
                  {/* Left Sneaker */}
                  <g>
                    {/* Foot Core */}
                    <path d="M 160 418 H 182 L 186 438 H 152 Z" fill={items.footwear.color.primary} />
                    {/* White Platform Sole */}
                    <path d="M 150 435 H 188 V 441 H 150 Z" fill="#FFFFFF" />
                    {/* Sneakers details */}
                    <path d="M 165 418 C 165 425 180 430 180 435 Z" fill={items.footwear.color.secondary} opacity="0.8" />
                    {/* Laces */}
                    <line x1="164" y1="422" x2="174" y2="422" stroke={items.footwear.color.accent} strokeWidth="2.5" />
                    <line x1="166" y1="428" x2="176" y2="428" stroke={items.footwear.color.accent} strokeWidth="2.5" />
                  </g>
                  {/* Right Sneaker */}
                  <g>
                    <path d="M 218 418 H 240 L 248 438 H 214 Z" fill={items.footwear.color.primary} />
                    <path d="M 212 435 H 250 V 441 H 212 Z" fill="#FFFFFF" />
                    <path d="M 235 418 C 235 425 220 430 220 435 Z" fill={items.footwear.color.secondary} opacity="0.8" />
                    <line x1="226" y1="422" x2="236" y2="422" stroke={items.footwear.color.accent} strokeWidth="2.5" />
                    <line x1="224" y1="428" x2="234" y2="428" stroke={items.footwear.color.accent} strokeWidth="2.5" />
                  </g>
                </>
              )}

              {/* HEAVY BOOTS */}
              {items.footwear.style === 'boots' && (
                <>
                  {/* Left Boot */}
                  <g>
                    {/* Ankle wrap up */}
                    <rect x="156" y="405" width="26" height="24" rx="2" fill={items.footwear.color.secondary} />
                    {/* Boot foot */}
                    <path d="M 152 422 H 184 L 188 440 H 146 Z" fill={items.footwear.color.primary} />
                    {/* Sole grip */}
                    <path d="M 144 438 H 190 V 444 H 144 Z" fill={items.footwear.color.accent} />
                  </g>
                  {/* Right Boot */}
                  <g>
                    <rect x="218" y="405" width="26" height="24" rx="2" fill={items.footwear.color.secondary} />
                    <path d="M 216 422 H 248 L 254 440 H 212 Z" fill={items.footwear.color.primary} />
                    <path d="M 210 438 H 256 V 444 H 210 Z" fill={items.footwear.color.accent} />
                  </g>
                </>
              )}

              {/* SANDALS */}
              {items.footwear.style === 'sandals' && (
                <>
                  {/* Left Sandal */}
                  <g>
                    <path d="M 152 436 H 188 V 441 H 152 Z" fill={items.footwear.color.primary} />
                    {/* Straps overlay on skin */}
                    <path d="M 158 420 C 162 420 166 430 168 436" fill="none" stroke={items.footwear.color.secondary} strokeWidth="3" />
                    <path d="M 174 420 C 170 420 168 430 168 436" fill="none" stroke={items.footwear.color.secondary} strokeWidth="3" />
                  </g>
                  {/* Right Sandal */}
                  <g>
                    <path d="M 212 436 H 248 V 441 H 212 Z" fill={items.footwear.color.primary} />
                    <path d="M 226 420 C 230 420 232 430 232 436" fill="none" stroke={items.footwear.color.secondary} strokeWidth="3" />
                    <path d="M 242 420 C 238 420 234 430 232 436" fill="none" stroke={items.footwear.color.secondary} strokeWidth="3" />
                  </g>
                </>
              )}

              {/* DRESS SHOES / LOAFERS */}
              {items.footwear.style === 'dress_shoes' && (
                <>
                  {/* Left Dress Shoe */}
                  <g>
                    <path d="M 154 420 Q 170 415 186 422 L 188 438 H 150 Z" fill={items.footwear.color.primary} />
                    <path d="M 148 436 H 190 V 440 H 148 Z" fill={items.footwear.color.secondary} />
                    {/* Shiny accent buckle */}
                    <circle cx="168" cy="425" r="2.5" fill={items.footwear.color.accent} />
                  </g>
                  {/* Right Dress Shoe */}
                  <g>
                    <path d="M 214 420 Q 230 415 246 422 L 250 438 H 210 Z" fill={items.footwear.color.primary} />
                    <path d="M 208 436 H 252 V 440 H 208 Z" fill={items.footwear.color.secondary} />
                    <circle cx="232" cy="425" r="2.5" fill={items.footwear.color.accent} />
                  </g>
                </>
              )}
            </g>
          )}

          {/* ===================================================================== */}
          {/* HAIR CONFIG                                                          */}
          {/* ===================================================================== */}
          {items.hair.visible && (
            <g filter="url(#shadow)">
              {/* SHORT CROP */}
              {items.hair.style === 'crop' && (
                <path
                  d="M 166 84 C 160 55 240 55 234 84 C 234 70 215 65 200 65 C 185 65 166 70 166 84 Z"
                  fill={items.hair.color.primary}
                />
              )}

              {/* LONG WAVY HAIR (Front overlays on shoulders) */}
              {items.hair.style === 'waves' && (
                <>
                  {/* Wave Fringe & Locks overlaying front shoulder */}
                  <path
                    d="M 170 85 C 168 50 232 50 230 85 C 220 70 180 70 170 85 Z"
                    fill={items.hair.color.primary}
                  />
                  {/* Hanging curls and locks */}
                  <path
                    d="M 170 85 Q 155 110 160 145 Q 165 170 155 195 Q 168 180 175 145 Z"
                    fill={items.hair.color.secondary}
                  />
                  <path
                    d="M 230 85 Q 245 110 240 145 Q 235 170 245 195 Q 232 180 225 145 Z"
                    fill={items.hair.color.secondary}
                  />
                </>
              )}

              {/* CLASSIC BOB */}
              {items.hair.style === 'bob' && (
                <path
                  d="M 164 100 C 158 50 242 50 236 100 Q 236 115 226 115 Q 174 115 164 100 Z"
                  fill={items.hair.color.primary}
                />
              )}

              {/* SPIKY MOHAWK */}
              {items.hair.style === 'mohawk' && (
                <path
                  d="M 194 62 L 206 62 L 208 42 L 202 50 L 198 40 L 196 50 Z M 196 75 L 204 75 L 205 58 L 200 62 L 195 58 Z"
                  fill={items.hair.color.primary}
                />
              )}

              {/* ELEGANT BUN */}
              {items.hair.style === 'bun' && (
                <>
                  {/* Bun Sphere on top of crown */}
                  <circle cx="200" cy="50" r="14" fill={items.hair.color.secondary} />
                  {/* Head wrap */}
                  <path
                    d="M 170 85 C 170 55 230 55 230 85 Z"
                    fill={items.hair.color.primary}
                  />
                </>
              )}

              {/* MODERN BRAIDS */}
              {items.hair.style === 'braids' && (
                <>
                  <path d="M 170 85 C 170 56 230 56 230 85 Z" fill={items.hair.color.primary} />
                  {/* Braids drooping Left */}
                  <path d="M 170 85 C 160 110 155 160 150 210 V 222 H 158 V 210 Q 165 140 174 110 Z" fill={items.hair.color.primary} />
                  <circle cx="154" cy="218" r="4.5" fill={items.hair.color.accent} />
                  {/* Braids drooping Right */}
                  <path d="M 230 85 C 240 110 245 160 250 210 V 222 H 242 V 210 Q 235 140 226 110 Z" fill={items.hair.color.primary} />
                  <circle cx="246" cy="218" r="4.5" fill={items.hair.color.accent} />
                </>
              )}
            </g>
          )}

          {/* ===================================================================== */}
          {/* HEADWEAR LAYER                                                       */}
          {/* ===================================================================== */}
          {items.headwear.visible && (
            <g filter="url(#shadow)">
              {/* BASEBALL CAP */}
              {items.headwear.style === 'cap' && (
                <>
                  {/* Dome */}
                  <path d="M 170 80 C 170 44 230 44 230 80 H 170 Z" fill={items.headwear.color.primary} />
                  {/* Ribbon/Strap details */}
                  <path d="M 170 76 H 230 V 82 H 170 Z" fill={items.headwear.color.secondary} />
                  {/* Cap Beak/Visor */}
                  <path d="M 172 80 H 228 C 242 80 242 92 224 92 H 176 C 158 92 158 80 172 80 Z" fill={items.headwear.color.accent} />
                </>
              )}

              {/* ACY RIBS BEANIE */}
              {items.headwear.style === 'beanie' && (
                <>
                  {/* Slouched dome */}
                  <path d="M 166 84 C 162 48 238 48 234 84 Z" fill={items.headwear.color.primary} />
                  {/* Ribbed roll */}
                  <rect x="164" y="78" width="72" height="12" rx="4" fill={items.headwear.color.secondary} />
                  {/* Beanie Pom-Pom ball on top */}
                  <circle cx="200" cy="46" r="6.5" fill={items.headwear.color.accent} />
                </>
              )}

              {/* SUMMER SUNHAT */}
              {items.headwear.style === 'sunhat' && (
                <>
                  {/* Crown */}
                  <path d="M 174 76 C 174 48 226 48 226 76 Z" fill={items.headwear.color.primary} />
                  {/* Ribbon strap */}
                  <path d="M 174 72 H 226 V 78 H 174 Z" fill={items.headwear.color.accent} />
                  {/* Big Floppy Brim ellipse hat */}
                  <ellipse cx="200" cy="78" rx="55" ry="10" fill={items.headwear.color.secondary} stroke={items.headwear.color.primary} strokeWidth="1" />
                </>
              )}

              {/* GOLDEN ROYAL CROWN */}
              {items.headwear.style === 'crown' && (
                <>
                  {/* Tri-peak crown */}
                  <path d="M 174 80 L 170 60 L 188 72 L 200 52 L 212 72 L 230 60 L 226 80 Z" fill={items.headwear.color.primary} stroke={items.headwear.color.secondary} strokeWidth="1" />
                  {/* Jewels circles */}
                  <circle cx="170" cy="58" r="3.5" fill="#EF4444" /> {/* Red ruby */}
                  <circle cx="200" cy="50" r="3.5" fill="#3B82F6" /> {/* Sapphire */}
                  <circle cx="230" cy="58" r="3.5" fill="#EF4444" />
                  {/* Crown ring base */}
                  <rect x="173" y="76" width="54" height="6" rx="2.2" fill={items.headwear.color.accent} />
                </>
              )}

              {/* ATHLETIC HEADBAND */}
              {items.headwear.style === 'headband' && (
                <rect x="170" y="70" width="60" height="9" rx="1.5" fill={items.headwear.color.primary} stroke={items.headwear.color.secondary} strokeWidth="1.5" />
              )}
            </g>
          )}

          {/* ===================================================================== */}
          {/* ACCESSORIES (GLASSES / SATCHEL / SCARF)                              */}
          {/* ===================================================================== */}
          {items.accessories.visible && (
            <g filter="url(#shadow)">
              {/* GLASSES */}
              {items.accessories.style === 'glasses' && (
                <g>
                  {/* Transparent glass glow filter lenses */}
                  <circle cx="187" cy="90" r="11" fill="none" stroke={items.accessories.color.primary} strokeWidth="3" />
                  <circle cx="187" cy="90" r="9" fill="#93C5FD" opacity="0.3" />
                  
                  <circle cx="213" cy="90" r="11" fill="none" stroke={items.accessories.color.primary} strokeWidth="3" />
                  <circle cx="213" cy="90" r="9" fill="#93C5FD" opacity="0.3" />

                  {/* Bridge */}
                  <line x1="198" y1="90" x2="202" y2="90" stroke={items.accessories.color.primary} strokeWidth="3.5" />
                  {/* Side ears support */}
                  <line x1="171" y1="90" x2="176" y2="90" stroke={items.accessories.color.primary} strokeWidth="2.5" />
                  <line x1="224" y1="90" x2="229" y2="90" stroke={items.accessories.color.primary} strokeWidth="2.5" />
                </g>
              )}

              {/* COLLAR SCARF */}
              {items.accessories.style === 'scarf' && (
                <g>
                  {/* Wrapped around the neck */}
                  <rect x="178" y="112" width="44" height="15" rx="5" fill={items.accessories.color.primary} stroke={items.accessories.color.secondary} strokeWidth="1" />
                  {/* Hanging tails */}
                  <path d="M 183 125 C 183 140 178 185 186 195 H 198 C 196 160 195 140 195 125 Z" fill={items.accessories.color.secondary} />
                  {/* Scarf Fringes details */}
                  <line x1="186" y1="195" x2="186" y2="202" stroke={items.accessories.color.accent} strokeWidth="2" />
                  <line x1="190" y1="195" x2="190" y2="202" stroke={items.accessories.color.accent} strokeWidth="2" />
                  <line x1="194" y1="195" x2="194" y2="202" stroke={items.accessories.color.accent} strokeWidth="2" />
                </g>
              )}

              {/* GOLD PENDANT NECKLACE */}
              {items.accessories.style === 'necklace' && (
                <g>
                  {/* Chain curve */}
                  <path d="M 188 120 C 188 144 212 144 212 120" fill="none" stroke={items.accessories.color.primary} strokeWidth="2" />
                  {/* Star / Heart charm jewel pendant link */}
                  <polygon points="200,136 203,142 209,142 204,146 206,152 200,148 194,152 196,146 191,142 197,142" fill={items.accessories.color.secondary} stroke={items.accessories.color.accent} strokeWidth="1" />
                </g>
              )}

              {/* SATCHEL BAG (Cross-body) */}
              {items.accessories.style === 'satchel' && (
                <g>
                  {/* Diagonal shoulder strap */}
                  <path d="M 152 135 L 235 210 L 243 205 L 160 130 Z" fill={items.accessories.color.secondary} opacity="0.9" />
                  {/* Circular Bag pouch resting on the hip */}
                  <rect x="222" y="195" width="28" height="22" rx="4" fill={items.accessories.color.primary} />
                  {/* Lock metal badge */}
                  <circle cx="236" cy="208" r="3" fill={items.accessories.color.accent} />
                </g>
              )}
            </g>
          )}

        </g>
      </svg>
    </div>
  );
};
