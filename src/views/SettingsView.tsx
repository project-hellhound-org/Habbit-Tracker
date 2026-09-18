import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, ForestTexture, ForestPalette } from '../db/schema';
import { resetAllDataToInitialState } from '../db/seed';
import { getAISettings, saveAISettings, testAIConnection, maskApiKey } from '../services/aiProviderService';
import { Download, Trash2, Sparkles, Lock, ShieldAlert, KeyRound, Eye, EyeOff, CheckCircle2, AlertCircle, Palette, Image as ImageIcon } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const settings = useLiveQuery(() => db.settings.get('default'));
  const aiSettingsLive = useLiveQuery(() => db.aiSettings.get('default'));

  const [userName, setUserName] = useState(settings?.userName || 'User');
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>(settings?.theme || 'dark');
  const [accentColor, setAccentColor] = useState<string>(settings?.accentColor || '#ffffff');
  const [backgroundTexture, setBackgroundTexture] = useState<ForestTexture>(settings?.backgroundTexture || 'mist');
  const [colorPalette, setColorPalette] = useState<ForestPalette>(settings?.colorPalette || 'pine');

  // Master App Password State & Update Verification
  const [appPasswordInput, setAppPasswordInput] = useState(settings?.appPassword || '');
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [passwordUpdateError, setPasswordUpdateError] = useState('');
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [verifyPasswordPrompt, setVerifyPasswordPrompt] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [pendingAction, setPendingAction] = useState<'clear_db' | 'export_data' | null>(null);

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

  // Sync Settings state on load (Fixes Settings Persistence Reset bug)
  useEffect(() => {
    if (settings) {
      setUserName(settings.userName || 'User');
      setTheme(settings.theme || 'dark');
      setAccentColor(settings.accentColor || '#ffffff');
      setBackgroundTexture(settings.backgroundTexture || 'mist');
      setColorPalette(settings.colorPalette || 'pine');
      setAppPasswordInput(settings.appPassword || '');
    }
  }, [settings?.userName, settings?.theme, settings?.accentColor, settings?.backgroundTexture, settings?.colorPalette, settings?.appPassword]);

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

  const textures: { id: ForestTexture; label: string; desc: string }[] = [
    { id: 'mist', label: 'Mist Forest Overlay', desc: 'Soft floating ambient mountain fog' },
    { id: 'grain', label: 'Forest Grain', desc: 'Tactile organic wood and earth noise' },
    { id: 'leaf_shadow', label: 'Leaf Shadow', desc: 'Subtle botanical canopy silhouettes' },
    { id: 'evergreen', label: 'Evergreen Forest', desc: 'Deep needle canopy gradients' },
    { id: 'rainy', label: 'Rainy Forest', desc: 'Misty raindrops with glistening light' },
  ];

  const palettes: { id: ForestPalette; label: string; previewColor: string; desc: string }[] = [
    { id: 'pine', label: 'Pine Theme', previewColor: '#2E5E44', desc: 'Deep evergreen pine baseline' },
    { id: 'moss', label: 'Moss Theme', previewColor: '#456B33', desc: 'Warm earthy lichen & moss' },
    { id: 'leaf', label: 'Leaf Theme', previewColor: '#327A56', desc: 'Vibrant botanical green canopy' },
    { id: 'mist', label: 'Mist Theme', previewColor: '#386B6F', desc: 'Cool mountain fog atmosphere' },
  ];

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
      backgroundTexture,
      colorPalette,
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

    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-palette', colorPalette);
    const rootCanvas = document.getElementById('app-root-canvas');
    if (rootCanvas) {
      rootCanvas.setAttribute('data-texture', backgroundTexture);
    }
    setCurrentPasswordInput('');
    alert('Settings, Forest Theme & AI Provider configuration saved successfully.');
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
        <h2>Settings & Forest Customization</h2>
        <p className="subtitle">Personalize background textures, color palettes, profile security, and AI models.</p>
      </div>

      {/* Forest Theme & Visual Customization */}
      <div className="glass-card">
        <h3><Palette size={18} style={{ color: 'var(--accent-secondary)' }} /> Forest Palette & Texture Customization</h3>
        
        {/* Color Palette Selector */}
        <div style={{ marginTop: '1rem', marginBottom: '1.25rem' }}>
          <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
            Color Palette Theme
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
            {palettes.map((p) => {
              const isSel = colorPalette === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setColorPalette(p.id);
                    document.documentElement.setAttribute('data-palette', p.id);
                  }}
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    background: isSel ? 'rgba(25, 61, 47, 0.9)' : 'rgba(13, 34, 26, 0.6)',
                    border: isSel ? '2px solid var(--accent-secondary)' : '1px solid var(--border-color)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 200ms ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                    <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: p.previewColor }} />
                    <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{p.label}</strong>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{p.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Background Texture Selector */}
        <div>
          <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
            Background Texture Overlay
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
            {textures.map((t) => {
              const isSel = backgroundTexture === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setBackgroundTexture(t.id);
                    const rootCanvas = document.getElementById('app-root-canvas');
                    if (rootCanvas) rootCanvas.setAttribute('data-texture', t.id);
                  }}
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    background: isSel ? 'rgba(25, 61, 47, 0.9)' : 'rgba(13, 34, 26, 0.6)',
                    border: isSel ? '2px solid var(--accent-secondary)' : '1px solid var(--border-color)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 200ms ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                    <ImageIcon size={16} style={{ color: isSel ? 'var(--accent-secondary)' : 'var(--text-muted)' }} />
                    <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{t.label}</strong>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{t.desc}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* AI Model Configuration (Local vs Cloud Provider) */}
      <div className="glass-card">
        <h3><Sparkles size={16} style={{ color: '#8FAF82' }} /> AI Engine Setup</h3>
        
        {/* Mode Selector */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', marginBottom: '1.25rem' }}>
          <button
            type="button"
            className={`btn ${aiMode === 'local' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, padding: '0.7rem' }}
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
            style={{ flex: 1, padding: '0.7rem' }}
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Model Name</label>
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
                    style={{ width: '140px' }}
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
              <label className="form-label">Base URL / Endpoint</label>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Base URL *</label>
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
                <label className="form-label">Model Name *</label>
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

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.25rem', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleTestAIConnection}
            disabled={isTestingConnection}
          >
            {isTestingConnection ? 'Testing Connection...' : 'Test AI Connection'}
          </button>
          {testResult && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.825rem', color: testResult.success ? '#527653' : 'var(--danger)', fontWeight: 600 }}>
              {testResult.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{testResult.message}</span>
            </div>
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
            Save Profile & Forest Preferences
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

