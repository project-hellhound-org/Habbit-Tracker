import { db, AppSettings, Category, Tag } from './schema';
import { DEFAULT_AI_SETTINGS } from '../services/aiProviderService';

export async function initializeDatabase() {
  try {
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
        verificationSettings: {
          defaultIntervalMinutes: 30,
          gracePeriodMinutes: 2,
          verificationRequired: true,
          excludeUnverifiedFromProductivity: true,
        },
      };
      await db.settings.add(defaultSettings);

      const categories: Category[] = [
        { id: 'cat-health', name: 'Health & Fitness', color: '#94a3b8', icon: 'Heart' },
        { id: 'cat-cyber', name: 'Cybersecurity & Tech', color: '#ffffff', icon: 'Shield' },
        { id: 'cat-learning', name: 'Learning & Growth', color: '#cbd5e1', icon: 'BookOpen' },
        { id: 'cat-work', name: 'Work & Projects', color: '#64748b', icon: 'Briefcase' },
        { id: 'cat-personal', name: 'Personal & Mindset', color: '#475569', icon: 'User' },
      ];
      await db.categories.bulkAdd(categories);

      const tags: Tag[] = [
        { id: 'tag-urgent', name: 'urgent', color: '#ef4444' },
        { id: 'tag-study', name: 'study', color: '#94a3b8' },
        { id: 'tag-code', name: 'development', color: '#ffffff' },
        { id: 'tag-lab', name: 'homelab', color: '#cbd5e1' },
      ];
      await db.tags.bulkAdd(tags);
    }

    const convCount = await db.aiConversations.count();
    if (convCount === 0) {
      await db.aiConversations.add({
        id: 'default-conv',
        title: 'Productivity Analysis',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    const aiSettings = await db.aiSettings.get('default');
    if (!aiSettings) {
      await db.aiSettings.add(DEFAULT_AI_SETTINGS);
    }
  } catch (err) {
    console.error('Error initializing database tables:', err);
  }
}

export async function resetAllDataToInitialState() {
  await db.transaction('rw', db.tables, async () => {
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
    await db.aiConversations.clear();
    await db.aiMessages.clear();

    await db.aiConversations.add({
      id: 'default-conv',
      title: 'Productivity Analysis',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });
}
