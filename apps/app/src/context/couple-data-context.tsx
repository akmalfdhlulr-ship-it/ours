import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { storage } from '../utils/storage';
import { useAuth } from './auth-context';
import { api } from '../services/api';

async function uriToBase64(uri: string): Promise<string> {
  if (uri.startsWith('data:')) return uri;
  try {
    const res = await fetch(uri);
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn('uriToBase64 fallback for:', uri, err);
    return uri;
  }
}

export interface MenuItem {
  qty: string;
  name: string;
  category: string;
  price: string;
  priceNumber?: number;
}

export interface SharedMemory {
  id: string;
  title: string;
  description: string;
  date: string;
  imageUrl: string;
  locationName: string;
  author: string;
  isFavorite?: boolean;
  audioDuration?: string;
  audioTitle?: string;
}

export interface SharedWishlistItem {
  id: string;
  title: string;
  category: 'Liburan' | 'Kuliner' | 'Aktivitas';
  targetAmount: number;
  currentSaved: number;
  priority: 'Tinggi' | 'Sedang' | 'Santai';
  imageUrl?: string;
  isCompleted: boolean;
  location?: string;
  deadline?: string;
}

export interface SharedDatePlan {
  id: string;
  title: string;
  date: string;
  time: string;
  venueName: string;
  location: string;
  estimatedBudget: number;
  status: 'upcoming' | 'completed';
  notes?: string;
  isMilestone?: boolean;
  imageUrl?: string;
}

export interface SharedExpense {
  id: string;
  merchantName: string;
  amount: number;
  date: string;
  category: string;
  splitMode: '50-50' | 'partner' | 'user' | string;
  memoryNote?: string;
  items?: MenuItem[];
  accuracy?: number;
}

export interface SharedLetter {
  id: string;
  title: string;
  sender: string;
  recipient: string;
  sealedDate: string;
  unlockDate: string;
  fullText: string;
  wordCount: number;
  preview: string;
  mood: string;
  moodIcon: string;
  isUnlocked: boolean;
  secretTeaser: string;
}

export interface SharedQuizState {
  questionNumber: number;
  questionText: string;
  category: string;
  streakDays: number;
  danielAnswer: string | null;
  sasaAnswer: string | null;
  isRevealed: boolean;
  quickPickRound1: { userChoice: string; agreed: boolean };
  quickPickRound2: { danielChoice: string | null; sasaChoice: string | null };
}

export interface CoupleDataContextValue {
  isNewCoupleMode: boolean;
  setNewCoupleMode: (val: boolean) => void;
  daysTogether: number;
  partnerNames: { user: string; partner: string };
  totalBudget: number;
  setTotalBudget: (val: number) => void;

  activeRole: 'sasa' | 'daniel';
  setActiveRole: (role: 'sasa' | 'daniel') => void;

  // Memories
  memories: SharedMemory[];
  addMemory: (memory: Omit<SharedMemory, 'id'>) => Promise<void>;
  deleteMemory: (id: string) => Promise<void>;
  refreshMemories: () => Promise<void>;

  // Wishlist
  wishlist: SharedWishlistItem[];
  addWishlistItem: (item: Omit<SharedWishlistItem, 'id' | 'currentSaved' | 'isCompleted'>) => Promise<void>;
  addWishlistSavings: (id: string, amount: number) => void;
  refreshWishlist: () => Promise<void>;

  // Dates
  dates: SharedDatePlan[];
  addDatePlan: (plan: Omit<SharedDatePlan, 'id'>) => Promise<void>;
  refreshDates: () => Promise<void>;

  // Expenses & Wallet
  expenses: SharedExpense[];
  addExpense: (expense: Omit<SharedExpense, 'id'>) => Promise<void>;
  refreshExpenses: () => Promise<void>;

  // Letters / Time Capsule
  letters: SharedLetter[];
  activeCapsule: SharedLetter | null;
  addLetter: (letter: Omit<SharedLetter, 'id' | 'isUnlocked'>, isDirect?: boolean) => void;
  addLoveNote: (note: { title: string; content: string; sender: string; recipient: string }) => void;
  unlockLetter: (id: string) => void;

  // Love Quiz
  quizState: SharedQuizState;
  submitDanielAnswer: (answer: string) => void;
  submitSasaAnswer: (answer: string) => void;
  submitQuickPick: (choice: string) => void;

  // Reciprocal Heartbeat / Detak Rasa
  lastPulseSentAt: number | null;
  lastPulseSender: string | null;
  sendHeartbeat: (sender: string) => void;

  // Reset & Helpers
  resetToCleanState: () => void;
  loadDemoState: () => void;
}

const CoupleDataContext = createContext<CoupleDataContextValue | null>(null);

const STORAGE_KEY_MODE = 'ours_couple_mode_clean';
const STORAGE_KEY_MEMORIES = 'ours_shared_memories';
const STORAGE_KEY_WISHLIST = 'ours_shared_wishlist';
const STORAGE_KEY_DATES = 'ours_shared_dates';
const STORAGE_KEY_EXPENSES = 'ours_shared_expenses';
const STORAGE_KEY_LETTERS = 'ours_shared_letters';
const STORAGE_KEY_CAPSULE = 'ours_shared_active_capsule';
const STORAGE_KEY_QUIZ = 'ours_shared_quiz';
const STORAGE_KEY_BUDGET = 'ours_shared_budget';

export const CoupleDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, coupleSpace } = useAuth();

  // Mode: Production always runs in 100% clean real mode (no fake/dummy data)
  const [isNewCoupleMode, setIsNewCoupleModeState] = useState<boolean>(true);
  const [totalBudget, setTotalBudgetState] = useState<number>(5000000);
  const [activeRole, setActiveRole] = useState<'sasa' | 'daniel'>('sasa');

  // Genuine user-created data states (starts empty, built together by couple)
  const [memories, setMemories] = useState<SharedMemory[]>([]);
  const [wishlist, setWishlist] = useState<SharedWishlistItem[]>([]);
  const [dates, setDates] = useState<SharedDatePlan[]>([]);
  const [expenses, setExpenses] = useState<SharedExpense[]>([]);
  const [letters, setLetters] = useState<SharedLetter[]>([]);
  const [activeCapsule, setActiveCapsule] = useState<SharedLetter | null>(null);

  const [quizState, setQuizState] = useState<SharedQuizState>({
    questionNumber: 1,
    questionText: 'Apa momen kencan kita yang paling bikin kamu ketawa lepas sampai sakit perut?',
    category: 'Nostalgia Manis',
    streakDays: 1,
    danielAnswer: null,
    sasaAnswer: null,
    isRevealed: false,
    quickPickRound1: { userChoice: 'Gunung', agreed: true },
    quickPickRound2: { danielChoice: null, sasaChoice: null },
  });

  const [lastPulseSentAt, setLastPulseSentAt] = useState<number | null>(null);
  const [lastPulseSender, setLastPulseSender] = useState<string | null>(null);

  const partnerMember = coupleSpace?.members?.find((m) => m.userId !== user?.id);
  const myRealName =
    (user as any)?.profile?.displayName ||
    (user as any)?.displayName ||
    user?.email?.split('@')[0] ||
    (activeRole === 'sasa' ? 'Sasa' : 'Daniel');
  const partnerRealName =
    partnerMember?.displayName ||
    (coupleSpace?.status === 'ACTIVE' ? 'Pasangan' : 'Menunggu Pasangan');

  const partnerNames = {
    user: myRealName,
    partner: partnerRealName,
  };

  // Sync memories from backend PostgreSQL database when space is active
  const refreshMemories = useCallback(async () => {
    if (!coupleSpace?.id || coupleSpace.status !== 'ACTIVE') {
      return;
    }
    try {
      const serverItems = await api.memories.list();
      if (Array.isArray(serverItems)) {
        const mapped: SharedMemory[] = serverItems.map((m) => {
          const firstMedia = m.media && m.media.length > 0 ? m.media[0] : null;
          let imageUrl =
            firstMedia?.mediaAsset?.secureUrl ||
            (firstMedia?.mediaAsset?.storageKey?.startsWith('http')
              ? firstMedia.mediaAsset.storageKey
              : '') ||
            '';
          if (imageUrl.startsWith('/api/v1') || imageUrl.startsWith('/media/stream')) {
            imageUrl = `https://ours-production.up.railway.app${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
          }

          return {
            id: m.id,
            title: m.title,
            description: m.description || '',
            date: m.memoryDate || 'Hari Ini',
            locationName: m.locationName || 'Jakarta',
            author:
              m.createdById === user?.id
                ? (partnerNames.user || 'Saya')
                : (partnerNames.partner || 'Pasangan'),
            imageUrl,
            isFavorite: m.isFavorite,
          };
        });
        setMemories(mapped);
        await storage.setItem(STORAGE_KEY_MEMORIES, JSON.stringify(mapped));
      }
    } catch (err) {
      console.warn('Error refreshing memories from backend:', err);
    }
  }, [coupleSpace?.id, coupleSpace?.status, user?.id, partnerNames.user, partnerNames.partner]);

  // Sync expenses from backend PostgreSQL database when space is active
  const refreshExpenses = useCallback(async () => {
    if (!coupleSpace?.id || coupleSpace.status !== 'ACTIVE') return;
    try {
      const serverItems = await api.expenses.list();
      if (Array.isArray(serverItems)) {
        const mapped: SharedExpense[] = serverItems.map((e) => ({
          id: e.id,
          merchantName: e.description,
          amount: e.amount,
          date: e.expenseDate || 'Hari Ini',
          category: e.category || 'Kuliner & Dining',
          splitMode: '50-50',
          paidBy:
            e.paidById === user?.id
              ? (partnerNames.user || 'Saya')
              : (partnerNames.partner || 'Pasangan'),
          accuracy: 98,
        }));
        setExpenses(mapped);
        await storage.setItem(STORAGE_KEY_EXPENSES, JSON.stringify(mapped));
      }
    } catch (err) {
      console.warn('Error refreshing expenses from backend:', err);
    }
  }, [coupleSpace?.id, coupleSpace?.status, user?.id, partnerNames.user, partnerNames.partner]);

  // Sync wishlist from backend PostgreSQL database when space is active
  const refreshWishlist = useCallback(async () => {
    if (!coupleSpace?.id || coupleSpace.status !== 'ACTIVE') return;
    try {
      const serverItems = await api.wishlist.list();
      if (Array.isArray(serverItems)) {
        const mapped: SharedWishlistItem[] = serverItems.map((w) => ({
          id: w.id,
          title: w.title,
          category: (w.category as any) || 'Aktivitas',
          targetAmount: w.budgetAmount || 500000,
          currentSaved: 0,
          priority: w.priority === 'HIGH' ? 'Tinggi' : w.priority === 'LOW' ? 'Santai' : 'Sedang',
          isCompleted: w.status === 'COMPLETED',
          location: w.description || 'Impian Berdua',
        }));
        setWishlist(mapped);
        await storage.setItem(STORAGE_KEY_WISHLIST, JSON.stringify(mapped));
      }
    } catch (err) {
      console.warn('Error refreshing wishlist from backend:', err);
    }
  }, [coupleSpace?.id, coupleSpace?.status]);

  // Sync date plans from backend PostgreSQL database when space is active
  const refreshDates = useCallback(async () => {
    if (!coupleSpace?.id || coupleSpace.status !== 'ACTIVE') return;
    try {
      const serverItems = await api.dates.list();
      if (Array.isArray(serverItems)) {
        const mapped: SharedDatePlan[] = serverItems.map((d) => ({
          id: d.id,
          title: d.title,
          date: d.plannedDate ? d.plannedDate.split('T')[0] : 'Segera',
          time: '19:00',
          venueName: d.stops?.[0]?.title || 'Tempat Spesial',
          location: d.stops?.[0]?.notes || 'Jakarta',
          estimatedBudget: d.budgetAmount || 250000,
          status: d.status === 'COMPLETED' ? 'completed' : 'upcoming',
        }));
        setDates(mapped);
        await storage.setItem(STORAGE_KEY_DATES, JSON.stringify(mapped));
      }
    } catch (err) {
      console.warn('Error refreshing dates from backend:', err);
    }
  }, [coupleSpace?.id, coupleSpace?.status]);

  useEffect(() => {
    if (coupleSpace?.id && coupleSpace.status === 'ACTIVE') {
      refreshMemories();
      refreshExpenses();
      refreshWishlist();
      refreshDates();
    }
  }, [coupleSpace?.id, coupleSpace?.status, refreshMemories, refreshExpenses, refreshWishlist, refreshDates]);

  // Genuine calculation for Days Together strictly from real couple space dates
  const calculateDaysTogether = useCallback((): number => {
    if (coupleSpace?.anniversaryDate) {
      const anniv = new Date(coupleSpace.anniversaryDate);
      const now = new Date();
      const diffMs = now.getTime() - anniv.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      return Math.max(1, diffDays);
    }
    if (coupleSpace?.createdAt) {
      const created = new Date(coupleSpace.createdAt);
      const now = new Date();
      const diffMs = now.getTime() - created.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      return Math.max(1, diffDays + 1);
    }
    return 1; // Real Day 1 for new couples!
  }, [coupleSpace]);

  // Load genuine state from local storage on mount
  useEffect(() => {
    (async () => {
      try {
        setIsNewCoupleModeState(true);

        const storedBudget = await storage.getItem(STORAGE_KEY_BUDGET);
        if (storedBudget) setTotalBudgetState(parseInt(storedBudget, 10));

        // Read real user items
        const savedMem = await storage.getItem(STORAGE_KEY_MEMORIES);
        setMemories(savedMem ? JSON.parse(savedMem) : []);

        const savedWish = await storage.getItem(STORAGE_KEY_WISHLIST);
        setWishlist(savedWish ? JSON.parse(savedWish) : []);

        const savedDates = await storage.getItem(STORAGE_KEY_DATES);
        setDates(savedDates ? JSON.parse(savedDates) : []);

        const savedExp = await storage.getItem(STORAGE_KEY_EXPENSES);
        setExpenses(savedExp ? JSON.parse(savedExp) : []);

        const savedLetters = await storage.getItem(STORAGE_KEY_LETTERS);
        setLetters(savedLetters ? JSON.parse(savedLetters) : []);

        const savedCapsule = await storage.getItem(STORAGE_KEY_CAPSULE);
        setActiveCapsule(savedCapsule ? JSON.parse(savedCapsule) : null);

        const savedQuiz = await storage.getItem(STORAGE_KEY_QUIZ);
        if (savedQuiz) setQuizState(JSON.parse(savedQuiz));
      } catch (err) {
        console.warn('Error loading couple data storage:', err);
      }
    })();
  }, []);

  const setNewCoupleMode = async (val: boolean) => {
    // Mode is always clean real data in production
    setIsNewCoupleModeState(true);
  };

  const setTotalBudget = async (val: number) => {
    setTotalBudgetState(val);
    await storage.setItem(STORAGE_KEY_BUDGET, val.toString());
  };

  // Memories
  const addMemory = async (item: Omit<SharedMemory, 'id'>) => {
    let secureImageUrl = item.imageUrl;
    let mediaAssetId: string | undefined;

    // 1. Direct upload photo to cloud/backend media storage if couple space is active
    if (coupleSpace?.id && item.imageUrl) {
      try {
        const base64Data = await uriToBase64(item.imageUrl);
        const uploaded = await api.media.directUpload({
          imageBase64: base64Data,
          filename: `memory_${Date.now()}.jpg`,
          mimeType: 'image/jpeg',
        });
        mediaAssetId = uploaded.id;
        if (uploaded.secureUrl) {
          secureImageUrl = uploaded.secureUrl;
        }
      } catch (uploadErr) {
        console.warn('Error uploading photo in addMemory:', uploadErr);
      }
    }

    // 2. Persist memory in PostgreSQL backend if couple space is ACTIVE
    let memoryId = `mem-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    if (coupleSpace?.id && coupleSpace.status === 'ACTIVE') {
      try {
        const created = await api.memories.create({
          title: item.title,
          description: item.description,
          memoryDate: new Date().toISOString().split('T')[0],
          locationName: item.locationName,
          mediaAssetIds: mediaAssetId ? [mediaAssetId] : [],
        });
        memoryId = created.id;
        if (created.media?.[0]?.mediaAsset?.secureUrl) {
          secureImageUrl = created.media[0].mediaAsset.secureUrl;
        }
      } catch (createErr) {
        console.warn('Error saving memory to backend database:', createErr);
      }
    }

    // 3. Update local state and sync storage
    const newMemory: SharedMemory = {
      ...item,
      id: memoryId,
      imageUrl: secureImageUrl,
    };
    const updated = [newMemory, ...memories.filter((m) => m.id !== memoryId)];
    setMemories(updated);
    await storage.setItem(STORAGE_KEY_MEMORIES, JSON.stringify(updated));
  };

  const deleteMemory = async (id: string) => {
    if (coupleSpace?.id && coupleSpace.status === 'ACTIVE') {
      try {
        await api.memories.delete(id);
      } catch (err) {
        console.warn('Error deleting memory on backend:', err);
      }
    }
    const updated = memories.filter((m) => m.id !== id);
    setMemories(updated);
    await storage.setItem(STORAGE_KEY_MEMORIES, JSON.stringify(updated));
  };

  // Wishlist
  const addWishlistItem = async (
    item: Omit<SharedWishlistItem, 'id' | 'currentSaved' | 'isCompleted'>
  ) => {
    let wishId = `wish-${Date.now()}`;
    if (coupleSpace?.id && coupleSpace.status === 'ACTIVE') {
      try {
        const created = await api.wishlist.create({
          title: item.title,
          category: item.category,
          budgetAmount: item.targetAmount,
          priority: item.priority === 'Tinggi' ? 'HIGH' : item.priority === 'Santai' ? 'LOW' : 'MEDIUM',
          description: item.location || 'Impian bersama',
        });
        wishId = created.id;
      } catch (err) {
        console.warn('Error creating wishlist on backend:', err);
      }
    }

    const newItem: SharedWishlistItem = {
      ...item,
      id: wishId,
      currentSaved: 0,
      isCompleted: false,
    };
    const updated = [newItem, ...wishlist.filter((w) => w.id !== wishId)];
    setWishlist(updated);
    await storage.setItem(STORAGE_KEY_WISHLIST, JSON.stringify(updated));
    if (coupleSpace?.id && coupleSpace.status === 'ACTIVE') {
      refreshWishlist().catch(() => {});
    }
  };

  const addWishlistSavings = async (id: string, amount: number) => {
    const updated = wishlist.map((w) => {
      if (w.id === id) {
        const nextSaved = w.currentSaved + amount;
        return {
          ...w,
          currentSaved: nextSaved,
          isCompleted: nextSaved >= w.targetAmount,
        };
      }
      return w;
    });
    setWishlist(updated);
    await storage.setItem(STORAGE_KEY_WISHLIST, JSON.stringify(updated));
  };

  // Dates
  const addDatePlan = async (plan: Omit<SharedDatePlan, 'id'>) => {
    let dateId = `date-${Date.now()}`;
    if (coupleSpace?.id && coupleSpace.status === 'ACTIVE') {
      try {
        const created = await api.dates.create({
          title: plan.title,
          plannedDate: plan.date.includes('-') ? plan.date : new Date().toISOString().split('T')[0],
          budgetAmount: plan.estimatedBudget,
        });
        dateId = created.id;
      } catch (err) {
        console.warn('Error creating date plan on backend:', err);
      }
    }

    const newDate: SharedDatePlan = {
      ...plan,
      id: dateId,
    };
    const updated = [newDate, ...dates.filter((d) => d.id !== dateId)];
    setDates(updated);
    await storage.setItem(STORAGE_KEY_DATES, JSON.stringify(updated));
    if (coupleSpace?.id && coupleSpace.status === 'ACTIVE') {
      refreshDates().catch(() => {});
    }
  };

  // Expenses & Wallet
  const addExpense = async (expense: Omit<SharedExpense, 'id'>) => {
    let expenseId = `exp-${Date.now()}`;
    if (coupleSpace?.id && coupleSpace.status === 'ACTIVE') {
      try {
        const created = await api.expenses.create({
          description: expense.merchantName,
          amount: Math.round(expense.amount),
          category: expense.category,
          expenseDate: new Date().toISOString().split('T')[0],
        });
        expenseId = created.id;
      } catch (createErr) {
        console.warn('Error saving expense to backend database:', createErr);
      }
    }

    const newExp: SharedExpense = {
      ...expense,
      id: expenseId,
    };
    const updated = [newExp, ...expenses.filter((e) => e.id !== expenseId)];
    setExpenses(updated);
    await storage.setItem(STORAGE_KEY_EXPENSES, JSON.stringify(updated));
    if (coupleSpace?.id && coupleSpace.status === 'ACTIVE') {
      refreshExpenses().catch(() => {});
    }
  };

  // Letters & Time Capsule
  const addLetter = async (
    letter: Omit<SharedLetter, 'id' | 'isUnlocked'>,
    isDirect?: boolean,
  ) => {
    if (isDirect) {
      const directLetter: SharedLetter = {
        ...letter,
        id: `letter-${Date.now()}`,
        isUnlocked: true,
      };
      const updated = [directLetter, ...letters];
      setLetters(updated);
      await storage.setItem(STORAGE_KEY_LETTERS, JSON.stringify(updated));
    } else {
      const newLetter: SharedLetter = {
        ...letter,
        id: `letter-${Date.now()}`,
        isUnlocked: false,
      };
      setActiveCapsule(newLetter);
      await storage.setItem(STORAGE_KEY_CAPSULE, JSON.stringify(newLetter));
    }
  };

  const addLoveNote = async (note: {
    title: string;
    content: string;
    sender: string;
    recipient: string;
  }) => {
    const newNote: SharedLetter = {
      id: `note-${Date.now()}`,
      title: note.title,
      sender: note.sender,
      recipient: note.recipient,
      sealedDate: 'Hari Ini',
      unlockDate: 'Hari Ini',
      fullText: note.content,
      wordCount: note.content.split(/\s+/).length,
      preview: note.content.slice(0, 80) + '...',
      mood: 'Penuh Kasih',
      moodIcon: 'heart',
      isUnlocked: true,
      secretTeaser: 'Memo manis yang langsung bisa dibaca berdua 💕',
    };
    const updated = [newNote, ...letters];
    setLetters(updated);
    await storage.setItem(STORAGE_KEY_LETTERS, JSON.stringify(updated));
  };

  const unlockLetter = async (id: string) => {
    if (activeCapsule && activeCapsule.id === id) {
      const unlocked = { ...activeCapsule, isUnlocked: true };
      setActiveCapsule(null);
      await storage.removeItem(STORAGE_KEY_CAPSULE);
      const updatedList = [unlocked, ...letters];
      setLetters(updatedList);
      await storage.setItem(STORAGE_KEY_LETTERS, JSON.stringify(updatedList));
    }
  };

  // Love Quiz
  const submitDanielAnswer = async (answer: string) => {
    const nextQuiz: SharedQuizState = {
      ...quizState,
      danielAnswer: answer,
      isRevealed: !!quizState.sasaAnswer,
    };
    setQuizState(nextQuiz);
    await storage.setItem(STORAGE_KEY_QUIZ, JSON.stringify(nextQuiz));
  };

  const submitSasaAnswer = async (answer: string) => {
    const nextQuiz: SharedQuizState = {
      ...quizState,
      sasaAnswer: answer,
      isRevealed: !!quizState.danielAnswer,
    };
    setQuizState(nextQuiz);
    await storage.setItem(STORAGE_KEY_QUIZ, JSON.stringify(nextQuiz));
  };

  const submitQuickPick = async (choice: string) => {
    const nextQuiz: SharedQuizState = {
      ...quizState,
      quickPickRound2: {
        ...quizState.quickPickRound2,
        sasaChoice: choice,
      },
    };
    setQuizState(nextQuiz);
    await storage.setItem(STORAGE_KEY_QUIZ, JSON.stringify(nextQuiz));
  };

  // Reciprocal Heartbeat
  const sendHeartbeat = (sender: string) => {
    setLastPulseSentAt(Date.now());
    setLastPulseSender(sender);
  };

  // Reset to Pristine Clean
  const resetToCleanState = async () => {
    setIsNewCoupleModeState(true);
    await storage.setItem(STORAGE_KEY_MODE, 'true');
    setMemories([]);
    setWishlist([]);
    setDates([]);
    setExpenses([]);
    setLetters([]);
    setActiveCapsule(null);
    await storage.removeItem(STORAGE_KEY_MEMORIES);
    await storage.removeItem(STORAGE_KEY_WISHLIST);
    await storage.removeItem(STORAGE_KEY_DATES);
    await storage.removeItem(STORAGE_KEY_EXPENSES);
    await storage.removeItem(STORAGE_KEY_LETTERS);
    await storage.removeItem(STORAGE_KEY_CAPSULE);
  };

  const loadDemoState = async () => {
    // Zero dummy data: demo mode is permanently replaced by clean genuine state
    await resetToCleanState();
  };

  return (
    <CoupleDataContext.Provider
      value={{
        isNewCoupleMode,
        setNewCoupleMode,
        daysTogether: calculateDaysTogether(),
        partnerNames,
        totalBudget,
        setTotalBudget,
        activeRole,
        setActiveRole,
        memories,
        addMemory,
        deleteMemory,
        refreshMemories,
        wishlist,
        addWishlistItem,
        addWishlistSavings,
        refreshWishlist,
        dates,
        addDatePlan,
        refreshDates,
        expenses,
        addExpense,
        refreshExpenses,
        letters,
        activeCapsule,
        addLetter,
        addLoveNote,
        unlockLetter,
        quizState,
        submitDanielAnswer,
        submitSasaAnswer,
        submitQuickPick,
        lastPulseSentAt,
        lastPulseSender,
        sendHeartbeat,
        resetToCleanState,
        loadDemoState,
      }}
    >
      {children}
    </CoupleDataContext.Provider>
  );
};

export const useCoupleData = (): CoupleDataContextValue => {
  const context = useContext(CoupleDataContext);
  if (!context) {
    throw new Error('useCoupleData must be used within a CoupleDataProvider');
  }
  return context;
};
