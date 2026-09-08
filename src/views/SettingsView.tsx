import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, AISettings } from '../db/schema';
import { resetAllDataToInitialState } from '../db/seed';
import { getAISettings, saveAISettings, testAIConnection, detectAIProviderFromKey, maskApiKey } from '../services/aiProviderService';
import { Download, Upload, Trash2, Sparkles, Lock, ShieldAlert, KeyRound } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const settings = useLiveQuery(() => db.settings.get('default'));
  const aiSettingsLive = useLiveQuery(() => db.aiSettings.get('default'));

  // Reactive State Persistent Bindings
  const [userName, setUserName] = useState('User');
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark');
  const [accentColor, setAccentColor] = useState<string>('#ffffff');

  // Master App Password State & Authentication Logic
  const [appPasswordInput, setAppPasswordInput] = useState('');
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [passwordSaveError, setPasswordSaveError] = useState('');
  
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [verifyPasswordPrompt, setVerifyPasswordPrompt] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [pendingAction, setPendingAction] = useState<'clear_db' | 'export_data' | null>(null);

  // Simplified AI Configuration (Local vs Cloud Mode)
  const [aiMode, setAiMode] = useState<'local' | 'cloud'>('local');
  const [aiProvider, setAiProvider] = useState<AISettings['provider']>('ollama');
  const [aiModel, setAiModel] = useState<string>('llama3.1');
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [customEndpoint, setCustomEndpoint] = useState<string>('');
  const [temperature, setTemperature] = useState<number>(0.7);

  const [aiTone, setAiTone] = useState<AISettings['tone']>('analytical');
  const [behavioralFramework, setBehavioralFramework] = useState<string>(
    'Act as a precise, factual personal productivity copilot. Provide direct, evidence-based data interpretations.'
  );

  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string } | null>(null);

  // Bind settings reactively to prevent reset on tab navigation
  useEffect(() => {
    if (settings) {
      setUserName(settings.userName || 'User');
      setTheme(settings.theme || 'dark');
      setAccentColor(settings.accentColor || '#ffffff');
      setAppPasswordInput(settings.appPassword || '');
    }
  }, [settings]);

  useEffect(() => {
    getAISettings().then((res) => {
      setAiProvider(res.provider);
      setAiModel(res.model);
      setApiKeyInput(res.apiKey || '');
      setCustomEndpoint(res.endpoint || '');
      setTemperature(res.temperature);
      setAiTone(res.tone || 'analytical');
      setBehavioralFramework(res.behavioralFramework || '');
      setAiMode(res.provider === 'ollama' || res.provider === 'builtin' ? 'local' : 'cloud');
    });
  }, [aiSettingsLive?.provider]);

  const handleApiKeyChange = (val: string) => {
    setApiKeyInput(val);
    if (val.trim()) {
      const detected = detectAIProviderFromKey(val);
      setAiProvider(detected.provider as any);
      setAiModel(detected.suggestedModel);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSaveError('');

    // Password Update Logic Authentication
    const existingPassword = settings?.appPassword;
    if (existingPassword && appPasswordInput !== existingPassword) {
      if (!currentPasswordInput || currentPasswordInput !== existingPassword) {
        setPasswordSaveError('Current password verification failed. Password update denied.');
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

    const targetProvider = aiMode === 'local' ? 'ollama' : aiProvider;
    const targetEndpoint = aiMode === 'local' ? 'http://localhost:11434/v1/chat/completions' : customEndpoint;

    await saveAISettings({
      provider: targetProvider,
      model: aiModel,
      apiKey: apiKeyInput,
      endpoint: targetEndpoint,
      temperature,
      tone: aiTone,
      behavioralFramework,
    });

    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.setProperty('--accent-primary', accentColor);
    setCurrentPasswordInput('');
    alert('Settings & User Credentials saved successfully.');
  };

  const handleTestAIConnection = async () => {
    setTestResult(null);
    const targetProvider = aiMode === 'local' ? 'ollama' : aiProvider;
    const targetEndpoint = aiMode === 'local' ? 'http://localhost:11434/v1/chat/completions' : customEndpoint;

    const res = await testAIConnection({
      id: 'default',
      provider: targetProvider,
      model: aiModel,
      apiKey: apiKeyInput,
      endpoint: targetEndpoint,
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
        <p className="subtitle">Configure Ollama local AI, master password security, cloud LLM credentials, and database operations.</p>
      </div>

      {/* AI Provider Credentials Box */}
      <div className="glass-card">
        <h3><Sparkles size={16} /> AI Engine & API Configuration</h3>
        <p className="subtitle">Choose between running open-source local LLMs via Ollama or connecting cloud AI models.</p>

        {/* 2-Option Toggle: Local Model vs Cloud Model */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', marginBottom: '1rem' }}>
          <button
            type="button"
            className={`btn ${aiMode === 'local' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => {
              setAiMode('local');
              setAiProvider('ollama');
              setAiModel('llama3.1');
            }}
          >
            💻 Local Model (Ollama)
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
              <label className="form-label">Local Model Selector</label>
              <select
                className="form-select"
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value)}
              >
                <option value="llama3.1">Meta Llama 3.1 (Default)</option>
                <option value="qwen2.5:3b">Qwen 2.5 (3B Instruct)</option>
                <option value="gemma2:2b">Google Gemma 2 (2B)</option>
                <option value="mistral">Mistral 7B</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Local Service Endpoint</label>
              <input
                type="text"
                className="form-input"
                disabled
                value="http://localhost:11434/v1/chat/completions"
              />
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">API Key {apiKeyInput && <span className="subtitle">({maskApiKey(apiKeyInput)})</span>}</label>
              <input
                type="password"
                className="form-input"
                value={apiKeyInput}
                onChange={(e) => handleApiKeyChange(e.target.value)}
                placeholder="Paste sk-..., nvapi-..., AIza..., or sk-or-... key"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Auto-Detected Provider & Model</label>
              <input
                type="text"
                className="form-input"
                value={`${aiProvider.toUpperCase()} (${aiModel})`}
                disabled
              />
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', alignItems: 'center' }}>
          <button type="button" className="btn btn-secondary" onClick={handleTestAIConnection}>
            Test Connection & Authenticate
          </button>
          {testResult && (
            <span style={{ fontSize: '0.8rem', color: testResult.success ? 'var(--success)' : 'var(--danger)' }}>
              {testResult.message}
            </span>
          )}
        </div>
      </div>

      {/* Password Security & Preferences */}
      <div className="glass-card">
        <h3><KeyRound size={16} /> Profile & Master App Password Security</h3>
        <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">User Profile Name</label>
              <input type="text" className="form-input" value={userName} onChange={(e) => setUserName(e.target.value)} />
            </div>

            {settings?.appPassword ? (
              <div className="form-group">
                <label className="form-label">Current Security Password * (Required for password update)</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Enter current password to authorize changes..."
                  value={currentPasswordInput}
                  onChange={(e) => setCurrentPasswordInput(e.target.value)}
                />
              </div>
            ) : null}

            <div className="form-group">
              <label className="form-label">{settings?.appPassword ? 'New Security Password' : 'Set Master Security Password'}</label>
              <input
                type="password"
                className="form-input"
                placeholder="Enter password..."
                value={appPasswordInput}
                onChange={(e) => setAppPasswordInput(e.target.value)}
              />
            </div>
          </div>

          {passwordSaveError && (
            <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{passwordSaveError}</span>
          )}

          <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
            Save User Credentials & Settings
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
