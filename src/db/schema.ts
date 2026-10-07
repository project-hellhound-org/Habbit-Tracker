import Dexie, { Table } from 'dexie';

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
  loggedAt: string;
}

// ─── Sub-Habits ───────────────────────────────────────────────
export interface SubHabit {
  id: string;
  habitId: string;           // FK → Habit.id
  name: string;              // e.g. "Linear Algebra", "React Hooks"
  description?: string;
  order: number;             // display order within parent
  targetValue?: number;      // progress target (e.g. 100 pages)
  unit?: string;             // e.g. "pages", "problems", "minutes"
  color?: string;
  archived: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface SubHabitLog {
  id: string;
  subHabitId: string;
  habitId: string;           // denormalized for efficient queries
  date: string;
  status: 'completed' | 'partial' | 'skipped';
  value: number;
  notes?: string;
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
  startDate?: string;    // deprecated — kept for backward compat, no longer indexed
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

// ─── Workspace Management ─────────────────────────────────────
export interface Note {
  id: string;
  entityType: 'habit' | 'task' | 'project' | 'goal' | 'general';
  entityId?: string;
  title: string;
  content: string;        // markdown
  tags: string[];
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WishlistItem {
  id: string;
  title: string;
  description?: string;
  category?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'wished' | 'in_progress' | 'acquired' | 'dismissed';
  linkedEntityType?: string;
  linkedEntityId?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistItem {
  id: string;
  parentType: 'wishlist' | 'note' | 'task' | 'habit' | 'standalone';
  parentId?: string;
  title: string;
  completed: boolean;
  order: number;
  createdAt: string;
}

// ─── Calendar Items ───────────────────────────────────────────
export interface CalendarItem {
  id: string;
  type: 'event' | 'task' | 'appointment';
  title: string;
  start: string;            // ISO-8601 UTC
  end: string;              // ISO-8601 UTC
  allDay: boolean;
  rrule?: string;           // RFC 5545
  categoryId?: string;
  description?: string;
  deadline?: string;        // tasks only
  reminderMinutes?: number;
  completed?: boolean;      // tasks only
  createdAt: string;
  updatedAt: string;
}

// ─── Finance Entities ─────────────────────────────────────────
export type FinAccountKind = 'bank' | 'savings' | 'wallet' | 'credit_card' | 'cash';
export type FinTxType = 'expense' | 'income' | 'transfer';
export type FinCurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP';

export interface FinAccount {
  id: string;
  name: string;
  kind: FinAccountKind;
  currency: FinCurrencyCode;
  openingBalanceMinor: number;  // paise/cents
  iconKey: string;
  isLiability: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FinCategory {
  id: string;
  name: string;
  type: 'expense' | 'income';
  colorToken: string;
  iconKey: string;
  parentId?: string;
  archived: boolean;
}

export interface FinTransaction {
  id: string;
  type: FinTxType;
  amountMinor: number;         // integer paise/cents
  currency: FinCurrencyCode;
  accountId: string;
  toAccountId?: string;        // for transfers
  transferGroupId?: string;    // links two sides of a transfer
  categoryId?: string;
  merchant?: string;
  description?: string;
  notes?: string;
  tags: string[];
  occurredAt: string;          // ISO-8601 UTC
  recurringRuleId?: string;
  habitId?: string;            // optional habit-linking
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;          // soft delete
}

export interface FinBudget {
  id: string;
  categoryId: string;
  periodKind: 'month' | 'week' | 'year';
  limitMinor: number;
  currency: FinCurrencyCode;
  rollover: boolean;
  alertAtPercent: number[];
}

export interface SavingsGoal {
  id: string;
  name: string;
  iconKey: string;
  targetMinor: number;
  currentMinor: number;
  currency: FinCurrencyCode;
  targetDate?: string;
  linkedAccountId?: string;
  contributions: { id: string; amountMinor: number; at: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface RecurringRule {
  id: string;
  description: string;
  amountMinor: number;
  currency: FinCurrencyCode;
  accountId: string;
  categoryId: string;
  rrule: string;               // RFC 5545
  startDate: string;
  endDate?: string;
  status: 'active' | 'paused';
  iconKey: string;
  autoPost: boolean;
  createdAt: string;
  updatedAt: string;
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
  subHabits!: Table<SubHabit>;
  subHabitLogs!: Table<SubHabitLog>;
  tasks!: Table<Task>;
  subtasks!: Table<Subtask>;
  projects!: Table<Project>;
  goals!: Table<Goal>;
  journalEntries!: Table<JournalEntry>;
  dailyReviews!: Table<DailyReview>;
  categories!: Table<Category>;
  tags!: Table<Tag>;
  notes!: Table<Note>;
  wishlistItems!: Table<WishlistItem>;
  checklistItems!: Table<ChecklistItem>;
  calendarItems!: Table<CalendarItem>;
  settings!: Table<AppSettings>;
  aiConversations!: Table<AIConversation>;
  aiMessages!: Table<AIMessage>;
  aiSettings!: Table<AISettings>;
  // Finance
  finAccounts!: Table<FinAccount>;
  finCategories!: Table<FinCategory>;
  finTransactions!: Table<FinTransaction>;
  finBudgets!: Table<FinBudget>;
  savingsGoals!: Table<SavingsGoal>;
  recurringRules!: Table<RecurringRule>;

  constructor() {
    super('HabitOSDB');

    // v3 — original schema (kept for migration path)
    this.version(3).stores({
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
    });

    // v4 — sub-habits, workspace, calendar, finance
    this.version(4).stores({
      habits: 'id, name, category, archived',
      habitLogs: 'id, habitId, date, status, [habitId+date]',
      subHabits: 'id, habitId, archived',
      subHabitLogs: 'id, subHabitId, habitId, date, [subHabitId+date]',
      tasks: 'id, title, status, priority, dueDate, endDate, projectId, goalId',  // startDate removed from index
      subtasks: 'id, taskId, completed',
      projects: 'id, name, category, status, goalId',
      goals: 'id, title, category, status',
      journalEntries: 'id, date, mood, energy',
      dailyReviews: 'id, date',
      categories: 'id, name',
      tags: 'id, name',
      // Workspace
      notes: 'id, entityType, entityId, pinned, updatedAt',
      wishlistItems: 'id, status, priority, updatedAt',
      checklistItems: 'id, parentType, parentId, completed',
      // Calendar
      calendarItems: 'id, type, start, end, categoryId',
      settings: 'id',
      aiConversations: 'id, entityType, entityId, updatedAt',
      aiMessages: 'id, conversationId, timestamp',
      aiSettings: 'id',
      // Finance
      finAccounts: 'id, kind, archived',
      finCategories: 'id, name, type, archived',
      finTransactions: 'id, type, accountId, categoryId, occurredAt, deletedAt',
      finBudgets: 'id, categoryId, periodKind',
      savingsGoals: 'id, name',
      recurringRules: 'id, status, accountId, categoryId',
    });
  }
}

export const db = new HabitOSDatabase();
