import Dexie, { Table } from 'dexie';

export interface SubHabit {
  id: string;
  title: string;
  completed: boolean;
  status?: 'completed' | 'failed' | 'pending';
}

export interface Habit {
  id: string;
  name: string;
  description?: string;
  category: 'Fitness & Health' | 'Learning & Growth' | 'Work & Projects' | string;
  icon?: string;
  frequency?: 'daily' | 'weekly' | 'custom_days';
  frequencyMode?: 'everyday' | 'custom';
  selectedDays?: number[]; // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  frequencyType?: string;
  frequencyConfig?: any;
  targetDaysPerWeek?: number;
  customDays?: number[];
  targetValue?: number;
  unit?: string;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'anytime';
  startTime?: string; // e.g. "08:00"
  endTime?: string;   // e.g. "09:00"
  amPm?: 'AM' | 'PM';
  color: string;
  difficulty?: string;
  priority?: string;
  notes?: string;
  subHabits?: SubHabit[];
  startDate?: string;
  endDate?: string;   // Defined completion timeline (deprecated/optional)
  archived: number | boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string;
  status: 'completed' | 'partial' | 'skipped' | 'failed';
  value: number;
  notes?: string;
  subHabitsState?: Record<string, 'completed' | 'failed' | 'pending'>;
  loggedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'planned' | 'completed' | 'remaining' | 'overdue' | 'cancelled' | 'deferred' | 'todo' | 'in_progress' | 'backlog';
  priority: 'low' | 'medium' | 'high' | 'critical';
  frequency?: 'once_a_week' | 'daily' | 'custom';
  customDays?: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  dueDate?: string;
  dueTime?: string | null;
  dailyTimeLimitMinutes?: number;
  completionTimeMinutes?: number;
  projectId?: string | null;
  goalId?: string | null;
  tags?: string[];
  notes?: string;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  order: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  category: string;
  color: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'archived';
  startDate?: string;
  deadline?: string | null;
  targetDeadline?: string;
  goalId?: string | null;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Goal {
  id: string;
  title?: string;
  name?: string;
  description: string;
  category: string;
  timeframe?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  targetMetric?: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  color?: string;
  startDate?: string;
  deadline?: string | null;
  status?: 'active' | 'achieved' | 'paused' | 'failed';
  relatedHabitIds?: string[];
  relatedProjectIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface WishlistItem {
  id: string;
  title: string;
  description?: string;
  category: 'purchase' | 'resource' | 'project' | string;
  estimatedCost?: number;
  url?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'saved' | 'in_progress' | 'acquired' | 'archived';
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  color?: string;
  relatedType?: 'habit' | 'task' | 'project' | 'goal' | 'finance' | 'general';
  relatedId?: string;
  pinned?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceAccount {
  id: string;
  name: string;
  type: 'cash' | 'bank' | 'upi' | 'credit_card' | 'savings' | 'investment';
  balance: number;
  currency: string;
  color?: string;
  isDefault?: boolean;
  createdAt: string;
}

export interface FinanceTransaction {
  id: string;
  type: 'income' | 'expense' | 'transfer' | 'refund' | 'adjustment';
  amount: number;
  accountId: string;
  toAccountId?: string;
  category: string;
  date: string;
  time?: string;
  merchant?: string;
  paymentMethod?: string;
  description?: string;
  notes?: string;
  tags?: string[];
  createdAt: string;
}

export interface FinanceBudget {
  id: string;
  category: string;
  amountLimit: number;
  period: 'monthly' | 'weekly' | 'yearly';
  startDate?: string;
}

export interface FinanceSavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  category?: string;
  notes?: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  mood: number;
  energy: number;
  content?: string;
  notes?: string;
  wins: string[];
  blockers?: string[];
  challenges?: string[];
  gratitude?: string[];
  tags?: string[];
  createdAt?: string;
  updatedAt: string;
}

export interface DailySnapshotData {
  productivityScore: string;     // e.g. "82/100"
  habitCompletion: string;       // e.g. "8/10"
  taskCompletion: string;        // e.g. "7/9"
  timeLogged: string;            // e.g. "5h 24m"
  focusEfficiency: string;       // e.g. "87%"
  goalsProgress: string;         // e.g. "3/4"
  overdueTasks: number;          // e.g. 2
  currentStreak: string;         // e.g. "14 days"
  dailyCompletionRate: string;   // e.g. "80%"
  taskReviewStats: {
    planned: number;
    completed: number;
    remaining: number;
    overdue: number;
    cancelled: number;
    deferred: number;
  };
}

export interface DailyReview {
  id: string;
  date: string;
  productivityScore?: number;
  habitCompletionPct?: number;
  taskCompletionPct?: number;
  unifiedReviewNotes?: string;
  accomplished?: string;
  missed?: string;
  whyMissed?: string;
  carryForwardNotes?: string;
  mood?: number;
  energy?: number;
  reflection?: string;
  rating?: number;
  snapshotData?: DailySnapshotData;
  createdAt?: string;
  completedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export type ForestTheme = 'rain_forest' | 'foggy_mist';

export interface AppSettings {
  id: string;
  userName: string;
  appPassword?: string;
  theme: 'dark' | 'light' | 'system';
  accentColor: string;
  environmentTheme: ForestTheme;
  animationEnabled: boolean;
  ambientMotionEnabled: boolean;
  environmentIntensity: number; // 0..100
  motionSpeed: number;          // 0..100
  mistRainDensity: number;      // 0..100
  weekStartDay: number;
  productivityWeights: {
    habitWeight: number;
    taskWeight: number;
    focusWeight: number;
    goalWeight: number;
  };
  streakSkipRule: 'pause' | 'reset' | 'forgive' | 'break';
  streakFreezeEarned: number;
  streakFreezeActiveUntil?: string | null;
  consecutiveDays100Pct: number;
  lastLoginDate?: string;
}

export interface AIConversation {
  id: string;
  title: string;
  entityType?: 'habit' | 'task' | 'project' | 'goal' | 'general';
  entityId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AIMessage {
  id: string;
  conversationId: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  metadata?: {
    suggestedPrompts?: string[];
    actionCards?: {
      id: string;
      type: 'create_task' | 'create_habit' | 'create_goal';
      title: string;
      payload: any;
      executed?: boolean;
    }[];
    metricsUsed?: string[];
  };
}

export interface AISettings {
  id: string;
  mode: 'local' | 'cloud';
  provider: 'ollama' | 'cloud' | string;
  model: string;
  apiKey?: string;
  endpoint?: string;
  temperature: number;
  tone?: 'analytical' | 'motivational' | 'concise' | 'strict' | 'coaching' | 'custom';
  behavioralFramework?: string;
  privacy: {
    allowHabitData: boolean;
    allowTaskData: boolean;
    allowProjectData: boolean;
    allowGoalData: boolean;
    allowJournalData: boolean;
    allowHistoricalData: boolean;
  };
  enableStreaming: boolean;
}

export class HabitOSDatabase extends Dexie {
  habits!: Table<Habit>;
  habitLogs!: Table<HabitLog>;
  tasks!: Table<Task>;
  subtasks!: Table<Subtask>;
  projects!: Table<Project>;
  goals!: Table<Goal>;
  journalEntries!: Table<JournalEntry>;
  dailyReviews!: Table<DailyReview>;
  categories!: Table<Category>;
  tags!: Table<Tag>;
  settings!: Table<AppSettings>;
  aiConversations!: Table<AIConversation>;
  aiMessages!: Table<AIMessage>;
  aiSettings!: Table<AISettings>;
  wishlistItems!: Table<WishlistItem>;
  notes!: Table<NoteItem>;
  financeAccounts!: Table<FinanceAccount>;
  financeTransactions!: Table<FinanceTransaction>;
  financeBudgets!: Table<FinanceBudget>;
  financeSavingsGoals!: Table<FinanceSavingsGoal>;

  constructor() {
    super('HabitOSDB');
    this.version(4).stores({
      habits: 'id, name, category, archived',
      habitLogs: 'id, habitId, date, status, [habitId+date]',
      tasks: 'id, title, status, priority, dueDate, startDate, endDate, projectId, goalId',
      subtasks: 'id, taskId, completed',
      projects: 'id, name, category, status, goalId',
      goals: 'id, title, category, status',
      journalEntries: 'id, date, mood, energy',
      dailyReviews: 'id, date',
      categories: 'id, name',
      tags: 'id, name',
      settings: 'id',
      aiConversations: 'id, entityType, entityId, updatedAt',
      aiMessages: 'id, conversationId, timestamp',
      aiSettings: 'id',
      wishlistItems: 'id, title, category, status, priority',
      notes: 'id, title, category, relatedType, relatedId, pinned',
      financeAccounts: 'id, name, type',
      financeTransactions: 'id, type, accountId, category, date',
      financeBudgets: 'id, category, period',
      financeSavingsGoals: 'id, title, category'
    });
  }
}

export const db = new HabitOSDatabase();
