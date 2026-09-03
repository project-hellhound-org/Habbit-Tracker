import { db, AppSettings, AISettings } from './schema';
import { DEFAULT_AI_SETTINGS } from '../services/aiProviderService';

export async function initializeDatabase(): Promise<void> {
  const settingsCount = await db.settings.count();
  if (settingsCount === 0) {
    const defaultSettings: AppSettings = {
      id: 'default',
      userName: 'User',
      theme: 'dark',
      accentColor: '#ffffff',
      weekStartDay: 1,
      productivityWeights: {
        habitWeight: 40,
        taskWeight: 30,
        focusWeight: 20,
        goalWeight: 10,
      },
      streakSkipRule: 'pause',
      streakFreezeEarned: 1,
      streakFreezeActiveUntil: null,
      consecutiveDays100Pct: 5,
      verificationSettings: {
        defaultIntervalMinutes: 30,
        gracePeriodMinutes: 2,
        verificationRequired: true,
        excludeUnverifiedFromProductivity: true,
      },
    };
    await db.settings.add(defaultSettings);
  }

  const aiSettingsCount = await db.aiSettings.count();
  if (aiSettingsCount === 0) {
    await db.aiSettings.add(DEFAULT_AI_SETTINGS);
  }
}

export async function resetAllDataToInitialState(): Promise<void> {
  await db.habits.clear();
  await db.habitLogs.clear();
  await db.tasks.clear();
  await db.subtasks.clear();
  await db.projects.clear();
  await db.goals.clear();
  await db.focusSessions.clear();
  await db.activeSessionState.clear();
  await db.journalEntries.clear();
  await db.dailyReviews.clear();
  await db.categories.clear();
  await db.tags.clear();
  await db.aiConversations.clear();
  await db.aiMessages.clear();
}
