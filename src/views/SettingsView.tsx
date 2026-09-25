import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, ForestTheme } from '../db/schema';
import { resetAllDataToInitialState } from '../db/seed';
import { getAISettings, saveAISettings, testAIConnection, maskApiKey } from '../services/aiProviderService';
import { Download, Upload, Trash2, Sparkles, Lock, ShieldAlert, KeyRound, Eye, EyeOff, CheckCircle2, AlertCircle, Palette } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const settings = useLiveQuery(() => db.settings.get('default'));
  const aiSettingsLive = useLiveQuery(() => db.aiSettings.get('default'));

  const [userName, setUserName] = useState(settings?.userName || 'User');
  const [environmentTheme, setEnvironmentTheme] = useState<ForestTheme>(settings?.environmentTheme || 'rain_forest');
  const [animationEnabled, setAnimationEnabled] = useState<boolean>(settings?.animationEnabled !== false);
  const [ambientMotionEnabled, setAmbientMotionEnabled] = useState<boolean>(settings?.ambientMotionEnabled !== false);
  const [environmentIntensity, setEnvironmentIntensity] = useState<number>(settings?.environmentIntensity ?? 85);
  const [motionSpeed, setMotionSpeed] = useState<number>(settings?.motionSpeed ?? 50);
  const [mistRainDensity, setMistRainDensity] = useState<number>(settings?.mistRainDensity ?? 60);

  // Master App Password State & Update Verification
  const [appPasswordInput, setAppPasswordInput] = useState(settings?.appPassword || '');
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [passwordUpdateError, setPasswordUpdateError] = useState('');
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [verifyPasswordPrompt, setVerifyPasswordPrompt] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [pendingAction, setPendingAction] = useState<'clear_db' | 'export_data' | 'import_data' | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Vendor-Agnostic AI Configuration: Local (Ollama) vs Cloud (Generic API)
  const [aiMode, setAiMode] = useState<'local' | 'cloud'>(aiSettingsLive?.mode || 'local');
  const [aiModel, setAiModel] = useState<string>(aiSettingsLive?.model || 'llama3.1');
  const [apiKeyInput, setApiKeyInput] = useState<string>(aiSettingsLive?.apiKey || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [customEndpoint, setCustomEndpoint] = useState<string>(aiSettingsLive?.endpoint || 'https://api.openai.com/v1');
  const [temperature, setTemperature] = useState<number>(aiSettingsLive?.temperature || 0.7);

  const [aiTone, setAiTone] = useState<'analytical' | 'motivational' | 'concise' | 'strict' | 'coaching' | 'custom'>('analytical');
  const [behavioralFramework, setBehavioralFramework] = useState<string>(
    'Act as a precise, factual personal productivity copilot. Provide direct, evidence-based data interpretations.'
  );

  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string } | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [localModelsList, setLocalModelsList] = useState<string[]>(['llama3.1', 'qwen2.5:3b-instruct', 'gemma2:2b', 'mistral']);

  // Sync Settings state on load
  useEffect(() => {
    if (settings) {
      setUserName(settings.userName || 'User');
      setEnvironmentTheme(settings.environmentTheme || 'rain_forest');
      setAnimationEnabled(settings.animationEnabled !== false);
      setAmbientMotionEnabled(settings.ambientMotionEnabled !== false);
      setEnvironmentIntensity(settings.environmentIntensity ?? 85);
      setMotionSpeed(settings.motionSpeed ?? 50);
      setMistRainDensity(settings.mistRainDensity ?? 60);
      setAppPasswordInput(settings.appPassword || '');
    }
  }, [
    settings?.userName,
    settings?.environmentTheme,
    settings?.animationEnabled,
    settings?.ambientMotionEnabled,
    settings?.environmentIntensity,
    settings?.motionSpeed,
    settings?.mistRainDensity,
    settings?.appPassword,
  ]);

  useEffect(() => {
    getAISettings().then((res) => {
      setAiMode(res.mode || 'local');
      setAiModel(res.model || (res.mode === 'cloud' ? 'gpt-4o-mini' : 'llama3.1'));
      setApiKeyInput(res.apiKey || '');
      setCustomEndpoint(res.endpoint || (res.mode === 'cloud' ? 'https://api.openai.com/v1' : 'http://localhost:11434/v1/chat/completions'));
      setTemperature(res.temperature || 0.7);
      setAiTone(res.tone || 'analytical');
      setBehavioralFramework(res.behavioralFramework || '');
    });

    // Fetch local Ollama models dynamically if running
    fetch('http://localhost:11434/api/tags')
      .then((r) => r.json())
      .then((data) => {
        if (data && Array.isArray(data.models)) {
          const names = data.models.map((m: any) => m.name);
          if (names.length > 0) setLocalModelsList(names);
        }
      })
      .catch(() => {});
  }, [aiSettingsLive?.mode, aiSettingsLive?.model]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordUpdateError('');

    // Require current password when changing password
    const existingPassword = settings?.appPassword;
    if (existingPassword && appPasswordInput !== existingPassword) {
      if (!currentPasswordInput || currentPasswordInput !== existingPassword) {
        setPasswordUpdateError('Current password is required to save a new password update.');
        return;
      }
    }

    await db.settings.put({
      id: 'default',
      userName,
      theme: 'dark',
      accentColor: '#ffffff',
      environmentTheme,
      animationEnabled,
      ambientMotionEnabled,
      environmentIntensity,
      motionSpeed,
      mistRainDensity,
      appPassword: appPasswordInput,
      weekStartDay: 1,
      productivityWeights: { habitWeight: 40, taskWeight: 30, focusWeight: 20, goalWeight: 10 },
      streakSkipRule: 'pause',
      streakFreezeEarned: settings?.streakFreezeEarned || 0,
      streakFreezeActiveUntil: settings?.streakFreezeActiveUntil || null,
      consecutiveDays100Pct: settings?.consecutiveDays100Pct || 0,
    });

    const activeProvider = aiMode === 'local' ? 'ollama' : 'cloud';
    await saveAISettings({
      mode: aiMode,
      provider: activeProvider,
      model: aiModel,
      apiKey: apiKeyInput,
      endpoint: aiMode === 'local' ? 'http://localhost:11434/v1/chat/completions' : customEndpoint,
      temperature,
      tone: aiTone,
      behavioralFramework,
    });

    document.documentElement.setAttribute('data-theme', environmentTheme);
    setCurrentPasswordInput('');
    alert('Settings, Environmental Theme & AI Provider configuration saved successfully.');
  };

  const handleTestAIConnection = async () => {
    setTestResult(null);
    setIsTestingConnection(true);
    const activeProvider = aiMode === 'local' ? 'ollama' : 'cloud';

    const res = await testAIConnection({
      id: 'default',
      mode: aiMode,
      provider: activeProvider,
      model: aiModel,
      apiKey: apiKeyInput,
      endpoint: aiMode === 'local' ? 'http://localhost:11434/v1/chat/completions' : customEndpoint,
      temperature,
      tone: aiTone,
      behavioralFramework,
      privacy: { allowHabitData: true, allowTaskData: true, allowProjectData: true, allowGoalData: true, allowJournalData: false, allowHistoricalData: true },
      enableStreaming: true,
    });

    setIsTestingConnection(false);
    setTestResult(res);
  };

  const handleTriggerProtectedAction = (action: 'clear_db' | 'export_data' | 'import_data') => {
    setPendingAction(action);
    setVerifyPasswordPrompt('');
    setPasswordError('');

    const masterPassword = settings?.appPassword || appPasswordInput;
    if (!masterPassword && action === 'import_data') {
      fileInputRef.current?.click();
      return;
    }

    setIsPasswordModalOpen(true);
  };

  const handleVerifyPasswordAndExecute = async () => {
    const masterPassword = settings?.appPassword || appPasswordInput;

    if (masterPassword && verifyPasswordPrompt !== masterPassword) {
      setPasswordError('Invalid Master Password! Verification failed.');
      return;
    }

    setIsPasswordModalOpen(false);

    if (pendingAction === 'clear_db') {
      await resetAllDataToInitialState();
      alert('Database cleared successfully! All tables reset.');
      window.location.reload();
    } else if (pendingAction === 'export_data') {
      const fullBackup = {
        version: 1,
        app: 'Habit OS',
        exportedAt: new Date().toISOString(),
        habits: await db.habits.toArray(),
        habitLogs: await db.habitLogs.toArray(),
        tasks: await db.tasks.toArray(),
        subtasks: await db.subtasks.toArray(),
        projects: await db.projects.toArray(),
        goals: await db.goals.toArray(),
        journalEntries: await db.journalEntries.toArray(),
        dailyReviews: await db.dailyReviews.toArray(),
        categories: await db.categories.toArray(),
        tags: await db.tags.toArray(),
        settings: await db.settings.toArray(),
        aiConversations: await db.aiConversations.toArray(),
        aiMessages: await db.aiMessages.toArray(),
        aiSettings: await db.aiSettings.toArray(),
      };
      const exportJson = JSON.stringify(fullBackup, null, 2);
      const blob = new Blob([exportJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `HabitOS_Full_Backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (pendingAction === 'import_data') {
      fileInputRef.current?.click();
    }
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        if (!content) {
          alert('Failed to read backup file: File is empty.');
          return;
        }

        const data = JSON.parse(content);
        if (!data || typeof data !== 'object') {
          alert('Invalid backup file format: Root JSON must be an object.');
          return;
        }

        const knownKeys = ['habits', 'habitLogs', 'tasks', 'subtasks', 'projects', 'goals', 'journalEntries', 'dailyReviews', 'categories', 'tags', 'settings', 'aiConversations', 'aiMessages', 'aiSettings'];
        const hasValidTable = knownKeys.some((k) => Array.isArray(data[k]));

        if (!hasValidTable) {
          alert('Invalid backup file format: No recognized Habit OS database tables found in the JSON file.');
          return;
        }

        const confirmRestore = window.confirm(
          'Restoring backup will replace existing database records. Are you sure you want to proceed?'
        );
        if (!confirmRestore) return;

        await db.transaction('rw', db.tables, async () => {
          if (Array.isArray(data.habits)) {
            await db.habits.clear();
            if (data.habits.length > 0) await db.habits.bulkPut(data.habits);
          }
          if (Array.isArray(data.habitLogs)) {
            await db.habitLogs.clear();
            if (data.habitLogs.length > 0) await db.habitLogs.bulkPut(data.habitLogs);
          }
          if (Array.isArray(data.tasks)) {
            await db.tasks.clear();
            if (data.tasks.length > 0) await db.tasks.bulkPut(data.tasks);
          }
          if (Array.isArray(data.subtasks)) {
            await db.subtasks.clear();
            if (data.subtasks.length > 0) await db.subtasks.bulkPut(data.subtasks);
          }
          if (Array.isArray(data.projects)) {
            await db.projects.clear();
            if (data.projects.length > 0) await db.projects.bulkPut(data.projects);
          }
          if (Array.isArray(data.goals)) {
            await db.goals.clear();
            if (data.goals.length > 0) await db.goals.bulkPut(data.goals);
          }
          if (Array.isArray(data.journalEntries)) {
            await db.journalEntries.clear();
            if (data.journalEntries.length > 0) await db.journalEntries.bulkPut(data.journalEntries);
          }
          if (Array.isArray(data.dailyReviews)) {
            await db.dailyReviews.clear();
            if (data.dailyReviews.length > 0) await db.dailyReviews.bulkPut(data.dailyReviews);
          }
          if (Array.isArray(data.categories)) {
            await db.categories.clear();
            if (data.categories.length > 0) await db.categories.bulkPut(data.categories);
          }
          if (Array.isArray(data.tags)) {
            await db.tags.clear();
            if (data.tags.length > 0) await db.tags.bulkPut(data.tags);
          }
          if (Array.isArray(data.settings)) {
            await db.settings.clear();
            if (data.settings.length > 0) await db.settings.bulkPut(data.settings);
          }
          if (Array.isArray(data.aiConversations)) {
            await db.aiConversations.clear();
            if (data.aiConversations.length > 0) await db.aiConversations.bulkPut(data.aiConversations);
          }
          if (Array.isArray(data.aiMessages)) {
            await db.aiMessages.clear();
            if (data.aiMessages.length > 0) await db.aiMessages.bulkPut(data.aiMessages);
          }
          if (Array.isArray(data.aiSettings)) {
            await db.aiSettings.clear();
            if (data.aiSettings.length > 0) await db.aiSettings.bulkPut(data.aiSettings);
          }
        });

        alert('Backup data restored successfully! The application will now reload to apply all restored data.');
        window.location.reload();
      } catch (err: any) {
        console.error('Import error:', err);
        alert(`Failed to import backup data: ${err?.message || 'Invalid JSON syntax'}`);
      } finally {
        if (event.target) event.target.value = '';
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="view-container">
      <div className="view-header">
        <div>
          <h1 className="view-header-title">Settings & Forest Customization</h1>
          <p className="view-header-subtitle">
            Personalize background textures, color palettes, profile security, and AI models.
          </p>
        </div>
      </div>

      {/* Forest Environmental Appearance Settings */}
      <div className="liquid-panel flip-card-item">
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <Palette size={20} style={{ color: 'var(--accent-secondary)' }} /> Appearance & Atmosphere Engine
        </h3>

        {/* Environment Selection */}
        <div style={{ marginBottom: '1.75rem' }}>
          <label className="form-label" style={{ marginBottom: '0.75rem', display: 'block', fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
            Environment
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
            {/* Rain Forest Card */}
            <button
              type="button"
              onClick={async () => {
                setEnvironmentTheme('rain_forest');
                await db.settings.update('default', { environmentTheme: 'rain_forest' });
                document.documentElement.setAttribute('data-theme', 'rain_forest');
              }}
              style={{
                padding: '1.25rem',
                borderRadius: 'var(--radius-md)',
                background: environmentTheme === 'rain_forest' ? 'rgba(22, 58, 41, 0.85)' : 'rgba(11, 38, 27, 0.45)',
                border: environmentTheme === 'rain_forest' ? '2px solid #2F8F5B' : '1px solid var(--border-color)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 300ms cubic-bezier(0.22, 1, 0.36, 1)',
                boxShadow: environmentTheme === 'rain_forest' ? '0 0 20px rgba(47, 143, 91, 0.25)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#2F8F5B', boxShadow: '0 0 10px rgba(87, 185, 120, 0.5)' }} />
                  <strong style={{ fontSize: '1.05rem', color: '#E8F5EC' }}>Rain Forest</strong>
                </div>
                <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '12px', background: 'rgba(87, 185, 120, 0.15)', color: '#57B978' }}>
                  Deep, Lush & Living
                </span>
              </div>
              <p style={{ fontSize: '0.825rem', color: '#A9C7B3', margin: 0, lineHeight: 1.45 }}>
                Dense tropical canopy after rain. Deep emerald floor, wet leaves, subtle rain drops, and moving light rays.
              </p>
            </button>

            {/* Foggy Mist Forest Card */}
            <button
              type="button"
              onClick={async () => {
                setEnvironmentTheme('foggy_mist');
                await db.settings.update('default', { environmentTheme: 'foggy_mist' });
                document.documentElement.setAttribute('data-theme', 'foggy_mist');
              }}
              style={{
                padding: '1.25rem',
                borderRadius: 'var(--radius-md)',
                background: environmentTheme === 'foggy_mist' ? 'rgba(32, 45, 41, 0.85)' : 'rgba(24, 35, 32, 0.45)',
                border: environmentTheme === 'foggy_mist' ? '2px solid #536F61' : '1px solid var(--border-color)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 300ms cubic-bezier(0.22, 1, 0.36, 1)',
                boxShadow: environmentTheme === 'foggy_mist' ? '0 0 20px rgba(83, 111, 97, 0.25)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#536F61', boxShadow: '0 0 10px rgba(195, 209, 202, 0.4)' }} />
                  <strong style={{ fontSize: '1.05rem', color: '#E3EBE7' }}>Foggy Mist Forest</strong>
                </div>
                <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '12px', background: 'rgba(168, 184, 177, 0.15)', color: '#A8B8B1' }}>
                  Quiet, Cold & Atmospheric
                </span>
              </div>
              <p style={{ fontSize: '0.825rem', color: '#AABAB3', margin: 0, lineHeight: 1.45 }}>
                Early morning mountain woods with heavy mist, cool desaturated tones, and slow-moving atmospheric moisture.
              </p>
            </button>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '1.5rem 0' }} />

        {/* Atmosphere Controls */}
        <div style={{ marginBottom: '1.75rem' }}>
          <label className="form-label" style={{ marginBottom: '0.75rem', display: 'block', fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
            Atmosphere
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.85rem 1.15rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--surface-color)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div>
                <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-primary)' }}>Animation</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Rain fall & fog motion</span>
              </div>
              <button
                type="button"
                className={`btn ${animationEnabled ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}
                onClick={() => setAnimationEnabled(!animationEnabled)}
              >
                {animationEnabled ? 'ON' : 'OFF'}
              </button>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.85rem 1.15rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--surface-color)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div>
                <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-primary)' }}>Ambient Motion</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Foliage & sunlight drift</span>
              </div>
              <button
                type="button"
                className={`btn ${ambientMotionEnabled ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}
                onClick={() => setAmbientMotionEnabled(!ambientMotionEnabled)}
              >
                {ambientMotionEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '1.5rem 0' }} />

        {/* Intensity Sliders */}
        <div>
          <label className="form-label" style={{ marginBottom: '0.75rem', display: 'block', fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
            Intensity
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-primary)' }}>Environment Opacity</span>
                <span style={{ color: 'var(--text-muted)' }}>{environmentIntensity}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                value={environmentIntensity}
                onChange={(e) => setEnvironmentIntensity(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-primary)' }}>Motion Speed</span>
                <span style={{ color: 'var(--text-muted)' }}>{motionSpeed}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={motionSpeed}
                onChange={(e) => setMotionSpeed(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-primary)' }}>Mist / Rain Density</span>
                <span style={{ color: 'var(--text-muted)' }}>{mistRainDensity}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={mistRainDensity}
                onChange={(e) => setMistRainDensity(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* AI Model Configuration (Local vs Cloud Provider) */}
      <div className="liquid-panel flip-card-item">
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={20} style={{ color: '#8FAF82' }} /> AI Engine Setup
        </h3>
        
        {/* Mode Selector */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.25rem', marginBottom: '1.5rem' }}>
          <button
            type="button"
            className={`btn ${aiMode === 'local' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, padding: '0.85rem', fontSize: '0.95rem' }}
            onClick={() => {
              setAiMode('local');
              setCustomEndpoint('http://localhost:11434/v1/chat/completions');
              setAiModel('llama3.1');
            }}
          >
            🏠 Local Model (Ollama)
          </button>
          <button
            type="button"
            className={`btn ${aiMode === 'cloud' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, padding: '0.85rem', fontSize: '0.95rem' }}
            onClick={() => {
              setAiMode('cloud');
              if (!customEndpoint || customEndpoint.includes('localhost')) {
                setCustomEndpoint('https://api.openai.com/v1');
              }
              if (aiModel === 'llama3.1') {
                setAiModel('gpt-4o-mini');
              }
            }}
          >
            ☁️ Cloud Model (Generic API)
          </button>
        </div>

        {/* Local Model (Ollama) Panel */}
        {aiMode === 'local' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>Model Name</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  className="form-input"
                  style={{ flex: 1 }}
                  placeholder="e.g. llama3.1, qwen2.5, mistral..."
                  value={aiModel}
                  onChange={(e) => setAiModel(e.target.value)}
                />
                {localModelsList.length > 0 && (
                  <select
                    className="form-select"
                    style={{ width: '160px' }}
                    value={localModelsList.includes(aiModel) ? aiModel : ''}
                    onChange={(e) => {
                      if (e.target.value) setAiModel(e.target.value);
                    }}
                  >
                    <option value="">Select Local...</option>
                    {localModelsList.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>Base URL / Endpoint</label>
              <input
                type="text"
                className="form-input"
                value={customEndpoint}
                onChange={(e) => setCustomEndpoint(e.target.value)}
                placeholder="http://localhost:11434/v1/chat/completions"
              />
            </div>
          </div>
        ) : (
          /* Cloud Model Vendor-Agnostic Interface (3 Required Fields: API Key, Base URL, Model Name) */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>
                API Key * {apiKeyInput && <span className="subtitle">({maskApiKey(apiKeyInput)})</span>}
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showApiKey ? 'text' : 'password'}
                  className="form-input"
                  style={{ flex: 1, paddingRight: '2.5rem' }}
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="Enter your API Key..."
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  style={{ position: 'absolute', right: '0.75rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>Base URL *</label>
                <input
                  type="text"
                  className="form-input"
                  value={customEndpoint}
                  onChange={(e) => setCustomEndpoint(e.target.value)}
                  placeholder="e.g. https://api.openai.com/v1 or https://openrouter.ai/api/v1"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>Model Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={aiModel}
                  onChange={(e) => setAiModel(e.target.value)}
                  placeholder="e.g. gpt-4o-mini, claude-3-5-sonnet, deepseek-chat, llama-3.1-70b"
                  required
                />
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleTestAIConnection}
            disabled={isTestingConnection}
            style={{ padding: '0.65rem 1.25rem' }}
          >
            {isTestingConnection ? 'Testing Connection...' : 'Test AI Connection'}
          </button>
          {testResult && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', color: testResult.success ? '#527653' : 'var(--danger)', fontWeight: 600 }}>
              {testResult.success ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span>{testResult.message}</span>
            </div>
          )}
        </div>
      </div>

      {/* Password Security & Profile Preferences */}
      <div className="liquid-panel flip-card-item">
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <KeyRound size={20} /> User Profile & Master Password Security
        </h3>
        <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>User Profile Name</label>
              <input type="text" className="form-input" value={userName} onChange={(e) => setUserName(e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>New Master Security Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Enter new master password..."
                value={appPasswordInput}
                onChange={(e) => setAppPasswordInput(e.target.value)}
              />
            </div>
          </div>

          {settings?.appPassword && appPasswordInput !== settings.appPassword && (
            <div className="form-group" style={{ maxWidth: '440px' }}>
              <label className="form-label" style={{ color: 'var(--danger)', fontWeight: 600 }}>Confirm Current Password (Required to update password)</label>
              <input
                type="password"
                className="form-input"
                placeholder="Enter current password..."
                value={currentPasswordInput}
                onChange={(e) => setCurrentPasswordInput(e.target.value)}
              />
            </div>
          )}

          {passwordUpdateError && <span style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{passwordUpdateError}</span>}

          <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', padding: '0.75rem 1.5rem', fontSize: '0.95rem' }}>
            Save Profile & Forest Preferences
          </button>
        </form>
      </div>

      {/* Protected Database Administration */}
      <div className="liquid-panel flip-card-item" style={{ borderColor: 'rgba(239, 68, 68, 0.4)' }}>
        <h3 style={{ color: 'var(--danger)', fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldAlert size={20} /> Password-Protected Database Operations
        </h3>
        <p className="subtitle" style={{ marginTop: '0.35rem', fontSize: '0.9rem' }}>
          Database extraction and total deletion tasks are protected by master password verification.
        </p>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => handleTriggerProtectedAction('export_data')} style={{ padding: '0.65rem 1.25rem' }}>
            <Download size={16} /> Extract Data Backup (JSON)
          </button>
          <button className="btn btn-secondary" onClick={() => handleTriggerProtectedAction('import_data')} style={{ padding: '0.65rem 1.25rem' }}>
            <Upload size={16} /> Restore Data Backup (JSON)
          </button>
          <button className="btn btn-danger" onClick={() => handleTriggerProtectedAction('clear_db')} style={{ padding: '0.65rem 1.25rem' }}>
            <Trash2 size={16} /> Clear Entire Database
          </button>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileImport}
          accept=".json,application/json"
          style={{ display: 'none' }}
        />
      </div>

      {/* Password Verification Modal */}
      {isPasswordModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '440px', background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'center', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--danger)' }}>
              <Lock size={42} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Master Password Verification Required</h3>
            <p className="subtitle" style={{ fontSize: '0.9rem' }}>
              Enter your master security password to execute:{' '}
              <strong>
                {pendingAction === 'clear_db'
                  ? 'Clear Entire Database'
                  : pendingAction === 'export_data'
                  ? 'Extract Data Backup'
                  : 'Restore Data Backup'}
              </strong>.
            </p>

            <input
              type="password"
              className="form-input"
              placeholder="Enter master password..."
              value={verifyPasswordPrompt}
              onChange={(e) => setVerifyPasswordPrompt(e.target.value)}
            />

            {passwordError && <span style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{passwordError}</span>}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setIsPasswordModalOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleVerifyPasswordAndExecute}>
                Verify & Execute
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


