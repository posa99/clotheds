import React, { useState, useEffect, useRef } from 'react';
import { ClothingItem, BodyConfig, ClothesCategory, CustomOutfit, PresetOutfit } from './types';
import { MannequinViewer } from './components/MannequinViewer';
import { SidebarControls } from './components/SidebarControls';
import {
  Sparkles,
  RotateCcw,
  Download,
  Copy,
  Plus,
  Trash2,
  FolderHeart,
  Undo2,
  Redo2,
  BookmarkCheck,
  Crown,
  Shirt,
  Volume2,
  Share2,
  Import,
  Check
} from 'lucide-react';

const INITIAL_BODY_CONFIG: BodyConfig = {
  skinTone: 'porcelain',
  bodyScaleX: 1.0,
  bodyScaleY: 1.0,
  genderNeutralPose: 'neutral'
};

const DEFAULT_ITEMS_STATE: Record<ClothesCategory, ClothingItem> = {
  body: {
    id: 'body_default',
    name: 'Mannequin',
    category: 'body',
    style: 'neutral',
    color: { primary: '#FFF0E5', secondary: '#F3D2C1', accent: '#FFF' },
    pattern: { type: 'solid', scale: 1, opacity: 0.5 },
    visible: true
  },
  hair: {
    id: 'hair_crop',
    name: 'Short Crop',
    category: 'hair',
    style: 'crop',
    color: { primary: '#4A5568', secondary: '#2D3748', accent: '#718096' },
    pattern: { type: 'solid', scale: 1, opacity: 0.5 },
    visible: true
  },
  headwear: {
    id: 'head_none',
    name: 'None',
    category: 'headwear',
    style: 'none',
    color: { primary: '#0ea5e9', secondary: '#38bdf8', accent: '#ffffff' },
    pattern: { type: 'solid', scale: 1, opacity: 0.5 },
    visible: false
  },
  top: {
    id: 'top_tshirt',
    name: 'T-Shirt',
    category: 'top',
    style: 'tshirt',
    color: { primary: '#4f46e5', secondary: '#6366f1', accent: '#ffffff' },
    pattern: { type: 'solid', scale: 1, opacity: 0.5 },
    visible: true
  },
  bottom: {
    id: 'bottom_shorts',
    name: 'Shorts',
    category: 'bottom',
    style: 'shorts',
    color: { primary: '#10b981', secondary: '#34d399', accent: '#ffffff' },
    pattern: { type: 'solid', scale: 1, opacity: 0.5 },
    visible: true
  },
  footwear: {
    id: 'foot_sneakers',
    name: 'Sneakers',
    category: 'footwear',
    style: 'sneakers',
    color: { primary: '#f43f5e', secondary: '#fda4af', accent: '#ffffff' },
    pattern: { type: 'solid', scale: 1, opacity: 0.5 },
    visible: true
  },
  accessories: {
    id: 'acc_none',
    name: 'None',
    category: 'accessories',
    style: 'none',
    color: { primary: '#fbbf24', secondary: '#fcd34d', accent: '#ffffff' },
    pattern: { type: 'solid', scale: 1, opacity: 0.5 },
    visible: false
  }
};

// Preset Outfits Catalog mapping type requirements
const PRESETS_CATALOG: PresetOutfit[] = [
  {
    name: 'Cybernetic Outlaw',
    description: 'Anarchistic hacker gear, glowing synth-neon details, and signature spiky mohawk look.',
    theme: 'cyberpunk',
    body: { skinTone: 'silver', bodyScaleX: 0.95, bodyScaleY: 1.05 },
    items: {
      hair: { style: 'mohawk', color: { primary: '#06B6D4', secondary: '#EC4899', accent: '#FFFFFF' }, visible: true },
      headwear: { style: 'headband', color: { primary: '#111827', secondary: '#06B6D4', accent: '#000000' }, visible: true },
      top: { style: 'hoodie', color: { primary: '#1F2937', secondary: '#EC4899', accent: '#06B6D4' }, pattern: { type: 'stripes-v', scale: 1, opacity: 0.6 }, visible: true },
      bottom: { style: 'cargo', color: { primary: '#111827', secondary: '#374151', accent: '#EC4899' }, visible: true },
      footwear: { style: 'boots', color: { primary: '#000000', secondary: '#111827', accent: '#06B6D4' }, visible: true },
      accessories: { style: 'wings', color: { primary: '#EC4899', secondary: '#06B6D4', accent: '#FFFFFF' }, visible: true }
    }
  },
  {
    name: 'Pacific Sunseeker',
    description: 'Floppy broad-brimmed protection, warm beach tones, and casual strap footwear pairing.',
    theme: 'summer',
    body: { skinTone: 'sand', bodyScaleX: 1.0, bodyScaleY: 0.95 },
    items: {
      hair: { style: 'waves', color: { primary: '#EAB308', secondary: '#CA8A04', accent: '#E2E8F0' }, visible: true },
      headwear: { style: 'sunhat', color: { primary: '#FDE047', secondary: '#854D0E', accent: '#F87171' }, visible: true },
      top: { style: 'croptop', color: { primary: '#EF4444', secondary: '#FCA5A5', accent: '#FFFFFF' }, visible: true },
      bottom: { style: 'skirt', color: { primary: '#0D9488', secondary: '#14B8A6', accent: '#FFFFFF' }, pattern: { type: 'dots', scale: 1, opacity: 0.4 }, visible: true },
      footwear: { style: 'sandals', color: { primary: '#854D0E', secondary: '#FEF08A', accent: '#EAB308' }, visible: true },
      accessories: { style: 'glasses', color: { primary: '#1E293B', secondary: '#FCA5A5', accent: '#FFFFFF' }, visible: true }
    }
  },
  {
    name: 'Executive Vice Envoy',
    description: 'Crisp navy office blazer tailored with gold tie badges, sleek bun, and shining leather loafers.',
    theme: 'formal',
    body: { skinTone: 'porcelain', bodyScaleX: 1.05, bodyScaleY: 1.10 },
    items: {
      hair: { style: 'bun', color: { primary: '#1E293B', secondary: '#475569', accent: '#000000' }, visible: true },
      headwear: { style: 'none', visible: false },
      top: { style: 'blazer', color: { primary: '#0F172A', secondary: '#F1F5F9', accent: '#D97706' }, visible: true },
      bottom: { style: 'jeans', color: { primary: '#1D4ED8', secondary: '#1E40AF', accent: '#D97706' }, visible: true },
      footwear: { style: 'dress_shoes', color: { primary: '#452A22', secondary: '#1E293B', accent: '#FBBF24' }, visible: true },
      accessories: { style: 'necklace', color: { primary: '#FBBF24', secondary: '#FBBF24', accent: '#D97706' }, visible: true }
    }
  },
  {
    name: 'Nordic Cabin Warmth',
    description: 'Chunky maroon woolen pullover with checkerboard stitches, cozy knitted beanie, and fleece joggers.',
    theme: 'cozy',
    body: { skinTone: 'caramel', bodyScaleX: 1.0, bodyScaleY: 1.0 },
    items: {
      hair: { style: 'bob', color: { primary: '#991B1B', secondary: '#7F1D1D', accent: '#FFFFFF' }, visible: true },
      headwear: { style: 'beanie', color: { primary: '#F8FAFC', secondary: '#64748B', accent: '#991B1B' }, visible: true },
      top: { style: 'sweater', color: { primary: '#881337', secondary: '#FAFAFA', accent: '#F43F5E' }, pattern: { type: 'checkerboard', scale: 1, opacity: 0.3 }, visible: true },
      bottom: { style: 'joggers', color: { primary: '#475569', secondary: '#F1F5F9', accent: '#881337' }, visible: true },
      footwear: { style: 'boots', color: { primary: '#8D5B4C', secondary: '#FFF0E5', accent: '#000000' }, visible: true },
      accessories: { style: 'scarf', color: { primary: '#F43F5E', secondary: '#881337', accent: '#FBBF24' }, visible: true }
    }
  },
  {
    name: 'Retro Sport Wave',
    description: 'Active aesthetic featuring high-contrast chest binders, headbands, and sleek tapered track legs.',
    theme: 'sporty',
    body: { skinTone: 'caramel', bodyScaleX: 1.08, bodyScaleY: 1.05 },
    items: {
      hair: { style: 'crop', color: { primary: '#F59E0B', secondary: '#B45309', accent: '#FEF3C7' }, visible: true },
      headwear: { style: 'headband', color: { primary: '#4F46E5', secondary: '#EF4444', accent: '#FFFFFF' }, visible: true },
      top: { style: 'tanktop', color: { primary: '#4F46E5', secondary: '#C7D2FE', accent: '#EF4444' }, visible: true },
      bottom: { style: 'joggers', color: { primary: '#1F2937', secondary: '#4F46E5', accent: '#4F46E5' }, visible: true },
      footwear: { style: 'sneakers', color: { primary: '#EF4444', secondary: '#FFFFFF', accent: '#4F46E5' }, visible: true },
      accessories: { style: 'satchel', color: { primary: '#111827', secondary: '#F59E0B', accent: '#F1F5F9' }, visible: true }
    }
  },
  {
    name: 'Royalty Astral',
    description: 'A sovereign crown on twin braided hair, heavenly flight wings, and rich imperial gold accents.',
    theme: 'royal',
    body: { skinTone: 'violet', bodyScaleX: 0.9, bodyScaleY: 1.12 },
    items: {
      hair: { style: 'braids', color: { primary: '#7C3AED', secondary: '#4C1D95', accent: '#F1F5F9' }, visible: true },
      headwear: { style: 'crown', color: { primary: '#FBBF24', secondary: '#D97706', accent: '#EF4444' }, visible: true },
      top: { style: 'blazer', color: { primary: '#4C1D95', secondary: '#FBBF24', accent: '#F59E0B' }, visible: true },
      bottom: { style: 'skirt', color: { primary: '#DDD6FE', secondary: '#7C3AED', accent: '#FBBF24' }, pattern: { type: 'stars', scale: 1, opacity: 0.8 }, visible: true },
      footwear: { style: 'dress_shoes', color: { primary: '#1F2937', secondary: '#FBBF24', accent: '#7C3AED' }, visible: true },
      accessories: { style: 'wings', color: { primary: '#FBBF24', secondary: '#FCD34D', accent: '#FFFFFF' }, visible: true }
    }
  }
];

export default function App() {
  const [items, setItems] = useState<Record<ClothesCategory, ClothingItem>>(DEFAULT_ITEMS_STATE);
  const [body, setBody] = useState<BodyConfig>(INITIAL_BODY_CONFIG);
  const [activeCategory, setActiveCategory] = useState<ClothesCategory>('top');
  const [activeZoom, setActiveZoom] = useState<'full' | 'head' | 'torso' | 'feet'>('full');
  
  // Undo & Redo stack state management
  const [history, setHistory] = useState<{ items: Record<ClothesCategory, ClothingItem>; body: BodyConfig }[]>([]);
  const [redoStack, setRedoStack] = useState<{ items: Record<ClothesCategory, ClothingItem>; body: BodyConfig }[]>([]);
  const lastPushTime = useRef<number>(0);

  const saveToHistory = (prevItems: Record<ClothesCategory, ClothingItem>, prevBody: BodyConfig, force = false) => {
    const now = Date.now();
    setRedoStack([]);
    setHistory((prev) => {
      if (prev.length > 0) {
        const last = prev[prev.length - 1];
        const itemsMatch = JSON.stringify(last.items) === JSON.stringify(prevItems);
        const bodyMatch = JSON.stringify(last.body) === JSON.stringify(prevBody);
        
        if (itemsMatch && bodyMatch) {
          return prev;
        }

        // Keep the starting state of continuous slider dragging (skip saves within 700ms unless forced)
        if (!force && (now - lastPushTime.current < 700)) {
          return prev;
        }
      }

      lastPushTime.current = now;
      const nextHistory = [...prev, { items: JSON.parse(JSON.stringify(prevItems)), body: { ...prevBody } }];
      if (nextHistory.length > 40) {
        nextHistory.shift();
      }
      return nextHistory;
    });
  };

  const handleUndo = () => {
    if (history.length === 0) {
      triggerToast('Nothing to undo.', 'info');
      return;
    }

    setHistory((prevHistory) => {
      const nextHistory = [...prevHistory];
      const previousState = nextHistory.pop();

      if (previousState) {
        // Current state pushed to redo
        setRedoStack((prevRedo) => {
          const nextRedo = [...prevRedo, { items: JSON.parse(JSON.stringify(items)), body: { ...body } }];
          if (nextRedo.length > 40) nextRedo.shift();
          return nextRedo;
        });

        setItems(previousState.items);
        setBody(previousState.body);
        triggerToast('Undo: Reverted last modification!', 'success');
      }

      return nextHistory;
    });
  };

  const handleRedo = () => {
    if (redoStack.length === 0) {
      triggerToast('Nothing to redo.', 'info');
      return;
    }

    setRedoStack((prevRedo) => {
      const nextRedo = [...prevRedo];
      const nextState = nextRedo.pop();

      if (nextState) {
        // Current state pushed back to history
        setHistory((prevHistory) => {
          const nextHistory = [...prevHistory, { items: JSON.parse(JSON.stringify(items)), body: { ...body } }];
          if (nextHistory.length > 40) nextHistory.shift();
          return nextHistory;
        });

        setItems(nextState.items);
        setBody(nextState.body);
        triggerToast('Redo: Reapplied modification!', 'success');
      }

      return nextRedo;
    });
  };
  
  // Local saves
  const [savedOutfits, setSavedOutfits] = useState<CustomOutfit[]>([]);
  const [newOutfitName, setNewOutfitName] = useState('');
  
  // Notification logs
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'info' | 'error'>('success');

  // Load from local storage
  useEffect(() => {
    const local = localStorage.getItem('mannequin_custom_outfits');
    if (local) {
      try {
        setSavedOutfits(JSON.parse(local));
      } catch (err) {
        console.error('Failed to parse local wardrobe database', err);
      }
    }
  }, []);

  // Trigger temporary cute popup
  const triggerToast = (msg: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Modify clothing layers
  const handleUpdateItem = (category: ClothesCategory, updated: Partial<ClothingItem>) => {
    saveToHistory(items, body);
    setItems((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        ...updated
      }
    }));
  };

  // Modify physique bounds
  const handleUpdateBody = (updated: Partial<BodyConfig>) => {
    saveToHistory(items, body);
    setBody((prev) => ({
      ...prev,
      ...updated
    }));
  };

  // Apply absolute presets
  const applyPreset = (preset: PresetOutfit) => {
    saveToHistory(items, body, true);
    const updatedItems = { ...items };
    
    // Apply body details
    if (preset.body) {
      setBody((prev) => ({ ...prev, ...preset.body }));
    }

    // Apply items details safely
    Object.keys(preset.items).forEach((key) => {
      const categoryKey = key as ClothesCategory;
      const presetItem = preset.items[categoryKey];
      if (presetItem) {
        updatedItems[categoryKey] = {
          ...updatedItems[categoryKey],
          ...presetItem as any,
          visible: presetItem.visible ?? true
        };
      }
    });

    setItems(updatedItems);
    triggerToast(`Applied the "${preset.name}" collection!`, 'success');
  };

  // Randomize styling logic
  const handleRandomize = () => {
    saveToHistory(items, body, true);

    // Collect a list of interesting random paint colors
    const colors = [
      '#EF4444', '#F97316', '#F59E0B', '#10B981', '#06B6D4',
      '#3B82F6', '#6366F1', '#EC4899', '#374151', '#FAFAF9',
      '#DDD6FE', '#701A75', '#F59E0B', '#D97706', '#991B1B'
    ];
    const skinTonesList = ['porcelain', 'sand', 'caramel', 'cocoa', 'obsidian', 'emerald', 'violet', 'silver'];
    const patternTypes: ('solid' | 'stripes-h' | 'stripes-v' | 'dots' | 'checkerboard' | 'stars')[] = [
      'solid', 'stripes-h', 'stripes-v', 'dots', 'checkerboard', 'stars'
    ];

    const randomColor = () => colors[Math.floor(Math.random() * colors.length)];
    const randomPattern = () => patternTypes[Math.floor(Math.random() * patternTypes.length)];

    // Randomize Physique
    const randomSkin = skinTonesList[Math.floor(Math.random() * skinTonesList.length)];
    const randomScaleX = parseFloat((0.85 + Math.random() * 0.35).toFixed(2));
    const randomScaleY = parseFloat((0.85 + Math.random() * 0.25).toFixed(2));
    
    const nextBody: BodyConfig = {
      skinTone: randomSkin,
      bodyScaleX: randomScaleX,
      bodyScaleY: randomScaleY,
      genderNeutralPose: 'neutral'
    };

    const nextItems = { ...items };

    // Randomize Hair
    const hairStyles = ['crop', 'waves', 'bob', 'mohawk', 'bun', 'braids', 'none'];
    nextItems.hair = {
      ...nextItems.hair,
      style: hairStyles[Math.floor(Math.random() * hairStyles.length)],
      color: { primary: randomColor(), secondary: randomColor(), accent: randomColor() },
      visible: true
    };

    // Randomize Headwear
    const headwearStyles = ['none', 'cap', 'beanie', 'sunhat', 'crown', 'headband'];
    const hasHeadwear = Math.random() > 0.4;
    const randomHeadwearStyle = headwearStyles[Math.floor(Math.random() * headwearStyles.length)];
    nextItems.headwear = {
      ...nextItems.headwear,
      style: randomHeadwearStyle,
      color: { primary: randomColor(), secondary: randomColor(), accent: randomColor() },
      visible: hasHeadwear && randomHeadwearStyle !== 'none'
    };

    // Randomize Tops
    const topStyles = ['tshirt', 'hoodie', 'sweater', 'croptop', 'tanktop', 'blazer'];
    nextItems.top = {
      ...nextItems.top,
      style: topStyles[Math.floor(Math.random() * topStyles.length)],
      color: { primary: randomColor(), secondary: randomColor(), accent: randomColor() },
      pattern: { type: randomPattern(), scale: 1, opacity: parseFloat((0.3 + Math.random() * 0.5).toFixed(2)) },
      visible: true
    };

    // Randomize Bottoms
    const bottomStyles = ['jeans', 'shorts', 'skirt', 'cargo', 'joggers'];
    nextItems.bottom = {
      ...nextItems.bottom,
      style: bottomStyles[Math.floor(Math.random() * bottomStyles.length)],
      color: { primary: randomColor(), secondary: randomColor(), accent: randomColor() },
      pattern: { type: randomPattern(), scale: 1, opacity: parseFloat((0.2 + Math.random() * 0.5).toFixed(2)) },
      visible: true
    };

    // Randomize Footwear
    const footwearStyles = ['sneakers', 'boots', 'sandals', 'dress_shoes'];
    nextItems.footwear = {
      ...nextItems.footwear,
      style: footwearStyles[Math.floor(Math.random() * footwearStyles.length)],
      color: { primary: randomColor(), secondary: randomColor(), accent: randomColor() },
      visible: true
    };

    // Randomize Accessories
    const accStyles = ['none', 'glasses', 'scarf', 'necklace', 'wings', 'satchel'];
    const hasAcc = Math.random() > 0.5;
    const randomAccStyle = accStyles[Math.floor(Math.random() * accStyles.length)];
    nextItems.accessories = {
      ...nextItems.accessories,
      style: randomAccStyle,
      color: { primary: randomColor(), secondary: randomColor(), accent: randomColor() },
      visible: hasAcc && randomAccStyle !== 'none'
    };

    setBody(nextBody);
    setItems(nextItems);
    triggerToast('Randomized mannequin and wardrobe!', 'info');
  };

  // Reset to default wardrobe
  const handleReset = () => {
    saveToHistory(items, body, true);
    setItems(DEFAULT_ITEMS_STATE);
    setBody(INITIAL_BODY_CONFIG);
    setActiveZoom('full');
    triggerToast('Mannequin reset to defaults.', 'info');
  };

  // Save current look to dynamic Local Database shelf
  const handleSaveOutfit = (e: React.FormEvent) => {
    e.preventDefault();
    const nameStr = newOutfitName.trim();
    if (!nameStr) {
      triggerToast('Please provide an outfit title.', 'error');
      return;
    }

    const creation: CustomOutfit = {
      id: `outfit_${Date.now()}`,
      name: nameStr,
      items,
      body,
      createdAt: new Date().toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    const updated = [creation, ...savedOutfits];
    setSavedOutfits(updated);
    localStorage.setItem('mannequin_custom_outfits', JSON.stringify(updated));
    setNewOutfitName('');
    triggerToast(`"${nameStr}" saved to closet!`, 'success');
  };

  // Delete saved look
  const handleDeleteOutfit = (id: string, name: string) => {
    const filtered = savedOutfits.filter((o) => o.id !== id);
    setSavedOutfits(filtered);
    localStorage.setItem('mannequin_custom_outfits', JSON.stringify(filtered));
    triggerToast(`Deleted "${name}" from closet.`, 'info');
  };

  // Load saved look
  const handleLoadOutfit = (outfit: CustomOutfit) => {
    saveToHistory(items, body, true);
    setItems(outfit.items);
    setBody(outfit.body);
    triggerToast(`Loaded "${outfit.name}" look!`, 'success');
  };

  // Share/Copy payload configuration JSON string to clipboard
  const handleCopyCode = () => {
    const payload = { items, body };
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    triggerToast('Outfit JSON blueprint copied to clipboard!', 'success');
  };

  // Triggering local dynamic download as a beautiful high-resolution PNG!
  const handleDownloadPNG = () => {
    const canvasEl = document.getElementById('mannequin-canvas') as HTMLCanvasElement | null;
    if (!canvasEl) {
      triggerToast('Unable to locate mannequin canvas.', 'error');
      return;
    }

    try {
      // Capture the canvas drawing buffer as a beautiful transparent PNG image
      const dataUrl = canvasEl.toDataURL('image/png');
      
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `custom-attire-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      triggerToast('Downloaded custom outfit image PNG!', 'success');
    } catch (e) {
      console.error('Export failed:', e);
      triggerToast('Failed to export canvas image.', 'error');
    }
  };

  // Import code handler (prompts user with dialog input for their JSON outfit)
  const handleImportJSON = () => {
    const userInput = prompt('Paste a copied customizable outfit JSON string here:');
    if (!userInput) return;

    try {
      const parsed = JSON.parse(userInput);
      if (parsed.items && parsed.body) {
        saveToHistory(items, body, true);
        setItems(parsed.items);
        setBody(parsed.body);
        triggerToast('Successfully imported custom outfit!', 'success');
      } else {
        triggerToast('Invalid JSON structure. Missing items or body config.', 'error');
      }
    } catch (e) {
      triggerToast('Failed to parse input. Ensure you pasted correct JSON.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-4 sm:p-6 lg:p-8 relative">
      {/* Dynamic Animated Toast */}
      {toastMessage && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-xl flex items-center gap-2.5 border transition-all duration-300 animate-bounce ${
          toastType === 'success'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : toastType === 'info'
            ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <div className={`h-2 w-2 rounded-full ${
            toastType === 'success' ? 'bg-emerald-500' : toastType === 'info' ? 'bg-indigo-500' : 'bg-rose-500'
          }`} />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Decorative Blur Orbs */}
      <div className="absolute top-[10%] left-[10%] w-72 h-72 bg-indigo-200/30 rounded-full filter blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[13%] right-[10%] w-80 h-80 bg-pink-200/30 rounded-full filter blur-[110px] pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Upper Header Section */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-indigo-600 text-white p-1 rounded-lg">
                <Shirt className="h-5 w-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 font-mono">
                CLOSET DECO
              </h1>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Vibrant React customizable outfit designer • Tailored layers, custom physical variables and raw vector vector imports.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleImportJSON}
              className="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-200 text-slate-600 rounded-xl shadow-sm hover:bg-slate-50 hover:text-slate-900 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Import className="h-3.5 w-3.5" /> Import
            </button>
            <button
              onClick={handleCopyCode}
              className="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-200 text-slate-600 rounded-xl shadow-sm hover:bg-slate-50 hover:text-slate-900 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Copy className="h-3.5 w-3.5" /> Share JSON
            </button>
            <button
              onClick={handleDownloadPNG}
              className="px-3.5 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-xl shadow-md hover:bg-indigo-700 transition flex items-center gap-1.5 cursor-pointer"
              title="Download mannequin render as PNG"
            >
              <Download className="h-3.5 w-3.5" /> Export PNG Image
            </button>
          </div>
        </header>

        {/* Core Workspace Columns Grid */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-10">
          
          {/* ======================= LEFT PANEL: MANNEQUIN PREVIEW ======================= */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            {/* Action Tools Overlay Header wrapper */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setActiveZoom('full')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg cursor-pointer ${
                    activeZoom === 'full' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Full Look
                </button>
                <button
                  onClick={() => setActiveZoom('head')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg cursor-pointer ${
                    activeZoom === 'head' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Crown
                </button>
                <button
                  onClick={() => setActiveZoom('torso')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg cursor-pointer ${
                    activeZoom === 'torso' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Tops
                </button>
                <button
                  onClick={() => setActiveZoom('feet')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg cursor-pointer ${
                    activeZoom === 'feet' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Shoes
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleUndo}
                  disabled={history.length === 0}
                  className={`p-1.5 rounded-lg transition ${
                    history.length === 0
                      ? 'text-slate-300 cursor-not-allowed opacity-50'
                      : 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer'
                  }`}
                  title="Undo last change"
                >
                  <Undo2 className="h-4.5 w-4.5" />
                </button>
                <button
                  onClick={handleRedo}
                  disabled={redoStack.length === 0}
                  className={`p-1.5 rounded-lg transition ${
                    redoStack.length === 0
                      ? 'text-slate-300 cursor-not-allowed opacity-50'
                      : 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer'
                  }`}
                  title="Redo change"
                >
                  <Redo2 className="h-4.5 w-4.5" />
                </button>

                <div className="h-4 w-px bg-slate-200 mx-0.5" />

                <button
                  onClick={handleRandomize}
                  className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer transition"
                  title="Randomize style combinations"
                >
                  <Sparkles className="h-4.5 w-4.5" />
                </button>
                <button
                  onClick={handleReset}
                  className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition"
                  title="Reset outfit"
                >
                  <RotateCcw className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>

            {/* Core Interactive Mannequin */}
            <MannequinViewer
              items={items}
              body={body}
              activeZoom={activeZoom}
            />

            {/* Quick Helper hint bubble */}
            <div className="bg-slate-100 p-3.5 rounded-2xl border border-slate-200 flex gap-2.5 items-start">
              <div className="text-amber-500 mt-0.5 font-bold">💡</div>
              <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                <strong>Prototyping tips:</strong> Try adjusting the width or height on the <span className="underline decoration-indigo-500 font-semibold cursor-pointer" onClick={() => setActiveCategory('body')}>Mannequin category</span> to dynamically scale the model skeleton coordinates. All clothes shapes and parameters recalculate perfectly to scale!
              </p>
            </div>
          </div>

          {/* ======================= RIGHT PANEL: CORE CONTROLS PANEL ======================= */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <SidebarControls
              activeCategory={activeCategory}
              onSelectCategory={setActiveCategory}
              items={items}
              onUpdateItem={handleUpdateItem}
              body={body}
              onUpdateBody={handleUpdateBody}
            />
          </div>

        </main>

        {/* ======================= BOTTOM PANELS: PRESET CATALOGS AND WALLET ======================= */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-200/80 pt-8 mb-16">
          
          {/* Preset Styles Cards */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
              <span className="p-1 bg-indigo-50 text-indigo-600 rounded-lg">
                <Crown className="h-4 w-4" />
              </span>
              <div>
                <h4 className="text-sm font-semibold tracking-tight text-slate-800">
                  Couture Themes Collection
                </h4>
                <p className="text-[10px] text-slate-400">One-click designer precompiled ensembles.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[290px] overflow-y-auto pr-1">
              {PRESETS_CATALOG.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset)}
                  className="text-left p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-indigo-50/20 active:scale-[0.98] transition cursor-pointer flex flex-col gap-1 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800 group-hover:text-indigo-600 transition">
                      {preset.name}
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded uppercase bg-slate-100 font-medium text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-700">
                      {preset.theme}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {preset.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* closet local save rack */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-50 pb-2">
              <div className="flex items-center gap-2">
                <span className="p-1 bg-indigo-50 text-indigo-600 rounded-lg">
                  <FolderHeart className="h-4 w-4" />
                </span>
                <div>
                  <h4 className="text-sm font-semibold tracking-tight text-slate-800">
                    My Curated Closet
                  </h4>
                  <p className="text-[10px] text-slate-400">Saved creations in your local storage cache.</p>
                </div>
              </div>

              {/* Counter length */}
              <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                {savedOutfits.length} Items
              </span>
            </div>

            {/* Input to save current look */}
            <form onSubmit={handleSaveOutfit} className="flex gap-1.5">
              <input
                type="text"
                placeholder="Give this style look a name..."
                value={newOutfitName}
                onChange={(e) => setNewOutfitName(e.target.value)}
                maxLength={30}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 focus:bg-white text-slate-800"
              />
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-3.5 py-2 rounded-xl shadow-sm transition flex items-center gap-1 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" /> Save
              </button>
            </form>

            {/* List saved outfits */}
            <div className="flex flex-col gap-2 max-h-[195px] overflow-y-auto pr-1">
              {savedOutfits.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed border-slate-100 rounded-xl">
                  <p className="text-xs font-semibold text-slate-400">Your wardrobe rack is empty.</p>
                  <p className="text-[10px] text-slate-400 mt-1">Design an outfit above and type a name to save!</p>
                </div>
              ) : (
                savedOutfits.map((outfit) => (
                  <div
                    key={outfit.id}
                    className="flex justify-between items-center p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition"
                  >
                    <button
                      onClick={() => handleLoadOutfit(outfit)}
                      className="text-left flex-1 font-semibold text-xs text-slate-700 hover:text-indigo-600 transition"
                    >
                      {outfit.name}
                      <span className="block text-[8px] font-medium text-slate-400 uppercase mt-0.5">
                        Saved: {outfit.createdAt}
                      </span>
                    </button>

                    <button
                      onClick={() => handleDeleteOutfit(outfit.id, outfit.name)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                      title="Trash look"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </section>
      </div>
    </div>
  );
}
