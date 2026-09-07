import { db, AISettings, HabitLog, Task, JournalEntry } from '../db/schema';
import { format, subDays } from 'date-fns';

export interface AIContextData {
  summary: string;
  habitsData?: any;
  tasksData?: any;
  journalData?: any;
  metricsUsed: string[];
}

export async function getAIContext(
  userQuery: string,
  privacy: AISettings['privacy'],
  entityContext?: { type: string; id: string }
): Promise<AIContextData> {
  const queryLower = userQuery.toLowerCase();
  const metricsUsed: string[] = [];

  let habitsSummary: any = null;
  let tasksSummary: any = null;
  let journalSummary: any = null;

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const past30DaysStr = format(subDays(new Date(), 30), 'yyyy-MM-dd');

  if (privacy.allowHabitData && (queryLower.includes('habit') || queryLower.includes('streak') || queryLower.includes('consistency') || !entityContext)) {
    const habits = await db.habits.where('archived').equals(0).toArray();
    const logs = await db.habitLogs.where('date').aboveOrEqual(past30DaysStr).toArray();

    const habitStats = habits.map((h) => {
      const hLogs = logs.filter((l: HabitLog) => l.habitId === h.id);
      const completed = hLogs.filter((l: HabitLog) => l.status === 'completed').length;
      const rate = hLogs.length > 0 ? Math.round((completed / hLogs.length) * 100) : 0;
      return {
        id: h.id,
        name: h.name,
        category: h.category,
        completionRate30d: `${rate}%`,
        totalCompleted30d: completed,
      };
    });

    habitsSummary = {
      totalActiveHabits: habits.length,
      habits: habitStats,
    };
    metricsUsed.push('30-Day Habit Completion Rates');
  }

  if (privacy.allowTaskData && (queryLower.includes('task') || queryLower.includes('overdue') || queryLower.includes('project') || !entityContext)) {
    const tasks = await db.tasks.toArray();
    const completed = tasks.filter((t: Task) => t.status === 'completed').length;
    const planned = tasks.filter((t: Task) => t.status === 'planned' || t.status === 'todo').length;
    const overdue = tasks.filter((t: Task) => (t.dueDate || t.endDate) && (t.dueDate! < todayStr || t.endDate! < todayStr) && t.status !== 'completed').length;
    const critical = tasks.filter((t: Task) => t.priority === 'critical' && t.status !== 'completed').length;

    tasksSummary = {
      totalTasks: tasks.length,
      completed,
      planned,
      overdue,
      critical,
      recentCriticalTasks: tasks
        .filter((t: Task) => t.priority === 'critical' && t.status !== 'completed')
        .map((t: Task) => ({ title: t.title, endDate: t.endDate || t.dueDate })),
    };
    metricsUsed.push('Task Workload & Overdue Statistics');
  }

  if (privacy.allowJournalData && (queryLower.includes('journal') || queryLower.includes('mood') || queryLower.includes('energy') || queryLower.includes('win') || queryLower.includes('blocker'))) {
    const journals = await db.journalEntries.where('date').aboveOrEqual(past30DaysStr).toArray();
    const avgMood = journals.length > 0 ? (journals.reduce((sum: number, j: JournalEntry) => sum + j.mood, 0) / journals.length).toFixed(1) : 'N/A';
    const avgEnergy = journals.length > 0 ? (journals.reduce((sum: number, j: JournalEntry) => sum + j.energy, 0) / journals.length).toFixed(1) : 'N/A';

    journalSummary = {
      totalEntries: journals.length,
      avgMoodScore: avgMood,
      avgEnergyScore: avgEnergy,
      recentWins: journals.slice(-3).flatMap((j: JournalEntry) => j.wins).filter(Boolean),
      recentBlockers: journals.slice(-3).flatMap((j: JournalEntry) => j.blockers || []).filter(Boolean),
    };
    metricsUsed.push('Journal Mood & Energy Statistics');
  }

  const summaryText = `
User Context Date: ${todayStr}
Habits Overview: ${JSON.stringify(habitsSummary)}
Tasks Overview: ${JSON.stringify(tasksSummary)}
Journal Overview: ${JSON.stringify(journalSummary)}
  `.trim();

  return {
    summary: summaryText,
    habitsData: habitsSummary,
    tasksData: tasksSummary,
    journalData: journalSummary,
    metricsUsed,
  };
}

export async function generateBuiltinAnalyticalResponse(
  userQuery: string,
  contextData: AIContextData,
  tone: string = 'analytical',
  behavioralFramework?: string
): Promise<{ text: string; actionCards?: any[]; suggestedPrompts?: string[] }> {
  const q = userQuery.trim().toLowerCase();
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  let toneHeader = '';
  if (tone === 'motivational') {
    toneHeader = '⚡ *[Motivational Coach Mode]* Keep pressing forward!\n\n';
  } else if (tone === 'strict') {
    toneHeader = '⚠️ *[Strict Performance Audit]* Direct evaluation of your execution data:\n\n';
  } else if (tone === 'concise') {
    toneHeader = '📋 *[Executive Summary]*\n\n';
  }

  const isGreeting = ['hello', 'hi', 'hey', 'hi there', 'who are you', 'help', 'good morning', 'good afternoon'].some(
    (g) => q === g || q.startsWith(g + ' ')
  );

  if (isGreeting) {
    let text = `${toneHeader}Hello! 👋 I am your **AI Productivity Analyst** for **Habit OS**.\n\n`;
    text += `I can help you analyze your habit specifications, task workloads, calendar schedules, and daily review snapshots.\n\n`;
    text += `**What would you like to explore today?**\n`;
    text += `* Ask *"Analyze Today"* for a complete performance summary.\n`;
    text += `* Ask *"Review My Habits"* to inspect habit streaks and specifications.\n`;
    text += `* Ask *"Analyze Task Workload"* to review deadlines and overdue items.\n`;

    return {
      text,
      suggestedPrompts: [
        'Analyze Today',
        'Review My Habits',
        'Analyze Task Workload',
        'What should I improve next week?',
      ],
    };
  }

  if (q.includes('productivity') || q.includes('how am i doing') || q.includes('analyze today') || q.includes('summary')) {
    const habitsCount = contextData.habitsData?.habits?.length || 0;
    const overdueTasks = contextData.tasksData?.overdue || 0;

    let text = `${toneHeader}### Productivity Analysis Summary (${todayStr})\n\n`;
    text += `Based on your recorded data for the last 30 days:\n\n`;
    text += `* **Habits Tracked**: ${habitsCount} active habit specifications.\n`;
    text += `* **Task Status**: ${contextData.tasksData?.completed || 0} completed, ${contextData.tasksData?.planned || 0} planned, and **${overdueTasks} overdue tasks**.\n\n`;

    if (overdueTasks > 0) {
      text += `> [!WARNING]\n`;
      text += `> You currently have **${overdueTasks} overdue task(s)**. Clearing these high-priority items will immediately improve your Daily Review Productivity Score.`;
    } else {
      text += `> [!NOTE]\n`;
      text += `> You have 0 overdue tasks. Great job keeping your workload clean!`;
    }

    return {
      text,
      suggestedPrompts: [
        'Which habits need improvement?',
        'Analyze my task workload',
        'What should I focus on next week?',
      ],
    };
  }

  if (q.includes('habit') || q.includes('streak') || q.includes('consistency')) {
    const habitsList = contextData.habitsData?.habits || [];
    if (habitsList.length === 0) {
      return {
        text: `${toneHeader}You currently have no active habit specifications recorded. Would you like to create one now?`,
        actionCards: [
          {
            id: `action-${Date.now()}`,
            type: 'create_habit',
            title: 'Create Strength Training Specification',
            payload: { name: 'Strength Training', category: 'Fitness & Health' },
          },
        ],
      };
    }

    let text = `${toneHeader}### 📊 Habit Performance Breakdown\n\n`;
    text += `Here is your habit completion summary over the past 30 days:\n\n`;
    habitsList.forEach((h: any) => {
      text += `* **${h.name}** (${h.category}): **${h.completionRate30d}** (${h.totalCompleted30d} logs)\n`;
    });

    return {
      text,
      suggestedPrompts: [
        'How can I improve my weakest habit?',
        'Summarize my task workload',
      ],
    };
  }

  let fallbackText = `${toneHeader}### Factual Data Summary\n\n`;
  fallbackText += `I queried your local productivity database:\n\n`;
  if (contextData.tasksData) {
    fallbackText += `* **Planned Tasks**: ${contextData.tasksData.planned} | **Completed Tasks**: ${contextData.tasksData.completed} | **Overdue**: ${contextData.tasksData.overdue}\n`;
  }
  if (contextData.habitsData) {
    fallbackText += `* **Active Habit Specifications**: ${contextData.habitsData.totalActiveHabits}\n`;
  }

  return {
    text: fallbackText,
    suggestedPrompts: [
      'Analyze Today',
      'Review My Habits',
      'Analyze Task Workload',
    ],
  };
}
