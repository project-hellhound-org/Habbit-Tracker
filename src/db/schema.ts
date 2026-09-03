import Dexie, { Table } from 'dexie';

export interface FocusCheckpoint {
  id?: string;
  timestamp: string;
  verified?: boolean;
  responseSeconds?: number;
  response?: string;
  checkpointType?: string;
  notes?: string;
}

export interface FocusInterruption {
  id?: string;
  timestamp: string;
  reason: string;
  durationSeconds?: number;
  durationMinutes: number;
  notes?: string;
}

export interface Habit {
  id: string;
  name: string;
  description: string;
  category: string;
  icon?: string;
  frequency?: 'daily' | 'weekly' | 'custom_days';
  frequencyType?: string;
  frequencyConfig?: any;
  targetDaysPerWeek?: number;
  customDays?: number[];
  targetValue: number;
  unit: string;
  trackingType?: string;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'anytime';
  color: string;
  difficulty?: string;
  priority?: string;
  notes?: string;
  startDate?: string;
  endDate?: string;
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

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'backlog' | 'todo' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueDate?: string;
  dueTime?: string | null;
  timeRange?: string;
  projectId?: string | null;
  goalId?: string | null;
  tags: string[];
  notes?: string;
  estimatedMinutes?: number;
  trackedMinutes?: number;
  verifiedMinutes?: number;
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

export interface FocusSession {
  id: string;
  title?: string;
  category?: string;
  taskId?: string | null;
  projectId?: string | null;
  goalId?: string | null;
  mode: 'guided' | 'continuous' | 'goal_based';
  targetDurationMinutes: number;
  verificationIntervalMinutes: number;
  gracePeriodMinutes?: number;
  associatedType?: 'task' | 'project' | 'goal' | 'none';
  associatedId?: string | null;
  associatedTitle?: string;
  notes?: string;
  startTimestamp: string;
  endTimestamp?: string | null;
  elapsedSeconds: number;
  verifiedSeconds: number;
  interruptedSeconds: number;
  unverifiedSeconds: number;
  efficiencyPct?: number;
  verificationCheckpoints?: FocusCheckpoint[];
  checkpoints: FocusCheckpoint[];
  interruptions: FocusInterruption[];
  status: 'active' | 'completed' | 'interrupted' | 'cancelled';
}

export interface ActiveSessionState {
  id: string;
  session: FocusSession;
  lastHeartbeatISO: string;
  nextVerificationISO?: string;
  isVerificationPromptOpen?: boolean;
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

export interface DailyReview {
  id: string;
  date: string;
  productivityScore?: number;
  habitCompletionPct?: number;
  taskCompletionPct?: number;
  focusMinutes?: number;
  accomplished?: string;
  missed?: string;
  whyMissed?: string;
  carryForwardNotes?: string;
  mood?: number;
  energy?: number;
  reflection?: string;
  rating?: number;
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

export interface AppSettings {
  id: string;
  userName: string;
  appPassword?: string;
  theme: 'dark' | 'light' | 'system';
  accentColor: string;
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
  verificationSettings: {
    defaultIntervalMinutes: number;
    gracePeriodMinutes: number;
    verificationRequired: boolean;
    excludeUnverifiedFromProductivity: boolean;
  };
}

export interface AIConversation {
  id: string;
  title: string;
  entityType?: 'habit' | 'task' | 'project' | 'goal' | 'focus' | 'general';
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
  provider: 'builtin' | 'ollama' | 'openai' | 'nvidia' | 'anthropic' | 'gemini' | 'custom';
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
    allowFocusData: boolean;
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
  focusSessions!: Table<FocusSession>;
  activeSessionState!: Table<ActiveSessionState>;
  journalEntries!: Table<JournalEntry>;
  dailyReviews!: Table<DailyReview>;
  categories!: Table<Category>;
  tags!: Table<Tag>;
  settings!: Table<AppSettings>;
  aiConversations!: Table<AIConversation>;
  aiMessages!: Table<AIMessage>;
  aiSettings!: Table<AISettings>;

  constructor() {
    super('HabitOSDB');
    this.version(2).stores({
      habits: 'id, name, category, archived',
      habitLogs: 'id, habitId, date, status, [habitId+date]',
      tasks: 'id, title, status, priority, dueDate, projectId, goalId',
      subtasks: 'id, taskId, completed',
      projects: 'id, name, category, status, goalId',
      goals: 'id, title, category, status',
      focusSessions: 'id, mode, status, startTimestamp',
      activeSessionState: 'id',
      journalEntries: 'id, date, mood, energy',
      dailyReviews: 'id, date',
      categories: 'id, name',
      tags: 'id, name',
      settings: 'id',
      aiConversations: 'id, entityType, entityId, updatedAt',
      aiMessages: 'id, conversationId, timestamp',
      aiSettings: 'id',
    });
  }
}

export const db = new HabitOSDatabase();
