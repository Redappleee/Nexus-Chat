'use client';

import { useState } from 'react';
import {
  X,
  Palette,
  Type,
  Image as ImageIcon,
  Check,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import {
  useChatThemeStore,
  BubbleTheme,
  WallpaperPattern,
  FontSize,
  BubbleRadius,
} from '@/store/chat-theme-store';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ChatCustomizerDialogProps {
  open: boolean;
  onClose: () => void;
  chatId: string;
}

const BUBBLE_THEMES: { id: BubbleTheme; label: string; bg: string; ring: string }[] = [
  { id: 'emerald', label: 'Emerald', bg: 'bg-emerald-600', ring: 'ring-emerald-400' },
  { id: 'blue', label: 'Cobalt Blue', bg: 'bg-blue-600', ring: 'ring-blue-400' },
  { id: 'purple', label: 'Indigo Purple', bg: 'bg-indigo-600', ring: 'ring-indigo-400' },
  { id: 'rose', label: 'Crimson Rose', bg: 'bg-rose-600', ring: 'ring-rose-400' },
  { id: 'amber', label: 'Warm Amber', bg: 'bg-amber-600', ring: 'ring-amber-400' },
  { id: 'carbon', label: 'Carbon Slate', bg: 'bg-zinc-700', ring: 'ring-zinc-400' },
];

const WALLPAPER_COLORS = [
  { id: '#090d16', label: 'Obsidian' },
  { id: '#0c101c', label: 'Midnight Navy' },
  { id: '#0d1514', label: 'Deep Forest' },
  { id: '#140e1a', label: 'Plum Night' },
  { id: '#121216', label: 'Charcoal' },
  { id: '#101420', label: 'Slate Dark' },
];

const PATTERNS: { id: WallpaperPattern; label: string }[] = [
  { id: 'none', label: 'Clean Solid' },
  { id: 'dots', label: 'Subtle Dots' },
  { id: 'grid', label: 'Micro Grid' },
  { id: 'lines', label: 'Diagonal Lines' },
];

export function ChatCustomizerDialog({ open, onClose, chatId }: ChatCustomizerDialogProps) {
  const { getChatTheme, setChatTheme, setGlobalTheme, resetChatTheme } = useChatThemeStore();
  const currentTheme = getChatTheme(chatId);

  const [bubbleTheme, setBubbleTheme] = useState<BubbleTheme>(currentTheme.bubbleTheme);
  const [wallpaperBg, setWallpaperBg] = useState<string>(currentTheme.wallpaperBg);
  const [wallpaperPattern, setWallpaperPattern] = useState<WallpaperPattern>(currentTheme.wallpaperPattern);
  const [fontSize, setFontSize] = useState<FontSize>(currentTheme.fontSize);
  const [bubbleRadius, setBubbleRadius] = useState<BubbleRadius>(currentTheme.bubbleRadius);
  const [applyGlobally, setApplyGlobally] = useState(false);

  if (!open) return null;

  const handleSave = () => {
    const updates = {
      bubbleTheme,
      wallpaperBg,
      wallpaperPattern,
      fontSize,
      bubbleRadius,
    };

    if (applyGlobally) {
      setGlobalTheme(updates);
      toast.success('Applied theme to all chats');
    } else {
      setChatTheme(chatId, updates);
      toast.success('Customization saved for this chat');
    }
    onClose();
  };

  const handleReset = () => {
    resetChatTheme(chatId);
    toast.success('Reset to default theme');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl border border-white/[0.1] bg-[#0e1322] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4 bg-[#111728]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-400">
              <Palette className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100">Chat Appearance & Customization</h2>
              <p className="text-[11px] text-zinc-400">Personalize chat bubbles, wallpapers, and layout density</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs">
          {/* Live Preview Box */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
              Live Preview
            </label>
            <div
              className="rounded-xl border border-white/[0.1] p-4 min-h-[130px] flex flex-col justify-end gap-2.5 transition-all overflow-hidden relative"
              style={{
                backgroundColor: wallpaperBg,
                backgroundImage:
                  wallpaperPattern === 'dots'
                    ? 'radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px)'
                    : wallpaperPattern === 'grid'
                    ? 'linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)'
                    : wallpaperPattern === 'lines'
                    ? 'repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.03) 0, rgba(255, 255, 255, 0.03) 1px, transparent 0, transparent 8px)'
                    : 'none',
                backgroundSize:
                  wallpaperPattern === 'dots'
                    ? '14px 14px'
                    : wallpaperPattern === 'grid'
                    ? '20px 20px'
                    : undefined,
              }}
            >
              {/* Received message preview */}
              <div className="flex items-end gap-2 max-w-[80%]">
                <div className="h-6 w-6 rounded-full bg-zinc-700 shrink-0" />
                <div
                  className={`bg-[#141b2c] border border-white/[0.08] text-zinc-200 px-3 py-1.5 shadow-sm ${
                    bubbleRadius === 'rounded'
                      ? 'rounded-2xl rounded-bl-xs'
                      : bubbleRadius === 'modern'
                      ? 'rounded-lg rounded-bl-xs'
                      : 'rounded-sm'
                  } ${
                    fontSize === 'compact'
                      ? 'text-[11px]'
                      : fontSize === 'large'
                      ? 'text-[14px]'
                      : 'text-[12.5px]'
                  }`}
                >
                  Hey! Check out this new chat design.
                </div>
              </div>

              {/* Sent message preview */}
              <div className="flex items-end justify-end gap-2 self-end max-w-[80%]">
                <div
                  className={`text-white px-3 py-1.5 shadow-sm ${
                    bubbleTheme === 'blue'
                      ? 'bg-blue-600'
                      : bubbleTheme === 'purple'
                      ? 'bg-indigo-600'
                      : bubbleTheme === 'rose'
                      ? 'bg-rose-600'
                      : bubbleTheme === 'amber'
                      ? 'bg-amber-600'
                      : bubbleTheme === 'carbon'
                      ? 'bg-zinc-700'
                      : 'bg-emerald-600'
                  } ${
                    bubbleRadius === 'rounded'
                      ? 'rounded-2xl rounded-br-xs'
                      : bubbleRadius === 'modern'
                      ? 'rounded-lg rounded-br-xs'
                      : 'rounded-sm'
                  } ${
                    fontSize === 'compact'
                      ? 'text-[11px]'
                      : fontSize === 'large'
                      ? 'text-[14px]'
                      : 'text-[12.5px]'
                  }`}
                >
                  Looks super clean and personalized! ✨
                </div>
              </div>
            </div>
          </div>

          {/* 1. Message Bubble Accent Color */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
              Sent Message Bubble Color
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {BUBBLE_THEMES.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setBubbleTheme(theme.id)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border p-2.5 transition-all ${
                    bubbleTheme === theme.id
                      ? 'border-white/40 bg-white/[0.08] ring-2 ring-emerald-400'
                      : 'border-white/[0.06] bg-black/20 hover:bg-white/[0.04]'
                  }`}
                >
                  <span className={`h-6 w-6 rounded-full ${theme.bg} shadow-inner flex items-center justify-center`}>
                    {bubbleTheme === theme.id && <Check className="h-3 w-3 text-white stroke-[3]" />}
                  </span>
                  <span className="text-[10px] font-medium text-zinc-300 truncate">{theme.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Wallpaper Background Color */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
              Chat Background Color
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {WALLPAPER_COLORS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setWallpaperBg(item.id)}
                  className={`flex items-center gap-2 rounded-xl border p-2 transition-all ${
                    wallpaperBg === item.id
                      ? 'border-emerald-400/80 bg-emerald-950/20 text-emerald-300'
                      : 'border-white/[0.06] bg-black/20 text-zinc-400 hover:bg-white/[0.04]'
                  }`}
                >
                  <span className="h-3.5 w-3.5 rounded-full border border-white/20 shrink-0" style={{ backgroundColor: item.id }} />
                  <span className="text-[10px] font-medium truncate">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Wallpaper Pattern */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
              Background Pattern Texture
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PATTERNS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setWallpaperPattern(p.id)}
                  className={`rounded-xl py-2 px-3 text-center border font-medium transition-all ${
                    wallpaperPattern === p.id
                      ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300'
                      : 'border-white/[0.06] bg-black/20 text-zinc-400 hover:bg-white/[0.04]'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Font Size & Density */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                Message Text Size
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['compact', 'regular', 'large'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setFontSize(s)}
                    className={`rounded-lg py-1.5 text-center capitalize border font-medium transition-all ${
                      fontSize === s
                        ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300'
                        : 'border-white/[0.06] bg-black/20 text-zinc-400 hover:bg-white/[0.04]'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Bubble Corner Radius */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                Bubble Shape
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['rounded', 'modern', 'sharp'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setBubbleRadius(r)}
                    className={`rounded-lg py-1.5 text-center capitalize border font-medium transition-all ${
                      bubbleRadius === r
                        ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300'
                        : 'border-white/[0.06] bg-black/20 text-zinc-400 hover:bg-white/[0.04]'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Apply to all chats checkbox */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="applyGlobally"
              checked={applyGlobally}
              onChange={(e) => setApplyGlobally(e.target.checked)}
              className="h-4 w-4 rounded bg-zinc-800 border-white/20 text-emerald-600 focus:ring-0 cursor-pointer"
            />
            <label htmlFor="applyGlobally" className="text-zinc-300 font-medium cursor-pointer">
              Apply these appearance settings as default for all chats
            </label>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-white/[0.08] px-5 py-3.5 bg-[#111728]">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-zinc-400 hover:text-rose-400 text-xs gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset Default
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-4">
              Apply Customization
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
