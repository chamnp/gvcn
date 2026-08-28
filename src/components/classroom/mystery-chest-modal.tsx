'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Sparkles,
  Award,
  RotateCcw,
  Volume2,
  VolumeX,
  CheckCircle2,
  Shuffle,
  Settings,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Edit3,
  HelpCircle,
  Download,
  Upload,
  Layers,
  ArrowRight,
  Check,
} from 'lucide-react';
import { Student, MysteryChestItem, MysteryChestPack, MysteryChestContentType } from '@/types';
import { useAppStore } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';
import { getLocalDateString } from '@/lib/tt27-engine';
import {
  DEFAULT_CHEST_PACKS,
  CHEST_GRADIENT_COLORS,
  getItemsForChestCount,
  shuffleChestItems,
} from '@/lib/mystery-chest-bank';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

interface MysteryChestModalProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  students: Student[];
}

const PRESET_COUNTS = [3, 4, 6, 8, 9, 10, 12];

export function MysteryChestModal({
  isOpen,
  onClose,
  className = '4A1',
  students,
}: MysteryChestModalProps) {
  const { addStarLog } = useAppStore();
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);

  // Storage key based on teacher's email for profile isolation
  const teacherEmail = user?.email?.toLowerCase().trim() || 'default';
  const STORAGE_KEY_CUSTOM_PACKS = `gvcn_chest_custom_packs_${teacherEmail}`;
  const STORAGE_KEY_SETTINGS = `gvcn_chest_settings_${teacherEmail}`;

  // Game Settings State
  const [boxCount, setBoxCount] = useState<number>(6);
  const [selectedPackId, setSelectedPackId] = useState<string>(DEFAULT_CHEST_PACKS[0].id);
  const [customPacks, setCustomPacks] = useState<MysteryChestPack[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Active items currently on the board
  const [chestItems, setChestItems] = useState<MysteryChestItem[]>([]);
  const [openedBoxIndices, setOpenedBoxIndices] = useState<number[]>([]);
  const [activeRevealedIndex, setActiveRevealedIndex] = useState<number | null>(null);

  // Interactive & Animation State
  const [isShuffling, setIsShuffling] = useState(false);
  const [shuffleKey, setShuffleKey] = useState(0);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [isSavedToLog, setIsSavedToLog] = useState(false);

  // Drawer / Custom Editor State
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [configTab, setConfigTab] = useState<'PRESET' | 'EDITOR' | 'BACKUP'>('PRESET');
  const [editingItem, setEditingItem] = useState<MysteryChestItem | null>(null);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);

  // All available packs (Default + Custom)
  const allPacks = useMemo(
    () => [...DEFAULT_CHEST_PACKS, ...customPacks],
    [customPacks]
  );

  const activePack = useMemo(
    () => allPacks.find((p) => p.id === selectedPackId) || DEFAULT_CHEST_PACKS[0],
    [allPacks, selectedPackId]
  );

  // Load custom packs and saved settings from localStorage
  useEffect(() => {
    try {
      const savedPacks = localStorage.getItem(STORAGE_KEY_CUSTOM_PACKS);
      if (savedPacks) {
        setCustomPacks(JSON.parse(savedPacks));
      }
      const savedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed.boxCount) setBoxCount(parsed.boxCount);
        if (parsed.selectedPackId) setSelectedPackId(parsed.selectedPackId);
        if (parsed.soundEnabled !== undefined) setSoundEnabled(parsed.soundEnabled);
      }
    } catch (e) {
      console.warn('Failed to load mystery chest settings from localStorage', e);
    }
  }, [STORAGE_KEY_CUSTOM_PACKS, STORAGE_KEY_SETTINGS]);

  // Persist settings changes
  const saveSettings = (newCount: number, newPackId: string, newSound: boolean) => {
    try {
      localStorage.setItem(
        STORAGE_KEY_SETTINGS,
        JSON.stringify({
          boxCount: newCount,
          selectedPackId: newPackId,
          soundEnabled: newSound,
        })
      );
    } catch (e) {}
  };

  // Re-generate board items when pack or count changes
  useEffect(() => {
    if (activePack) {
      const items = getItemsForChestCount(activePack, boxCount);
      setChestItems(items);
      setOpenedBoxIndices([]);
      setActiveRevealedIndex(null);
      setIsSavedToLog(false);
      setIsAnswerRevealed(false);
    }
  }, [activePack, boxCount]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Web Audio Synthesis Effects
  const playShuffleSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = audioCtx.currentTime;
      const ticks = 14;
      for (let i = 0; i < ticks; i++) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        const time = now + i * 0.1;
        const freq = 400 + Math.sin(i / 2) * 350 + Math.random() * 100;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0.07, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(time);
        osc.stop(time + 0.07);
      }
    } catch (e) {}
  };

  const playFanfare = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const notes = [392.0, 523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        const start = audioCtx.currentTime + idx * 0.09;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.18, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.45);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(start);
        osc.stop(start + 0.5);
      });
    } catch (e) {}
  };

  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch (e) {}
  };

  // Keyboard Shortcuts (1-9: Open box, Space/S: Shuffle, R: Reset, F: Fullscreen)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === ' ' || e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleShuffle();
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        handleResetBoard();
      } else if (/^[1-9]$/.test(e.key)) {
        const boxIdx = parseInt(e.key, 10) - 1;
        if (boxIdx < chestItems.length && !openedBoxIndices.includes(boxIdx) && !isShuffling) {
          e.preventDefault();
          handleOpenChest(boxIdx);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, chestItems, openedBoxIndices, isShuffling]);

  // Handle Box Opening
  const handleOpenChest = (chestIdx: number) => {
    if (openedBoxIndices.includes(chestIdx) || isShuffling) return;

    setOpenedBoxIndices((prev) => [...prev, chestIdx]);
    setActiveRevealedIndex(chestIdx);
    setIsSavedToLog(false);
    setIsAnswerRevealed(false);

    playFanfare();
    confetti({
      particleCount: 90,
      spread: 75,
      origin: { y: 0.6 },
    });
  };

  // Handle Shuffle: ONLY shuffle the UNOPENED boxes, keeping already opened ones in place!
  const handleShuffle = () => {
    if (isShuffling) return;

    // Find unopened box indices
    const unopenedIndices = chestItems
      .map((_, idx) => idx)
      .filter((idx) => !openedBoxIndices.includes(idx));

    if (unopenedIndices.length <= 1) {
      if (unopenedIndices.length === 0) {
        toast.info('Tất cả hộp quà đã mở hết! Bấm "Đặt lại" để chơi ván mới.');
      } else {
        toast.info('Chỉ còn 1 hộp quà chưa mở, không cần xáo trộn!');
      }
      return;
    }

    // Close any active revealed popup overlay so screen is clean
    setActiveRevealedIndex(null);
    setIsAnswerRevealed(false);

    setIsShuffling(true);
    setShuffleKey((prev) => prev + 1);
    playShuffleSound();

    // After animation duration, swap ONLY the unopened items among unopened positions
    setTimeout(() => {
      setChestItems((prev) => {
        const next = [...prev];
        const unopenedItems = unopenedIndices.map((idx) => next[idx]);
        const shuffledUnopened = shuffleChestItems(unopenedItems);
        unopenedIndices.forEach((origIdx, i) => {
          next[origIdx] = shuffledUnopened[i];
        });
        return next;
      });
      setIsShuffling(false);
      toast.success(`🎲 Đã xáo trộn ${unopenedIndices.length} hộp quà chưa mở! Mời các em chọn tiếp!`);
    }, 1500);
  };

  // Reset entire round (keep configuration)
  const handleResetBoard = () => {
    setOpenedBoxIndices([]);
    setActiveRevealedIndex(null);
    setIsSavedToLog(false);
    setIsAnswerRevealed(false);
    toast.info('Đã làm mới lại các hộp quà!');
  };

  // Save Star Points to Student Log
  const handleSaveToStarLog = () => {
    if (!selectedStudentId || activeRevealedIndex === null) {
      toast.error('Vui lòng chọn học sinh nhận thưởng!');
      return;
    }

    const currentItem = chestItems[activeRevealedIndex];
    if (!currentItem) return;

    const st = students.find((s) => s.id === selectedStudentId);
    if (!st) return;

    const points = currentItem.starPoints || 1;
    const category = currentItem.type === 'REWARD' ? 'Khen thưởng' : 'Học tập';
    const reason = `Mở Hộp Quà Bí Mật: ${currentItem.title}`;
    const today = getLocalDateString();

    addStarLog(st.id, points, category, reason, currentItem.desc, today);

    setIsSavedToLog(true);
    playChime();
    confetti({ particleCount: 70, spread: 65, origin: { y: 0.65 } });
    toast.success(`Đã cộng +${points} ⭐ vào Sổ nề nếp cho em ${st.fullName}!`);
  };

  // Custom Pack Management Helpers
  const handleCreateCustomPack = () => {
    const newPack: MysteryChestPack = {
      id: `custom_${Date.now()}`,
      title: 'Bộ Hộp Quà Tự Tạo Mới',
      description: 'Bộ hộp quà do giáo viên tự thiết kế riêng cho tiết học hôm nay.',
      category: 'MIXED',
      icon: '✨',
      isCustom: true,
      items: [
        {
          id: `item_1`,
          type: 'REWARD',
          title: '+2 Sao Thi Đua Tích Cực',
          badge: '⭐',
          starPoints: 2,
          desc: 'Thưởng nóng 2 sao vào sổ thi đua nề nếp.',
          color: CHEST_GRADIENT_COLORS[0],
        },
        {
          id: `item_2`,
          type: 'QUESTION',
          title: 'Câu Hỏi Ôn Bài Toán / Tiếng Việt',
          badge: '🧠',
          starPoints: 2,
          desc: 'Em hãy nêu cách giải bài toán hôm nay?',
          answer: 'Đáp án chi tiết giáo viên hướng dẫn.',
          color: CHEST_GRADIENT_COLORS[1],
        },
        {
          id: `item_3`,
          type: 'CHALLENGE',
          title: 'Thử Thách Khởi Động Vui Nhộn',
          badge: '🎤',
          starPoints: 2,
          desc: 'Hát 1 câu hát hoặc bắt chước 1 con vật ngộ nghĩnh.',
          answer: 'Hoàn thành thử thách xuất sắc!',
          color: CHEST_GRADIENT_COLORS[2],
        },
        {
          id: `item_4`,
          type: 'REWARD',
          title: 'Phiếu Miễn Trực Nhật 1 Buổi',
          badge: '🎟️',
          starPoints: 1,
          desc: 'Được miễn nhiệm vụ trực nhật hôm nay.',
          color: CHEST_GRADIENT_COLORS[3],
        },
      ],
    };

    const updated = [...customPacks, newPack];
    setCustomPacks(updated);
    setSelectedPackId(newPack.id);
    localStorage.setItem(STORAGE_KEY_CUSTOM_PACKS, JSON.stringify(updated));
    toast.success('Đã tạo bộ hộp quà mới! Cô có thể chỉnh sửa nội dung bên dưới.');
    setConfigTab('EDITOR');
  };

  const handleUpdateActivePackInfo = (field: keyof MysteryChestPack, val: any) => {
    if (!activePack.isCustom) return;
    const updated = customPacks.map((p) => (p.id === activePack.id ? { ...p, [field]: val } : p));
    setCustomPacks(updated);
    localStorage.setItem(STORAGE_KEY_CUSTOM_PACKS, JSON.stringify(updated));
  };

  const handleSaveItemEdit = (item: MysteryChestItem) => {
    if (editingItemIndex === null) return;
    if (!activePack.isCustom) {
      toast.error('Đây là bộ mẫu mặc định. Vui lòng bấm "Tạo bộ quà mới" để chỉnh sửa riêng.');
      return;
    }

    const updatedItems = [...activePack.items];
    updatedItems[editingItemIndex] = item;

    const updatedPacks = customPacks.map((p) =>
      p.id === activePack.id ? { ...p, items: updatedItems } : p
    );
    setCustomPacks(updatedPacks);
    localStorage.setItem(STORAGE_KEY_CUSTOM_PACKS, JSON.stringify(updatedPacks));

    // Also update board
    setChestItems(getItemsForChestCount({ ...activePack, items: updatedItems }, boxCount));
    setEditingItem(null);
    setEditingItemIndex(null);
    toast.success('Đã lưu chỉnh sửa hộp quà!');
  };

  const handleAddNewItemToActivePack = (newItem: MysteryChestItem) => {
    if (!activePack.isCustom) {
      toast.error('Vui lòng chọn bộ tự tạo để thêm hộp quà.');
      return;
    }
    const updatedItems = [...activePack.items, newItem];
    const updatedPacks = customPacks.map((p) =>
      p.id === activePack.id ? { ...p, items: updatedItems } : p
    );
    setCustomPacks(updatedPacks);
    localStorage.setItem(STORAGE_KEY_CUSTOM_PACKS, JSON.stringify(updatedPacks));
    setChestItems(getItemsForChestCount({ ...activePack, items: updatedItems }, boxCount));
    setIsNewItemModalOpen(false);
    toast.success('Đã thêm hộp quà mới vào bộ!');
  };

  const handleDeleteItemFromActivePack = (index: number) => {
    if (!activePack.isCustom) return;
    if (activePack.items.length <= 2) {
      toast.error('Bộ hộp quà cần có ít nhất 2 món!');
      return;
    }
    const updatedItems = activePack.items.filter((_, idx) => idx !== index);
    const updatedPacks = customPacks.map((p) =>
      p.id === activePack.id ? { ...p, items: updatedItems } : p
    );
    setCustomPacks(updatedPacks);
    localStorage.setItem(STORAGE_KEY_CUSTOM_PACKS, JSON.stringify(updatedPacks));
    setChestItems(getItemsForChestCount({ ...activePack, items: updatedItems }, boxCount));
    toast.info('Đã xoá hộp quà khỏi bộ.');
  };

  // Export / Import Custom Packs
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(allPacks, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `gvcn_hop_qua_bi_mat_${className}_${getLocalDateString()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success('Đã xuất file cấu hình hộp quà thành công!');
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          const importedCustom = parsed.filter((p: any) => p.isCustom);
          const combined = [...customPacks, ...importedCustom];
          setCustomPacks(combined);
          localStorage.setItem(STORAGE_KEY_CUSTOM_PACKS, JSON.stringify(combined));
          toast.success(`Đã nạp thành công ${importedCustom.length} bộ hộp quà tuỳ chỉnh!`);
        } else {
          toast.error('File không đúng định dạng mẫu hộp quà!');
        }
      } catch (err) {
        toast.error('Lỗi khi đọc file JSON.');
      }
    };
    reader.readAsText(file);
  };

  if (!isOpen) return null;

  const currentRevealedItem =
    activeRevealedIndex !== null ? chestItems[activeRevealedIndex] : null;

  // Compute CSS Grid column layout based on box count
  const getGridColsClass = () => {
    if (boxCount <= 3) return 'grid-cols-1 sm:grid-cols-3';
    if (boxCount === 4) return 'grid-cols-2 sm:grid-cols-4';
    if (boxCount === 6) return 'grid-cols-2 sm:grid-cols-3';
    if (boxCount === 8) return 'grid-cols-2 sm:grid-cols-4';
    if (boxCount === 9) return 'grid-cols-3 sm:grid-cols-3';
    return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/95 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div
        ref={containerRef}
        className={`bg-slate-900 text-white w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col transition-all duration-300 ${
          isFullscreen ? 'fixed inset-0 rounded-none max-h-screen max-w-none' : 'max-w-5xl max-h-[95vh]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Navigation Bar */}
        <div className="p-3.5 sm:p-4 border-b border-slate-800 bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 flex items-center justify-between shrink-0 shadow-lg select-none">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner animate-pulse">
              🎁
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm sm:text-base tracking-tight text-white flex items-center gap-1.5">
                  Hộp Quà Bí Mật — Khen Thưởng & Đố Vui
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-white/25 text-white font-bold text-[10px] uppercase tracking-wider backdrop-blur-sm">
                  Lớp {className}
                </span>
              </div>
              <p className="text-[11px] text-amber-100 hidden sm:block">
                {activePack.title} • {boxCount} Hộp Quà • Đã mở: {openedBoxIndices.length}/{boxCount}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 sm:space-x-2">
            {/* Shuffle Button */}
            <button
              type="button"
              disabled={isShuffling}
              onClick={handleShuffle}
              className={`px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer ${
                isShuffling
                  ? 'bg-amber-300 text-slate-950 animate-pulse'
                  : 'bg-white/20 hover:bg-white/30 text-white active:scale-95'
              }`}
              title="Xáo trộn các hộp quà chưa mở (Phím S / Space)"
            >
              <Shuffle className={`w-3.5 h-3.5 ${isShuffling ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Xáo Trộn Hộp</span>
            </button>

            {/* Quick Settings Drawer Button */}
            <button
              type="button"
              onClick={() => setIsConfigOpen(!isConfigOpen)}
              className={`p-2 rounded-xl text-white transition-colors cursor-pointer ${
                isConfigOpen ? 'bg-white text-slate-950 font-bold shadow-md' : 'bg-white/15 hover:bg-white/25'
              }`}
              title="Tuỳ chỉnh số lượng & nội dung hộp quà"
            >
              <Settings className={`w-4 h-4 ${isConfigOpen ? 'text-amber-600' : ''}`} />
            </button>

            {/* Sound Toggle */}
            <button
              type="button"
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                saveSettings(boxCount, selectedPackId, next);
              }}
              className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
              title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Reset Board */}
            <button
              type="button"
              onClick={handleResetBoard}
              className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
              title="Đặt lại các hộp quà (Phím R)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer hidden sm:flex"
              title="Toàn màn hình chiếu TV (Phím F)"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Toolbar for Teachers (Preset selector + Box count chips) */}
        {!isConfigOpen && (
          <div className="px-4 py-2 bg-slate-850 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0 select-none">
            {/* Pack Selector */}
            <div className="flex items-center space-x-2">
              <span className="text-slate-400 font-bold hidden sm:inline">Bộ chủ đề:</span>
              <select
                value={selectedPackId}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedPackId(id);
                  saveSettings(boxCount, id, soundEnabled);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-amber-300 font-bold text-xs focus:ring-1 focus:ring-amber-400 cursor-pointer"
              >
                {allPacks.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.icon} {p.title} {p.isCustom ? '(Tự tạo)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Box Count Selector */}
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-400 font-bold hidden sm:inline">Số lượng hộp:</span>
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-700/80">
                {PRESET_COUNTS.map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => {
                      setBoxCount(cnt);
                      saveSettings(cnt, selectedPackId, soundEnabled);
                    }}
                    className={`px-2 py-0.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      boxCount === cnt
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {cnt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 text-xs flex flex-col justify-between">
          {/* Settings & Editor Drawer (if opened) */}
          {isConfigOpen ? (
            <div className="bg-slate-850 rounded-2xl border border-slate-700 p-4 sm:p-5 space-y-5 animate-in fade-in slide-in-from-top-4">
              {/* Drawer Tabs */}
              <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setConfigTab('PRESET')}
                    className={`px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                      configTab === 'PRESET'
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Chọn Bộ & Số Lượng</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfigTab('EDITOR')}
                    className={`px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                      configTab === 'EDITOR'
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Chỉnh Sửa Nội Dung ({activePack.items.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfigTab('BACKUP')}
                    className={`px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                      configTab === 'BACKUP'
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Sao Lưu / Xuất Nhập</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsConfigOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* TAB 1: PRESET & BOX COUNT */}
              {configTab === 'PRESET' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="font-black text-slate-300 uppercase tracking-wider text-[11px] block">
                      1. Chọn Số Lượng Hộp Quà Trình Chiếu:
                    </label>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                      {PRESET_COUNTS.map((cnt) => (
                        <button
                          key={cnt}
                          type="button"
                          onClick={() => {
                            setBoxCount(cnt);
                            saveSettings(cnt, selectedPackId, soundEnabled);
                          }}
                          className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                            boxCount === cnt
                              ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-lg shadow-amber-500/20 scale-105'
                              : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                          }`}
                        >
                          <div className="text-lg font-black">{cnt}</div>
                          <div className="text-[10px] font-bold opacity-80">Hộp Quà</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between">
                      <label className="font-black text-slate-300 uppercase tracking-wider text-[11px]">
                        2. Chọn Bộ Chủ Đề Hộp Quà:
                      </label>
                      <button
                        type="button"
                        onClick={handleCreateCustomPack}
                        className="px-3 py-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-xs flex items-center gap-1 shadow-md hover:brightness-110 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tạo Bộ Quà Riêng</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {allPacks.map((pack) => {
                        const isSelected = selectedPackId === pack.id;
                        return (
                          <div
                            key={pack.id}
                            onClick={() => {
                              setSelectedPackId(pack.id);
                              saveSettings(boxCount, pack.id, soundEnabled);
                            }}
                            className={`p-3.5 rounded-2xl border flex items-start space-x-3 cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-amber-500/15 border-amber-400 shadow-md shadow-amber-500/10'
                                : 'bg-slate-800/80 border-slate-700 hover:border-slate-600'
                            }`}
                          >
                            <div className="w-10 h-10 rounded-xl bg-slate-900/80 border border-slate-700 flex items-center justify-center text-2xl shrink-0">
                              {pack.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className={`font-black text-xs truncate ${isSelected ? 'text-amber-300' : 'text-white'}`}>
                                  {pack.title}
                                </h4>
                                {pack.isCustom && (
                                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold">
                                    Tự tạo
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                                {pack.description}
                              </p>
                              <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 font-bold">
                                <span>{pack.items.length} món quà/câu hỏi</span>
                                {isSelected && <span className="text-amber-400 flex items-center gap-1 font-black"><Check className="w-3 h-3" /> Đang dùng</span>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: EDIT ACTIVE PACK ITEMS */}
              {configTab === 'EDITOR' && (
                <div className="space-y-4">
                  {/* Pack Title & Description Editor if Custom */}
                  {activePack.isCustom ? (
                    <div className="p-3 bg-slate-800 rounded-xl space-y-2 border border-slate-700">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={activePack.icon}
                          onChange={(e) => handleUpdateActivePackInfo('icon', e.target.value)}
                          className="w-10 text-center py-1 bg-slate-900 border border-slate-700 rounded-lg text-lg"
                          title="Biểu tượng bộ"
                        />
                        <input
                          type="text"
                          value={activePack.title}
                          onChange={(e) => handleUpdateActivePackInfo('title', e.target.value)}
                          className="flex-1 px-3 py-1 bg-slate-900 border border-slate-700 rounded-lg font-bold text-white text-xs"
                          placeholder="Tên bộ hộp quà..."
                        />
                      </div>
                      <input
                        type="text"
                        value={activePack.description}
                        onChange={(e) => handleUpdateActivePackInfo('description', e.target.value)}
                        className="w-full px-3 py-1 bg-slate-900 border border-slate-700 rounded-lg text-slate-300 text-xs"
                        placeholder="Mô tả bộ hộp quà..."
                      />
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between text-amber-200 text-xs">
                      <span>Đây là bộ mẫu mặc định hệ thống. Để chỉnh sửa tự do, hãy bấm:</span>
                      <button
                        type="button"
                        onClick={handleCreateCustomPack}
                        className="px-3 py-1 rounded-lg bg-amber-500 text-slate-950 font-black text-xs hover:bg-amber-400 cursor-pointer"
                      >
                        Tạo Bản Sao Tự Chỉnh
                      </button>
                    </div>
                  )}

                  {/* Item List Header */}
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-300 uppercase tracking-wider text-[11px]">
                      Danh Sách Các Món Trong Bộ ({activePack.items.length}):
                    </span>
                    {activePack.isCustom && (
                      <button
                        type="button"
                        onClick={() => setIsNewItemModalOpen(true)}
                        className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Thêm Món Quà / Câu Hỏi</span>
                      </button>
                    )}
                  </div>

                  {/* Item Cards List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
                    {activePack.items.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="p-3 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-between space-x-3 group"
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-xl shrink-0">
                            {item.badge}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
                                  item.type === 'REWARD'
                                    ? 'bg-amber-500/20 text-amber-300'
                                    : item.type === 'QUESTION'
                                    ? 'bg-blue-500/20 text-blue-300'
                                    : 'bg-rose-500/20 text-rose-300'
                                }`}
                              >
                                {item.type === 'REWARD'
                                  ? 'Phần thưởng'
                                  : item.type === 'QUESTION'
                                  ? 'Đố vui'
                                  : 'Thử thách'}
                              </span>
                              <span className="text-[10px] text-amber-400 font-bold">
                                +{item.starPoints || 1} ⭐
                              </span>
                            </div>
                            <h5 className="font-bold text-white text-xs truncate mt-0.5">
                              {item.title}
                            </h5>
                            <p className="text-[11px] text-slate-400 truncate">
                              {item.desc}
                            </p>
                          </div>
                        </div>

                        {activePack.isCustom && (
                          <div className="flex items-center space-x-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingItem(item);
                                setEditingItemIndex(idx);
                              }}
                              className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors cursor-pointer"
                              title="Sửa hộp này"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteItemFromActivePack(idx)}
                              className="p-1.5 rounded-lg bg-slate-700 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
                              title="Xoá hộp này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: BACKUP & SHARING */}
              {configTab === 'BACKUP' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700 space-y-3">
                      <div className="flex items-center space-x-2 text-amber-300 font-black text-xs">
                        <Download className="w-4 h-4" />
                        <span>Xuất File Cấu Hình (Export)</span>
                      </div>
                      <p className="text-slate-400 text-[11px]">
                        Tải toàn bộ bộ câu hỏi & phần thưởng về máy tính để sao lưu hoặc gửi cho giáo viên cùng khối.
                      </p>
                      <button
                        type="button"
                        onClick={handleExportJson}
                        className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Tải Xuống File JSON</span>
                      </button>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700 space-y-3">
                      <div className="flex items-center space-x-2 text-emerald-300 font-black text-xs">
                        <Upload className="w-4 h-4" />
                        <span>Nhập File Cấu Hình (Import)</span>
                      </div>
                      <p className="text-slate-400 text-[11px]">
                        Nạp các bộ hộp quà bí mật từ đồng nghiệp hoặc file đã sao lưu trước đó.
                      </p>
                      <label className="w-full py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer border border-slate-600">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Chọn File JSON Để Nạp</span>
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleImportJson}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {/* Winner / Question Revealed Celebration Overlay */}
          {currentRevealedItem && (
            <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-slate-950 space-y-4 shadow-2xl animate-in zoom-in-95 border-2 border-amber-300 shrink-0">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/30 backdrop-blur-md flex items-center justify-center text-4xl sm:text-5xl shadow-inner shrink-0 animate-bounce">
                    {currentRevealedItem.badge}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-slate-950 text-amber-300 font-black text-[10px] uppercase tracking-wider">
                        {currentRevealedItem.type === 'REWARD'
                          ? '🎉 PHẦN THƯỞNG BÍ MẬT ĐƯỢC MỞ'
                          : currentRevealedItem.type === 'QUESTION'
                          ? '🧠 CÂU HỎI ĐỐ VUI TIỂU HỌC'
                          : '🎯 THỬ THÁCH VẬN ĐỘNG'}
                      </span>
                      <span className="font-bold text-slate-900 text-xs">
                        Hộp quà số #{activeRevealedIndex !== null ? activeRevealedIndex + 1 : 1}
                      </span>
                    </div>

                    <h2 className="text-xl sm:text-3xl font-black leading-tight text-slate-950 mt-1">
                      {currentRevealedItem.title}
                    </h2>
                    <p className="text-xs sm:text-sm font-bold text-slate-900 mt-1 max-w-2xl">
                      {currentRevealedItem.desc}
                    </p>
                  </div>
                </div>

                <div className="text-center sm:text-right shrink-0 bg-white/30 px-4 py-2 rounded-2xl backdrop-blur-sm">
                  <div className="text-3xl font-black text-slate-950 flex items-center justify-center sm:justify-end">
                    +{currentRevealedItem.starPoints || 1}
                    <span className="text-base ml-1">⭐</span>
                  </div>
                  <span className="text-[10px] font-black uppercase text-slate-900">
                    Điểm sao thi đua
                  </span>
                </div>
              </div>

              {/* Reveal Answer Accordion if Question / Challenge */}
              {(currentRevealedItem.type === 'QUESTION' || currentRevealedItem.type === 'CHALLENGE') &&
                currentRevealedItem.answer && (
                  <div className="bg-slate-950/15 p-3 rounded-2xl space-y-1.5 border border-slate-950/20">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-950 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>Đáp Án & Hướng Dẫn:</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAnswerRevealed(!isAnswerRevealed);
                          if (!isAnswerRevealed) playChime();
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-950 text-amber-300 font-bold text-xs flex items-center gap-1 hover:bg-slate-900 cursor-pointer"
                      >
                        {isAnswerRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{isAnswerRevealed ? 'Ẩn đáp án' : 'Hiện đáp án'}</span>
                      </button>
                    </div>

                    {isAnswerRevealed && (
                      <p className="text-xs font-bold text-slate-950 bg-white/80 p-2.5 rounded-xl border border-slate-950/20 animate-in fade-in">
                        💡 {currentRevealedItem.answer}
                      </p>
                    )}
                  </div>
                )}

              {/* Student Assignment & Log Sync Toolbar */}
              <div className="pt-3 border-t border-slate-950/20 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <span className="font-bold text-slate-950 shrink-0 text-xs">
                    Trao thưởng / Ghi nhận:
                  </span>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-950/30 bg-white/95 font-black text-slate-950 text-xs focus:ring-2 focus:ring-slate-950 w-full sm:w-64 cursor-pointer"
                  >
                    <option value="">-- Chọn học sinh tuyên dương --</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.studentCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    disabled={isSavedToLog || !selectedStudentId}
                    onClick={handleSaveToStarLog}
                    className={`px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md transition-all cursor-pointer ${
                      isSavedToLog
                        ? 'bg-emerald-700 text-white cursor-default'
                        : 'bg-slate-950 text-amber-300 hover:bg-slate-900 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                  >
                    {isSavedToLog ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Đã lưu vào Sổ nề nếp!</span>
                      </>
                    ) : (
                      <>
                        <Award className="w-4 h-4" />
                        <span>+⭐ Lưu Sổ Nề Nếp</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveRevealedIndex(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-white/40 hover:bg-white/60 text-slate-950 font-black text-xs transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>Tiếp tục mở hộp khác</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Chests Grid */}
          <div className="space-y-3 flex-1 flex flex-col justify-center py-2">
            <div className="flex items-center justify-between text-slate-400 font-bold text-xs px-1">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {isShuffling
                    ? '🌀 Đang xáo trộn các hộp quà chưa mở...'
                    : '👉 Nhấp chuột vào hộp quà hoặc bấm phím số để lật mở:'}
                </span>
              </span>
              <span>
                Đã mở: <strong className="text-amber-400">{openedBoxIndices.length}</strong> / {boxCount}
              </span>
            </div>

            {/* Dynamic CSS Grid */}
            <div className={`grid ${getGridColsClass()} gap-3 sm:gap-4 select-none`}>
              {chestItems.map((item, idx) => {
                const isOpened = openedBoxIndices.includes(idx);
                const isCurrentlyActive = activeRevealedIndex === idx;
                const isUnopenedAndShuffling = isShuffling && !isOpened;

                return (
                  <button
                    key={`${idx}_${shuffleKey}`}
                    type="button"
                    disabled={isShuffling}
                    onClick={() => {
                      if (isOpened) {
                        setActiveRevealedIndex(idx);
                      } else {
                        handleOpenChest(idx);
                      }
                    }}
                    className={`group p-4 sm:p-5 rounded-3xl border-2 flex flex-col items-center justify-center space-y-2.5 transition-all transform cursor-pointer relative overflow-hidden ${
                      isCurrentlyActive
                        ? 'bg-amber-500/25 border-amber-400 scale-105 shadow-xl shadow-amber-500/30 ring-2 ring-amber-400'
                        : isOpened
                        ? 'bg-slate-800/60 border-slate-700 opacity-80 hover:opacity-100 hover:border-amber-400/80'
                        : isUnopenedAndShuffling
                        ? 'bg-amber-500/15 border-amber-400/60 animate-bounce scale-95 duration-300 shadow-lg shadow-amber-500/20'
                        : 'bg-gradient-to-b from-slate-800 to-slate-850 border-slate-700 hover:border-amber-400 hover:scale-105 shadow-lg active:scale-95 hover:shadow-amber-500/10'
                    }`}
                  >
                    {/* 3D Gift Box Visual Container */}
                    <div
                      className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr ${
                        isOpened
                          ? item.color || CHEST_GRADIENT_COLORS[idx % CHEST_GRADIENT_COLORS.length]
                          : CHEST_GRADIENT_COLORS[idx % CHEST_GRADIENT_COLORS.length]
                      } text-white flex items-center justify-center text-3xl sm:text-4xl shadow-lg shadow-orange-500/20 transition-transform ${
                        isOpened
                          ? 'rotate-0 scale-95'
                          : isUnopenedAndShuffling
                          ? 'animate-spin duration-700'
                          : 'group-hover:rotate-6 group-hover:scale-110'
                      }`}
                    >
                      {isOpened ? item.badge || '🎉' : '🎁'}
                    </div>

                    {/* Box Label */}
                    <div className="text-center w-full px-1">
                      <span className="font-black text-sm sm:text-base text-white block truncate">
                        {isOpened ? item.title : `Hộp Quà Số ${idx + 1}`}
                      </span>
                      <p
                        className={`text-[11px] font-bold mt-0.5 ${
                          isOpened ? 'text-amber-300' : 'text-slate-400 group-hover:text-amber-300'
                        }`}
                      >
                        {isOpened ? '✨ ĐÃ MỞ (Bấm xem lại)' : 'Bấm để lật mở 🎁'}
                      </p>
                    </div>

                    {/* Number Badge */}
                    <div
                      className={`absolute top-2.5 right-2.5 w-6 h-6 rounded-full font-mono font-bold text-xs flex items-center justify-center border shadow-sm ${
                        isOpened
                          ? 'bg-emerald-600 text-white border-emerald-400'
                          : 'bg-slate-900/90 text-slate-300 border-slate-700 group-hover:border-amber-400 group-hover:text-amber-300'
                      }`}
                    >
                      {isOpened ? <Check className="w-3.5 h-3.5" /> : `#${idx + 1}`}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer info bar */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between text-[11px] text-slate-400 px-4 sm:px-6">
          <div className="flex items-center space-x-3">
            <span>
              💡 Phím tắt: <strong className="text-slate-200">1-9</strong> (Mở hộp),{' '}
              <strong className="text-slate-200">Space / S</strong> (Xáo trộn),{' '}
              <strong className="text-slate-200">R</strong> (Đặt lại),{' '}
              <strong className="text-slate-200">F</strong> (Toàn màn hình)
            </span>
          </div>

          <div className="flex items-center space-x-2 mt-1 sm:mt-0">
            <span className="text-amber-400 font-bold">GVCN Pro • Thông tư 27</span>
          </div>
        </div>
      </div>

      {/* MODAL: EDIT SINGLE ITEM */}
      {editingItem && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm"
          onClick={() => {
            setEditingItem(null);
            setEditingItemIndex(null);
          }}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 space-y-4 text-white shadow-2xl text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="font-black text-sm text-amber-400 flex items-center gap-1.5">
                <Edit3 className="w-4 h-4" />
                <span>Chỉnh Sửa Hộp Quà</span>
              </h4>
              <button
                type="button"
                onClick={() => {
                  setEditingItem(null);
                  setEditingItemIndex(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Type Selector */}
              <div>
                <label className="font-bold text-slate-300 block mb-1">Loại nội dung:</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { type: 'REWARD' as const, label: '🎁 Phần thưởng' },
                    { type: 'QUESTION' as const, label: '🧠 Đố vui' },
                    { type: 'CHALLENGE' as const, label: '🎯 Thử thách' },
                  ].map((t) => (
                    <button
                      key={t.type}
                      type="button"
                      onClick={() => setEditingItem({ ...editingItem, type: t.type })}
                      className={`p-2 rounded-xl font-black text-[11px] border text-center cursor-pointer ${
                        editingItem.type === t.type
                          ? 'bg-amber-500 text-slate-950 border-amber-400'
                          : 'bg-slate-800 border-slate-700 text-slate-300'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title & Emoji */}
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Emoji:</label>
                  <input
                    type="text"
                    value={editingItem.badge}
                    onChange={(e) => setEditingItem({ ...editingItem, badge: e.target.value })}
                    className="w-full text-center py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-lg font-bold text-white"
                  />
                </div>
                <div className="col-span-3">
                  <label className="font-bold text-slate-300 block mb-1">Tiêu đề hộp quà:</label>
                  <input
                    type="text"
                    value={editingItem.title}
                    onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold text-xs"
                    placeholder="Ví dụ: +2 Sao Thi Đua Nề Nếp..."
                  />
                </div>
              </div>

              {/* Star Points */}
              <div>
                <label className="font-bold text-slate-300 block mb-1">
                  Điểm sao thưởng (+⭐):
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 5].map((pts) => (
                    <button
                      key={pts}
                      type="button"
                      onClick={() => setEditingItem({ ...editingItem, starPoints: pts })}
                      className={`px-3 py-1 rounded-xl font-black text-xs border cursor-pointer ${
                        editingItem.starPoints === pts
                          ? 'bg-amber-500 text-slate-950 border-amber-400'
                          : 'bg-slate-800 border-slate-700 text-slate-300'
                      }`}
                    >
                      +{pts} ⭐
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="font-bold text-slate-300 block mb-1">Mô tả / Gợi ý:</label>
                <textarea
                  rows={2}
                  value={editingItem.desc}
                  onChange={(e) => setEditingItem({ ...editingItem, desc: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs resize-none"
                  placeholder="Mô tả chi tiết phần thưởng hoặc nội dung câu hỏi..."
                />
              </div>

              {/* Answer if Question or Challenge */}
              {editingItem.type !== 'REWARD' && (
                <div>
                  <label className="font-bold text-slate-300 block mb-1">
                    Đáp án / Lời giải:
                  </label>
                  <textarea
                    rows={2}
                    value={editingItem.answer || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, answer: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs resize-none"
                    placeholder="Đáp án hoặc hướng dẫn hoàn thành thử thách..."
                  />
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setEditingItem(null);
                  setEditingItemIndex(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 cursor-pointer"
              >
                Huỷ
              </button>
              <button
                type="button"
                onClick={() => handleSaveItemEdit(editingItem)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black cursor-pointer shadow-md"
              >
                Lưu Thay Đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD NEW ITEM */}
      {isNewItemModalOpen && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm"
          onClick={() => setIsNewItemModalOpen(false)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 space-y-4 text-white shadow-2xl text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="font-black text-sm text-emerald-400 flex items-center gap-1.5">
                <Plus className="w-4 h-4" />
                <span>Thêm Hộp Quà Mới</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsNewItemModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <NewItemForm onSubmit={handleAddNewItemToActivePack} onCancel={() => setIsNewItemModalOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

// Subcomponent for adding a new chest item
function NewItemForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (item: MysteryChestItem) => void;
  onCancel: () => void;
}) {
  const [type, setType] = useState<MysteryChestContentType>('REWARD');
  const [title, setTitle] = useState('');
  const [badge, setBadge] = useState('🎁');
  const [starPoints, setStarPoints] = useState(2);
  const [desc, setDesc] = useState('');
  const [answer, setAnswer] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Vui lòng nhập tiêu đề hộp quà!');
      return;
    }

    const newItem: MysteryChestItem = {
      id: `item_${Date.now()}`,
      type,
      title: title.trim(),
      badge: badge || '🎁',
      starPoints,
      desc: desc.trim() || 'Phần thưởng bất ngờ từ cô giáo!',
      answer: answer.trim() || undefined,
      color: CHEST_GRADIENT_COLORS[Math.floor(Math.random() * CHEST_GRADIENT_COLORS.length)],
    };

    onSubmit(newItem);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Type Selector */}
      <div>
        <label className="font-bold text-slate-300 block mb-1">Loại nội dung:</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { t: 'REWARD' as const, label: '🎁 Phần thưởng' },
            { t: 'QUESTION' as const, label: '🧠 Đố vui' },
            { t: 'CHALLENGE' as const, label: '🎯 Thử thách' },
          ].map((item) => (
            <button
              key={item.t}
              type="button"
              onClick={() => {
                setType(item.t);
                if (item.t === 'REWARD') setBadge('🎁');
                if (item.t === 'QUESTION') setBadge('🧠');
                if (item.t === 'CHALLENGE') setBadge('🎯');
              }}
              className={`p-2 rounded-xl font-black text-[11px] border text-center cursor-pointer ${
                type === item.t
                  ? 'bg-emerald-500 text-white border-emerald-400'
                  : 'bg-slate-800 border-slate-700 text-slate-300'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Title & Emoji */}
      <div className="grid grid-cols-4 gap-2">
        <div>
          <label className="font-bold text-slate-300 block mb-1">Emoji:</label>
          <input
            type="text"
            value={badge}
            onChange={(e) => setBadge(e.target.value)}
            className="w-full text-center py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-lg font-bold text-white"
          />
        </div>
        <div className="col-span-3">
          <label className="font-bold text-slate-300 block mb-1">Tiêu đề:</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold text-xs"
            placeholder="Ví dụ: +2 Sao Thi Đua..."
          />
        </div>
      </div>

      {/* Star Points */}
      <div>
        <label className="font-bold text-slate-300 block mb-1">Điểm sao thưởng (+⭐):</label>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 5].map((pts) => (
            <button
              key={pts}
              type="button"
              onClick={() => setStarPoints(pts)}
              className={`px-3 py-1 rounded-xl font-black text-xs border cursor-pointer ${
                starPoints === pts
                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                  : 'bg-slate-800 border-slate-700 text-slate-300'
              }`}
            >
              +{pts} ⭐
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="font-bold text-slate-300 block mb-1">Mô tả / Gợi ý:</label>
        <textarea
          rows={2}
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs resize-none"
          placeholder="Mô tả phần thưởng hoặc nội dung câu hỏi..."
        />
      </div>

      {/* Answer if Question or Challenge */}
      {type !== 'REWARD' && (
        <div>
          <label className="font-bold text-slate-300 block mb-1">Đáp án / Lời giải:</label>
          <textarea
            rows={2}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs resize-none"
            placeholder="Đáp án hoặc gợi ý giải..."
          />
        </div>
      )}

      <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 cursor-pointer"
        >
          Huỷ
        </button>
        <button
          type="submit"
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black cursor-pointer shadow-md"
        >
          Thêm Vào Bộ
        </button>
      </div>
    </form>
  );
}
