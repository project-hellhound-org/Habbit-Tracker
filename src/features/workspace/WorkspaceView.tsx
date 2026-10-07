import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Note, WishlistItem, ChecklistItem } from '../../db/schema';
import {
  FileText,
  Bookmark,
  CheckSquare,
  Plus,
  Tag,
  Search,
  Pin,
  Trash2,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { format } from 'date-fns';

export const WorkspaceView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'notes' | 'wishlist' | 'checklists'>('notes');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Modals state
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [showAddWishlistModal, setShowAddWishlistModal] = useState(false);

  // Live Queries
  const notes = useLiveQuery(() => db.notes.toArray()) || [];
  const wishlistItems = useLiveQuery(() => db.wishlistItems.toArray()) || [];
  const checklistItems = useLiveQuery(() => db.checklistItems.toArray()) || [];

  // Form states
  const [noteForm, setNoteForm] = useState({ title: '', content: '', tags: '' });
  const [wishlistForm, setWishlistForm] = useState({
    title: '',
    category: 'General',
    priority: 'medium' as WishlistItem['priority'],
    description: '',
  });
  const [newChecklistTitle, setNewChecklistTitle] = useState('');

  // All extracted tags
  const allTags = Array.from(new Set(notes.flatMap((n) => n.tags || [])));

  // Filtered Notes
  const filteredNotes = notes.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTag ? n.tags?.includes(selectedTag) : true;
    return matchesSearch && matchesTag;
  });

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteForm.title.trim()) return;

    const tagsArr = noteForm.tags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const newNote: Note = {
      id: `note-${Date.now()}`,
      entityType: 'general',
      title: noteForm.title.trim(),
      content: noteForm.content,
      tags: tagsArr,
      pinned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.notes.add(newNote);
    setShowAddNoteModal(false);
    setNoteForm({ title: '', content: '', tags: '' });
  };

  const handleDeleteNote = async (id: string) => {
    await db.notes.delete(id);
  };

  const handleTogglePinNote = async (note: Note) => {
    await db.notes.update(note.id, {
      pinned: !note.pinned,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleAddWishlistItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wishlistForm.title.trim()) return;

    const newItem: WishlistItem = {
      id: `wish-${Date.now()}`,
      title: wishlistForm.title.trim(),
      category: wishlistForm.category,
      priority: wishlistForm.priority,
      status: 'wished',
      tags: [],
      description: wishlistForm.description || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.wishlistItems.add(newItem);
    setShowAddWishlistModal(false);
    setWishlistForm({ title: '', category: 'General', priority: 'medium', description: '' });
  };

  const handleToggleWishlistStatus = async (item: WishlistItem) => {
    const nextStatus = item.status === 'wished' ? 'acquired' : 'wished';
    await db.wishlistItems.update(item.id, {
      status: nextStatus,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleAddChecklistItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistTitle.trim()) return;

    const newItem: ChecklistItem = {
      id: `chk-${Date.now()}`,
      parentType: 'standalone',
      title: newChecklistTitle.trim(),
      completed: false,
      order: checklistItems.length,
      createdAt: new Date().toISOString(),
    };

    await db.checklistItems.add(newItem);
    setNewChecklistTitle('');
  };

  const handleToggleChecklist = async (item: ChecklistItem) => {
    await db.checklistItems.update(item.id, {
      completed: !item.completed,
    });
  };

  return (
    <div className="view-container" style={{ padding: '1.5rem', color: 'var(--text-primary)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Layers style={{ color: 'var(--accent-primary)' }} /> Workspace Management & Knowledge Base
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>
            Unified productivity hub providing Notes & Tagging, Wishlists, and Task-Level Checklists.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {activeTab === 'notes' && (
            <button className="btn btn-primary" onClick={() => setShowAddNoteModal(true)}>
              <Plus size={16} /> Create Note
            </button>
          )}
          {activeTab === 'wishlist' && (
            <button className="btn btn-primary" onClick={() => setShowAddWishlistModal(true)}>
              <Plus size={16} /> Add Wishlist Item
            </button>
          )}
        </div>
      </div>

      {/* Tabs Bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem', gap: '0.5rem' }}>
        {[
          { id: 'notes', label: 'Notes & Ideas', icon: FileText, count: notes.length },
          { id: 'wishlist', label: 'Wishlist & Purchasing', icon: Bookmark, count: wishlistItems.length },
          { id: 'checklists', label: 'Checklists & Task-Level To-Dos', icon: CheckSquare, count: checklistItems.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.25rem',
                background: isActive ? 'rgba(34, 197, 94, 0.15)' : 'transparent',
                border: 'none',
                borderBottom: isActive ? '2px solid var(--accent-primary)' : '2px solid transparent',
                color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
              }}
            >
              <Icon size={16} /> {tab.label} ({tab.count})
            </button>
          );
        })}
      </div>

      {/* TABS CONTENT */}
      {/* 1. NOTES TAB */}
      {activeTab === 'notes' && (
        <div>
          {/* Search & Tags Filter */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search notes content or titles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.8rem 0.65rem 2.4rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--border-color)',
                  color: '#FFF',
                }}
              />
            </div>

            {/* Tag Pills */}
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => setSelectedTag(null)}
                style={{
                  padding: '0.4rem 0.8rem',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  background: selectedTag === null ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
                  color: selectedTag === null ? '#FFF' : 'var(--text-secondary)',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                All Tags
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  style={{
                    padding: '0.4rem 0.8rem',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    background: selectedTag === tag ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
                    color: selectedTag === tag ? '#FFF' : 'var(--text-secondary)',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>

          {/* Notes Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
            {filteredNotes.map((n) => (
              <div
                key={n.id}
                className="liquid-panel"
                style={{
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-md)',
                  border: n.pinned ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>{n.title}</h3>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      onClick={() => handleTogglePinNote(n)}
                      style={{ background: 'none', border: 'none', color: n.pinned ? 'var(--accent-primary)' : 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      <Pin size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteNote(n.id)}
                      style={{ background: 'none', border: 'none', color: '#F87171', cursor: 'pointer' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', margin: '0 0 1rem 0', minHeight: '60px' }}>
                  {n.content}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                    {n.tags?.map((t) => (
                      <span key={t} style={{ background: 'rgba(34, 197, 94, 0.15)', color: 'var(--accent-primary)', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                        #{t}
                      </span>
                    ))}
                  </div>
                  <span>{format(new Date(n.updatedAt), 'MMM dd')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. WISHLIST TAB */}
      {activeTab === 'wishlist' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {wishlistItems.map((item) => (
            <div key={item.id} className="liquid-panel" style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{item.category}</span>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0.2rem 0', textDecoration: item.status === 'acquired' ? 'line-through' : 'none' }}>
                    {item.title}
                  </h3>
                </div>
                <button
                  onClick={() => handleToggleWishlistStatus(item)}
                  style={{
                    padding: '0.3rem 0.6rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    background: item.status === 'acquired' ? 'rgba(52, 211, 153, 0.2)' : 'rgba(255,255,255,0.05)',
                    color: item.status === 'acquired' ? '#34D399' : 'var(--text-secondary)',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {item.status === 'acquired' ? 'Acquired' : 'Wished'}
                </button>
              </div>

              {item.description && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.5rem 0' }}>{item.description}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 3. CHECKLISTS TAB */}
      {activeTab === 'checklists' && (
        <div className="liquid-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', maxWidth: '600px' }}>
          <h3 style={{ marginTop: 0, fontSize: '1.2rem', fontWeight: 700 }}>Task-Level Quick Checklist</h3>
          <form onSubmit={handleAddChecklistItem} style={{ display: 'flex', gap: '0.75rem', margin: '1rem 0' }}>
            <input
              type="text"
              placeholder="Add checklist item..."
              value={newChecklistTitle}
              onChange={(e) => setNewChecklistTitle(e.target.value)}
              style={{
                flex: 1,
                padding: '0.65rem 0.8rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border-color)',
                color: '#FFF',
              }}
            />
            <button type="submit" className="btn btn-primary">Add</button>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {checklistItems.map((chk) => (
              <div
                key={chk.id}
                onClick={() => handleToggleChecklist(chk)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <input type="checkbox" checked={chk.completed} onChange={() => {}} style={{ cursor: 'pointer' }} />
                <span style={{ textDecoration: chk.completed ? 'line-through' : 'none', color: chk.completed ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                  {chk.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODALS */}
      {/* Create Note Modal */}
      {showAddNoteModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="liquid-panel" style={{ width: '500px', padding: '1.5rem', borderRadius: 'var(--radius-md)', background: '#0D221A' }}>
            <h3 style={{ marginTop: 0, fontSize: '1.2rem', fontWeight: 700 }}>New Knowledge Note</h3>
            <form onSubmit={handleAddNote} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Title</label>
                <input
                  type="text"
                  required
                  value={noteForm.title}
                  onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#FFF' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Content (Markdown Supported)</label>
                <textarea
                  rows={6}
                  value={noteForm.content}
                  onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#FFF' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Tags (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. project, habit-idea, finance"
                  value={noteForm.tags}
                  onChange={(e) => setNoteForm({ ...noteForm, tags: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#FFF' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddNoteModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Note</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Wishlist Item Modal */}
      {showAddWishlistModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="liquid-panel" style={{ width: '420px', padding: '1.5rem', borderRadius: 'var(--radius-md)', background: '#0D221A' }}>
            <h3 style={{ marginTop: 0, fontSize: '1.2rem', fontWeight: 700 }}>Add Wishlist Item</h3>
            <form onSubmit={handleAddWishlistItem} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Item Name</label>
                <input
                  type="text"
                  required
                  value={wishlistForm.title}
                  onChange={(e) => setWishlistForm({ ...wishlistForm, title: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#FFF' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Category</label>
                <input
                  type="text"
                  value={wishlistForm.category}
                  onChange={(e) => setWishlistForm({ ...wishlistForm, category: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#FFF' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Description</label>
                <input
                  type="text"
                  placeholder="Optional details..."
                  value={wishlistForm.description}
                  onChange={(e) => setWishlistForm({ ...wishlistForm, description: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#FFF' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddWishlistModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Item</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
