import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, AISettings } from '../db/schema';
import { resetAllDataToInitialState } from '../db/seed';
import { getAISettings, saveAISettings, testAIConnection, detectAIProviderFromKey, maskApiKey } from '../services/aiProviderService';
import { Download, Upload, Trash2, Sparkles, Lock, ShieldAlert, KeyRound } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const settings = useLiveQuery(() => db.settings.get('default'));
  const aiSettingsLive = useLiveQuery(() => db.aiSettings.get('default'));

  const [userName, setUserName] = useState(settings?.userName || 'User');
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>(settings?.theme || 'dark');
  const [accentColor, setAccentColor] = useState<string>(settings?.accentColor || '#ffffff');

  // Master App Password State & Update Verification
  const [appPasswordInput, setAppPasswordInput] = useState(settings?.appPassword || '');
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [passwordUpdateError, setPasswordUpdateError] = useState('');
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [verifyPasswordPrompt, setVerifyPasswordPrompt] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [pendingAction, setPendingAction] = useState<'clear_db' | 'export_data' | null>(null);

  // Simplified AI Configuration: Local vs Cloud
  const [aiMode, setAiMode] = useState<'local' | 'cloud'>(aiSettingsLive?.mode || 'local');
  const [aiProvider, setAiProvider] = useState<AISettings['provider']>(aiSettingsLive?.provider || 'ollama');
  const [aiModel, setAiModel] = useState<string>(aiSettingsLive?.model || 'llama3.1');
  const [apiKeyInput, setApiKeyInput] = useState<string>(aiSettingsLive?.apiKey || '');
  const [customEndpoint, setCustomEndpoint] = useState<string>(aiSettingsLive?.endpoint || 'http://localhost:11434/v1/chat/completions');
  const [temperature, setTemperature] = useState<number>(aiSettingsLive?.temperature || 0.7);

  const [aiTone, setAiTone] = useState<AISettings['tone']>('analytical');
  const [behavioralFramework, setBehavioralFramework] = useState<string>(
    'Act as a precise, factual personal productivity copilot. Provide direct, evidence-based data interpretations.'
  );

  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string } | null>(null);
  const [localModelsList, setLocalModelsList] = useState<string[]>(['llama3.1', 'qwen2.5:3b-instruct', 'gemma2:2b']);

  // Sync Settings state on load (Fixes Settings Persistence Reset bug)
  useEffect(() => {
    if (settings) {
      setUserName(settings.userName || 'User');
      setTheme(settings.theme || 'dark');
      setAccentColor(settings.accentColor || '#ffffff');
      setAppPasswordInput(settings.appPassword || '');
    }
  }, [settings?.userName, settings?.theme, settings?.accentColor, settings?.appPassword]);

  useEffect(() => {
    getAISettings().then((res) => {
      setAiMode(res.mode || (res.provider === 'ollama' ? 'local' : 'cloud'));
      setAiProvider(res.provider || 'ollama');
      setAiModel(res.model || 'llama3.1');
      setApiKeyInput(res.apiKey || '');
      setCustomEndpoint(res.endpoint || 'http://localhost:11434/v1/chat/completions');
      setTemperature(res.temperature || 0.7);
      setAiTone(res.tone || 'analytical');
      setBehavioralFramework(res.behavioralFramework || '');
    });

    // Fetch local Ollama models dynamically
    fetch('http://localhost:11434/api/tags')
      .then((r) => r.json())
      .then((data) => {
        if (data && Array.isArray(data.models)) {
          const names = data.models.map((m: any) => m.name);
          if (names.length > 0) setLocalModelsList(names);
        }
      })
      .catch(() => {});
  }, [aiSettingsLive?.provider, aiSettingsLive?.model]);

  const handleApiKeyChange = (val: string) => {
    setApiKeyInput(val);
    if (val.trim()) {
      const detected = detectAIProviderFromKey(val);
      if (detected.provider !== 'custom') {
        setAiMode('cloud');
        setAiProvider(detected.provider as any);
        setAiModel(detected.suggestedModel);
      }
    }
  };

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
      theme,
      accentColor,
      appPassword: appPasswordInput,
      weekStartDay: 1,
      productivityWeights: { habitWeight: 40, taskWeight: 30, focusWeight: 20, goalWeight: 10 },
      streakSkipRule: 'pause',
      streakFreezeEarned: settings?.streakFreezeEarned || 0,
      streakFreezeActiveUntil: settings?.streakFreezeActiveUntil || null,
      consecutiveDays100Pct: settings?.consecutiveDays100Pct || 0,
    });

    const activeProvider = aiMode === 'local' ? 'ollama' : aiProvider;
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

    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.setProperty('--accent-primary', accentColor);
    setCurrentPasswordInput('');
    alert('Settings & User Profile saved successfully.');
  };

  const handleTestAIConnection = async () => {
    setTestResult(null);
    const activeProvider = aiMode === 'local' ? 'ollama' : aiProvider;
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
    setTestResult(res);
  };

  const handleTriggerProtectedAction = (action: 'clear_db' | 'export_data') => {
    setPendingAction(action);
    setVerifyPasswordPrompt('');
    setPasswordError('');
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
      const habitsData = await db.habits.toArray();
      const tasksData = await db.tasks.toArray();
      const exportJson = JSON.stringify({ habits: habitsData, tasks: tasksData }, null, 2);
      const blob = new Blob([exportJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `HabitOS_Backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    }
  };

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h2>Settings & AI Personalization</h2>
        <p className="subtitle">Streamlined Local vs. Cloud AI engine setup, master security, and profile preferences.</p>
      </div>

      {/* Streamlined AI Model Integration (Local vs Cloud) */}
      <div className="glass-card">
        <h3><Sparkles size={16} /> Streamlined AI Configuration (Local vs. Cloud)</h3>
        
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', marginBottom: '1rem' }}>
          <button
            type="button"
            className={`btn ${aiMode === 'local' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => {
              setAiMode('local');
              setAiProvider('ollama');
              setCustomEndpoint('http://localhost:11434/v1/chat/completions');
            }}
          >
            🏠 Local Model (Ollama)
          </button>
          <button
            type="button"
            className={`btn ${aiMode === 'cloud' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setAiMode('cloud')}
          >
            ☁️ Cloud Model (API Key)
          </button>
        </div>

        {aiMode === 'local' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Select Installed Local Ollama Model</label>
              <select
                className="form-select"
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value)}
              >
                {localModelsList.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Local Server Endpoint</label>
              <input
                type="text"
                className="form-input"
                value="http://localhost:11434/v1/chat/completions"
                disabled
              />
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Cloud AI Provider</label>
              <select
                className="form-select"
                value={aiProvider}
                onChange={(e) => {
                  const prov = e.target.value as any;
                  setAiProvider(prov);
                  if (prov === 'nvidia') {
                    setCustomEndpoint('https://integrate.api.nvidia.com/v1/chat/completions');
                    setAiModel('meta/llama-3.1-70b-instruct');
                  } else if (prov === 'openai') {
                    setCustomEndpoint('https://api.openai.com/v1/chat/completions');
                    setAiModel('gpt-4o-mini');
                  } else if (prov === 'anthropic') {
                    setAiModel('claude-3-5-sonnet-20241022');
                  } else if (prov === 'gemini') {
                    setAiModel('gemini-1.5-flash');
                  } else if (prov === 'openrouter') {
                    setCustomEndpoint('https://openrouter.ai/api/v1/chat/completions');
                    setAiModel('meta-llama/llama-3.1-70b-instruct');
                  }
                }}
              >
                <option value="openai">OpenAI (GPT-4o / GPT-4o-mini)</option>
                <option value="anthropic">Anthropic Claude (Claude 3.5 Sonnet)</option>
                <option value="gemini">Google Gemini (Gemini 1.5 Flash)</option>
                <option value="nvidia">NVIDIA NIM (Open-Source Llama 3.1 70B)</option>
                <option value="openrouter">OpenRouter (Cloud Open-Source Models)</option>
                <option value="custom">Custom OpenAI-Compatible Provider</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">API Key {apiKeyInput && <span className="subtitle">({maskApiKey(apiKeyInput)})</span>}</label>
              <input
                type="password"
                className="form-input"
                value={apiKeyInput}
                onChange={(e) => handleApiKeyChange(e.target.value)}
                placeholder="Paste API key (sk-..., nvapi-..., AIza...)"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Model Identifier</label>
              <input
                type="text"
                className="form-input"
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value)}
                placeholder="e.g. gpt-4o-mini, claude-3-5-sonnet..."
              />
            </div>

            <div className="form-group">
              <label className="form-label">API Endpoint URL</label>
              <input
                type="text"
                className="form-input"
                value={customEndpoint}
                onChange={(e) => setCustomEndpoint(e.target.value)}
              />
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', alignItems: 'center' }}>
          <button type="button" className="btn btn-secondary" onClick={handleTestAIConnection}>
            Test AI Connection
          </button>
          {testResult && (
            <span style={{ fontSize: '0.8rem', color: testResult.success ? 'var(--text-primary)' : 'var(--danger)' }}>
              {testResult.message}
            </span>
          )}
        </div>
      </div>

      {/* Password Security & Profile Preferences */}
      <div className="glass-card">
        <h3><KeyRound size={16} /> User Profile & Master Password Security</h3>
        <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">User Profile Name</label>
              <input type="text" className="form-input" value={userName} onChange={(e) => setUserName(e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">New Master Security Password</label>
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
            <div className="form-group" style={{ maxWidth: '400px' }}>
              <label className="form-label" style={{ color: 'var(--danger)' }}>Confirm Current Password (Required to update password)</label>
              <input
                type="password"
                className="form-input"
                placeholder="Enter current password..."
                value={currentPasswordInput}
                onChange={(e) => setCurrentPasswordInput(e.target.value)}
              />
            </div>
          )}

          {passwordUpdateError && <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{passwordUpdateError}</span>}

          <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
            Save User Profile & Settings
          </button>
        </form>
      </div>

      {/* Protected Database Administration */}
      <div className="glass-card" style={{ borderColor: 'rgba(239, 68, 68, 0.4)' }}>
        <h3 style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldAlert size={18} /> Password-Protected Database Operations
        </h3>
        <p className="subtitle" style={{ marginTop: '0.25rem' }}>
          Database extraction and total deletion tasks are protected by master password verification.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
          <button className="btn btn-secondary" onClick={() => handleTriggerProtectedAction('export_data')}>
            <Download size={14} /> Extract Data Backup (JSON)
          </button>
          <button className="btn btn-danger" onClick={() => handleTriggerProtectedAction('clear_db')}>
            <Trash2 size={14} /> Clear Entire Database
          </button>
        </div>
      </div>

      {/* Password Verification Modal */}
      {isPasswordModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '420px', background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--danger)' }}>
              <Lock size={36} />
            </div>
            <h3>Master Password Verification Required</h3>
            <p className="subtitle">
              Enter your master security password to execute: <strong>{pendingAction === 'clear_db' ? 'Clear Entire Database' : 'Extract Data Backup'}</strong>.
            </p>

            <input
              type="password"
              className="form-input"
              placeholder="Enter master password..."
              value={verifyPasswordPrompt}
              onChange={(e) => setVerifyPasswordPrompt(e.target.value)}
            />

            {passwordError && <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{passwordError}</span>}

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
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
