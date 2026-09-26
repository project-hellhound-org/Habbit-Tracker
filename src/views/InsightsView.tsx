import React, { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, AIMessage } from '../db/schema';
import { queryAIAssistant } from '../services/aiProviderService';
import {
  Sparkles,
  Send,
  Plus,
  Trash2,
  Bot,
  User,
  MessageSquare,
  AlertTriangle,
  RotateCcw,
  Zap,
  Activity,
  Cpu,
  ShieldCheck,
  BarChart3,
  Flame,
  CheckCircle2
} from 'lucide-react';

export const InsightsView: React.FC = () => {
  const [activeConvId, setActiveConvId] = useState<string>('default-conv');
  const [searchQuery, setSearchQuery] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasRenderError, setHasRenderError] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const aiSettings = useLiveQuery(() => db.aiSettings.get('default'));

  const conversations = useLiveQuery(async () => {
    try {
      const list = await db.aiConversations.toArray();
      return list.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
    } catch (err) {
      return [];
    }
  }) || [];

  const activeMessages = useLiveQuery(async () => {
    try {
      if (!activeConvId) return [];
      return await db.aiMessages.where('conversationId').equals(activeConvId).sortBy('timestamp');
    } catch (err) {
      return [];
    }
  }, [activeConvId]) || [];

  useEffect(() => {
    let isMounted = true;
    const initConv = async () => {
      try {
        const existing = await db.aiConversations.get('default-conv');
        if (!existing && isMounted) {
          await db.aiConversations.add({
            id: 'default-conv',
            title: 'Productivity Architecture & Pattern Analysis',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      } catch (err) {}
    };
    initConv();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      } catch (e) {}
    }, 120);
    return () => clearTimeout(timer);
  }, [activeMessages.length, isLoading]);

  const handleCreateNewConversation = async () => {
    try {
      const newId = `conv-${Date.now()}`;
      await db.aiConversations.add({
        id: newId,
        title: `Analysis Session ${conversations.length + 1}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setActiveConvId(newId);
    } catch (err) {}
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this conversation session history?')) {
      try {
        await db.aiConversations.delete(id);
        await db.aiMessages.where('conversationId').equals(id).delete();
        if (activeConvId === id) {
          const remaining = conversations.filter((c) => c.id !== id);
          setActiveConvId(remaining[0]?.id || 'default-conv');
        }
      } catch (err) {}
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || isLoading) return;

    setInputMessage('');
    const userMsgId = `msg-${Date.now()}`;
    const userMsg: AIMessage = {
      id: userMsgId,
      conversationId: activeConvId,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };

    try {
      await db.aiMessages.add(userMsg);
      await db.aiConversations.update(activeConvId, {
        updatedAt: new Date().toISOString(),
        title: activeMessages.length === 0 ? text.slice(0, 32) : undefined,
      });

      setIsLoading(true);
      const abortController = new AbortController();
      abortRef.current = abortController;

      const assistantMsgId = `msg-${Date.now() + 1}`;
      const assistantMsg: AIMessage = {
        id: assistantMsgId,
        conversationId: activeConvId,
        sender: 'assistant',
        text: '...',
        timestamp: new Date().toISOString(),
      };
      await db.aiMessages.add(assistantMsg);

      const response = await queryAIAssistant(
        text,
        undefined,
        abortController.signal,
        async (chunkText) => {
          await db.aiMessages.update(assistantMsgId, { text: chunkText });
        }
      );

      await db.aiMessages.update(assistantMsgId, {
        text: response.text,
        metadata: {
          actionCards: response.actionCards,
          suggestedPrompts: response.suggestedPrompts,
          metricsUsed: response.metricsUsed,
        },
      });
    } catch (err: any) {
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  };

  const handleResetWorkspace = async () => {
    try {
      await db.aiConversations.clear();
      await db.aiMessages.clear();
      await db.aiConversations.add({
        id: 'default-conv',
        title: 'Productivity Architecture & Pattern Analysis',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setActiveConvId('default-conv');
      setHasRenderError(false);
    } catch (e) {}
  };

  if (hasRenderError) {
    return (
      <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
        <AlertTriangle size={36} style={{ color: 'var(--danger)' }} />
        <h3>Smart AI Insight Engine Recovery</h3>
        <button className="btn btn-primary" onClick={handleResetWorkspace} style={{ marginTop: '1rem' }}>
          <RotateCcw size={16} /> Reset Engine Workspace
        </button>
      </div>
    );
  }

  const filteredConversations = conversations.filter((c) =>
    (c.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const quickPrompts = [
    '📊 Deep Workload Analysis Today',
    '🌿 Habit Pattern Recognition',
    '⚡ Focus Efficiency Diagnostics',
    '🔥 Streak Optimization Strategies',
    '🎯 Overdue Task Remediation Plan',
  ];

  const activeMode = aiSettings?.mode === 'cloud' ? 'Generic Cloud API' : 'Local Engine (Ollama)';
  const activeModel = aiSettings?.model || (aiSettings?.mode === 'cloud' ? 'gpt-4o-mini' : 'llama3.1');

  return (
    <div className="view-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Smart Insight Engine Prominent Header Command Center */}
      <div
        className="liquid-panel flip-card-item"
        style={{
          padding: '1.5rem 1.75rem',
          background: 'linear-gradient(135deg, rgba(16, 47, 34, 0.95) 0%, rgba(22, 58, 41, 0.85) 100%)',
          border: '1.5px solid var(--accent-primary)',
          boxShadow: '0 8px 32px rgba(47, 143, 91, 0.20)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 6px 20px rgba(87, 185, 120, 0.4)',
              flexShrink: 0,
            }}
          >
            <Sparkles size={32} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
                Smart AI Insight Engine
              </h1>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.65rem',
                  borderRadius: '12px',
                  background: 'rgba(141, 217, 160, 0.18)',
                  color: 'var(--accent-highlight)',
                  border: '1px solid rgba(141, 217, 160, 0.3)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
              >
                <Zap size={12} /> Zero-Latency Active
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', margin: 0 }}>
              High-precision cognitive copilot for real-time habit evaluation, workload diagnostics, and productivity pattern extraction.
            </p>
          </div>
        </div>

        {/* Engine Status Indicators */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div
            style={{
              padding: '0.6rem 1rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(7, 26, 19, 0.65)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
            }}
          >
            <Cpu size={18} style={{ color: 'var(--accent-secondary)' }} />
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Active Provider
              </span>
              <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{activeMode}</strong>
            </div>
          </div>

          <div
            style={{
              padding: '0.6rem 1rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(7, 26, 19, 0.65)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
            }}
          >
            <ShieldCheck size={18} style={{ color: '#57B978' }} />
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Model & Latency
              </span>
              <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{activeModel} (&lt; 5s Fast)</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Main High-Prominence Workspace Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '1.25rem', height: 'calc(100vh - var(--header-height) - 100px)', minHeight: '640px' }}>
        {/* Sidebar: Conversation Sessions */}
        <aside className="liquid-panel flip-card-item" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem', minHeight: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <MessageSquare size={18} style={{ color: 'var(--accent-secondary)' }} /> Analysis Sessions
            </h3>
            <button className="btn btn-primary btn-xs" onClick={handleCreateNewConversation} style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
              <Plus size={14} /> New Session
            </button>
          </div>

          <input
            type="text"
            className="form-input"
            style={{ fontSize: '0.85rem', padding: '0.6rem 0.85rem' }}
            placeholder="Search analysis history..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', overflowY: 'auto', flex: 1 }}>
            {filteredConversations.map((c) => (
              <div
                key={c.id}
                onClick={() => setActiveConvId(c.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.75rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  background: activeConvId === c.id ? 'var(--bg-elevated)' : 'rgba(11, 38, 27, 0.45)',
                  border: activeConvId === c.id ? '1.5px solid var(--accent-secondary)' : '1px solid var(--border-color)',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  color: 'var(--text-primary)',
                  transition: 'all 180ms ease',
                  boxShadow: activeConvId === c.id ? '0 0 12px rgba(87, 185, 120, 0.15)' : 'none',
                }}
              >
                <MessageSquare size={16} style={{ color: activeConvId === c.id ? 'var(--accent-secondary)' : 'var(--text-muted)' }} />
                <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: activeConvId === c.id ? 600 : 400 }}>{c.title}</span>
                <button className="btn btn-danger btn-icon btn-xs" onClick={(e) => handleDeleteConversation(c.id, e)}>
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </aside>

        {/* Primary Interactive Insight Console */}
        <main className="liquid-panel flip-card-item" style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem', minWidth: 0, minHeight: 0 }}>
          {/* Prominent Quick Diagnostic Chips */}
          <div style={{ display: 'flex', gap: '0.6rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)', overflowX: 'auto', alignItems: 'center' }}>
            <span className="subtitle" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap', fontWeight: 700, color: 'var(--accent-secondary)', fontSize: '0.85rem' }}>
              <Sparkles size={16} /> Quick Analysis:
            </span>
            {quickPrompts.map((p) => (
              <button key={p} className="btn btn-secondary btn-xs" onClick={() => handleSendMessage(p)} style={{ whiteSpace: 'nowrap', padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}>
                {p}
              </button>
            ))}
          </div>

          {/* Active Chat Conversation Feed */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 0', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {activeMessages.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', gap: '1rem', textAlign: 'center', padding: '2rem' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(87, 185, 120, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(141, 217, 160, 0.25)' }}>
                  <Sparkles size={36} style={{ color: 'var(--accent-secondary)' }} />
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>Personalized Smart AI Productivity Engine</h3>
                <p style={{ maxWidth: '560px', fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                  Query your local database regarding habit completion ratios, timeline task bottlenecks, focus efficiency distributions, and daily journal mood reflections.
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <span style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <BarChart3 size={14} /> Metric Analytics
                  </span>
                  <span style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Flame size={14} /> Streak Defense
                  </span>
                  <span style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <CheckCircle2 size={14} /> Task Remediations
                  </span>
                </div>
              </div>
            ) : (
              activeMessages.map((msg) => (
                <div key={msg.id} style={{ display: 'flex', gap: '0.85rem', alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: msg.sender === 'user' ? 'var(--accent-primary)' : 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid var(--border-color)' }}>
                    {msg.sender === 'user' ? <User size={18} style={{ color: 'var(--bg-primary)' }} /> : <Bot size={18} style={{ color: 'var(--accent-secondary)' }} />}
                  </div>
                  <div style={{ padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', background: msg.sender === 'user' ? 'var(--accent-primary)' : 'var(--bg-secondary)', color: msg.sender === 'user' ? '#FFFFFF' : 'var(--text-primary)', border: '1px solid var(--border-color)', fontSize: '0.925rem', lineHeight: 1.55, whiteSpace: 'pre-wrap', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
                    {msg.text}
                  </div>
                </div>
              ))
            )}
            {isLoading && <span className="subtitle" style={{ fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-secondary)' }}>
              <Activity size={16} className="animate-spin" /> Smart Engine calculating metrics and formulating response...
            </span>}
            <div ref={chatEndRef} />
          </div>

          {/* Prominent Input Console */}
          <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} style={{ display: 'flex', gap: '0.85rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <input
              type="text"
              className="form-input"
              style={{ flex: 1, fontSize: '0.95rem', padding: '0.85rem 1.15rem', borderRadius: 'var(--radius-md)' }}
              placeholder="Query Smart AI Insight Engine..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={isLoading}
            />
            <button type="submit" className="btn btn-primary" disabled={isLoading || !inputMessage.trim()} style={{ padding: '0.85rem 1.6rem', fontSize: '0.95rem', borderRadius: 'var(--radius-md)' }}>
              <Send size={18} /> Evaluate
            </button>
          </form>
        </main>
      </div>
    </div>
  );
};
