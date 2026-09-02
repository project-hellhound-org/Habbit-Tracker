import React, { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, AIMessage } from '../db/schema';
import { queryAIAssistant } from '../services/aiProviderService';
import {
  Sparkles,
  Send,
  Plus,
  Trash2,
  Search,
  Bot,
  User,
  ArrowRight,
  MessageSquare,
  XCircle,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

export const InsightsView: React.FC = () => {
  const [activeConvId, setActiveConvId] = useState<string>('default-conv');
  const [searchQuery, setSearchQuery] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasRenderError, setHasRenderError] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

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
            title: 'Productivity Analysis',
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
        title: `Conversation ${conversations.length + 1}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setActiveConvId(newId);
    } catch (err) {}
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this conversation history?')) {
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
        title: activeMessages.length === 0 ? text.slice(0, 28) : undefined,
      });

      setIsLoading(true);
      const abortController = new AbortController();
      abortRef.current = abortController;

      const response = await queryAIAssistant(text, undefined, abortController.signal);
      const assistantMsg: AIMessage = {
        id: `msg-${Date.now() + 1}`,
        conversationId: activeConvId,
        sender: 'assistant',
        text: response.text,
        timestamp: new Date().toISOString(),
        metadata: {
          actionCards: response.actionCards,
          suggestedPrompts: response.suggestedPrompts,
          metricsUsed: response.metricsUsed,
        },
      };

      await db.aiMessages.add(assistantMsg);
    } catch (err: any) {
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  };

  const handleCancelRequest = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      setIsLoading(false);
    }
  };

  const handleResetWorkspace = async () => {
    try {
      await db.aiConversations.clear();
      await db.aiMessages.clear();
      await db.aiConversations.add({
        id: 'default-conv',
        title: 'Productivity Analysis',
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
        <AlertTriangle size={32} style={{ color: 'var(--danger)' }} />
        <h3>AI Workspace Recovery</h3>
        <button className="btn btn-primary" onClick={handleResetWorkspace} style={{ marginTop: '1rem' }}>
          <RotateCcw size={14} /> Reset AI Workspace
        </button>
      </div>
    );
  }

  const filteredConversations = conversations.filter((c) =>
    (c.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const quickPrompts = [
    'Analyze Today',
    'Review My Habits',
    'Explain Focus Efficiency',
    'Analyze Overdue Tasks',
    'What should I improve next week?',
  ];

  return (
    <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1.25rem', height: 'calc(100vh - var(--header-height) - 1.5rem)' }}>
      <aside className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', padding: '1rem', minHeight: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>AI Analyst</h3>
          <button className="btn btn-primary btn-xs" onClick={handleCreateNewConversation}>
            <Plus size={14} /> New Chat
          </button>
        </div>

        <input
          type="text"
          className="form-input"
          style={{ fontSize: '0.775rem' }}
          placeholder="Search chats..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', overflowY: 'auto', flex: 1 }}>
          {filteredConversations.map((c) => (
            <div
              key={c.id}
              onClick={() => setActiveConvId(c.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 0.65rem',
                borderRadius: 'var(--radius-sm)',
                background: activeConvId === c.id ? 'var(--bg-elevated)' : 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                cursor: 'pointer',
                fontSize: '0.8rem',
                color: 'var(--text-primary)',
              }}
            >
              <MessageSquare size={14} />
              <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.title}</span>
              <button className="btn btn-danger btn-icon btn-xs" onClick={(e) => handleDeleteConversation(c.id, e)}>
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      </aside>

      <main className="glass-card" style={{ display: 'flex', flexDirection: 'column', padding: '1rem', minWidth: 0, minHeight: 0 }}>
        <div style={{ display: 'flex', gap: '0.5rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', overflowX: 'auto' }}>
          <span className="subtitle" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap', fontWeight: 700 }}>
            <Sparkles size={14} /> Quick Analysis:
          </span>
          {quickPrompts.map((p) => (
            <button key={p} className="btn btn-secondary btn-xs" onClick={() => handleSendMessage(p)} style={{ whiteSpace: 'nowrap' }}>
              {p}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {activeMessages.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', gap: '0.5rem' }}>
              <Sparkles size={36} />
              <h3>Personal AI Productivity Analyst</h3>
              <p>Ask questions about your habits, tasks, focus efficiency, and daily performance metrics.</p>
            </div>
          ) : (
            activeMessages.map((msg) => (
              <div key={msg.id} style={{ display: 'flex', gap: '0.75rem', alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {msg.sender === 'user' ? <User size={14} /> : <Bot size={14} />}
                </div>
                <div style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', background: msg.sender === 'user' ? 'var(--accent-primary)' : 'var(--bg-secondary)', color: msg.sender === 'user' ? 'var(--bg-primary)' : 'var(--text-primary)', border: '1px solid var(--border-color)', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
                  {msg.text}
                </div>
              </div>
            ))
          )}
          {isLoading && <span className="subtitle">Analyzing productivity data...</span>}
          <div ref={chatEndRef} />
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
          <input
            type="text"
            className="form-input"
            style={{ flex: 1 }}
            placeholder="Ask AI about habits, tasks, focus efficiency..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={isLoading}
          />
          <button type="submit" className="btn btn-primary" disabled={isLoading || !inputMessage.trim()}>
            <Send size={16} /> Send
          </button>
        </form>
      </main>
    </div>
  );
};
