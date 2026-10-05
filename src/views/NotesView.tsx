import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, NoteItem } from '../db/schema';
import { Plus, Trash2, Edit3, Pin, FileText, Tag as TagIcon, Search, Filter } from 'lucide-react';

export const NotesView: React.FC = () => {
  const notes = useLiveQuery(() => db.notes.toArray()) || [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [noteToEdit, setNoteToEdit] = useState<NoteItem | null>(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('General');
  const [relatedType, setRelatedType] = useState<'habit' | 'task' | 'project' | 'goal' | 'finance' | 'general'>('general');
  const [tagsInput, setTagsInput] = useState('');
  const [pinned, setPinned] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');

  // Collect unique tags
  const allTagsSet = new Set<string>();
  notes.forEach((n) => n.tags?.forEach((t) => allTagsSet.add(t)));
  const allTags = Array.from(allTagsSet);

  const openAddModal = (note?: NoteItem) => {
    if (note) {
      setNoteToEdit(note);
      setTitle(note.title);
      setContent(note.content);
      setCategory(note.category || 'General');
      setRelatedType(note.relatedType || 'general');
      setTagsInput(note.tags ? note.tags.join(', ') : '');
      setPinned(!!note.pinned);
    } else {
      setNoteToEdit(null);
      setTitle('');
      setContent('');
      setCategory('General');
      setRelatedType('general');
      setTagsInput('');
      setPinned(false);
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const tags = tagsInput
      ? tagsInput.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    const noteData = {
      title: title.trim(),
      content: content.trim(),
      category: category.trim() || 'General',
      relatedType,
      tags,
      pinned,
      updatedAt: new Date().toISOString(),
    };

    if (noteToEdit) {
      await db.notes.update(noteToEdit.id, noteData);
    } else {
      await db.notes.add({
        id: `note-${Date.now()}`,
        ...noteData,
        createdAt: new Date().toISOString(),
      });
    }

    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this note?')) {
      await db.notes.delete(id);
    }
  };

  const togglePin = async (note: NoteItem) => {
    await db.notes.update(note.id, { pinned: !note.pinned, updatedAt: new Date().toISOString() });
  };

  const filteredNotes = notes.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.category?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTag === 'all' || (n.tags && n.tags.includes(selectedTag));
    return matchesSearch && matchesTag;
  });

  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  return (
    <div className="view-container">
      {/* Header */}
      <div className="view-header">
        <div>
          <h1 className="view-header-title">Universal Notes & Tagging Engine</h1>
          <p className="view-header-subtitle">
            Central repository for rich notes, reflective insights, and cross-module tags attached to habits, tasks, and financial records.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => openAddModal()}>
          <Plus size={16} /> Create Note
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '36px' }}
            placeholder="Search notes content, titles, categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Tag Filters */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <Filter size={15} style={{ color: 'var(--text-muted)' }} />
          <button
            className={`btn ${selectedTag === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
            onClick={() => setSelectedTag('all')}
          >
            All Tags
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              className={`btn ${selectedTag === tag ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
              onClick={() => setSelectedTag(tag)}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* Notes Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {sortedNotes.length === 0 ? (
          <div className="liquid-panel" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
            <FileText size={36} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
            <p style={{ color: 'var(--text-muted)' }}>No notes created yet. Click <strong>Create Note</strong> to start documenting insights.</p>
          </div>
        ) : (
          sortedNotes.map((note) => (
            <div
              key={note.id}
              className="liquid-panel flip-card-item"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '1.25rem',
                gap: '1rem',
                border: note.pinned ? '1px solid var(--accent-secondary)' : '1px solid var(--border-color)',
                position: 'relative',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    {note.title}
                  </h3>
                  <button
                    className="btn btn-icon"
                    style={{ color: note.pinned ? 'var(--accent-secondary)' : 'var(--text-muted)', padding: '2px' }}
                    onClick={() => togglePin(note)}
                    title={note.pinned ? 'Unpin note' : 'Pin note to top'}
                  >
                    <Pin size={16} />
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem' }}>
                  <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: 'rgba(82, 118, 83, 0.2)', color: 'var(--accent-secondary)', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}>
                    {note.category}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                    • {note.relatedType}
                  </span>
                </div>

                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0.75rem 0 0 0', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                  {note.content}
                </p>

                {note.tags && note.tags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.85rem' }}>
                    {note.tags.map((tag, idx) => (
                      <span key={idx} style={{ fontSize: '0.725rem', padding: '2px 7px', background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                  {new Date(note.updatedAt).toLocaleDateString()}
                </span>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button className="btn btn-secondary btn-icon" onClick={() => openAddModal(note)}>
                    <Edit3 size={14} />
                  </button>
                  <button className="btn btn-danger btn-icon" onClick={() => handleDelete(note.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Note Modal */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(10px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="liquid-panel"
            style={{ width: '100%', maxWidth: '550px', padding: '1.75rem', background: 'var(--bg-secondary)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 1rem 0', fontWeight: 800 }}>
              {noteToEdit ? 'Edit Note' : 'Create New Note'}
            </h3>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Note Title *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="Note title or main concept..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Architecture, Reflection, Setup..."
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Related Domain Module</label>
                  <select className="form-select" value={relatedType} onChange={(e) => setRelatedType(e.target.value as any)}>
                    <option value="general">General</option>
                    <option value="habit">Habits</option>
                    <option value="task">Tasks</option>
                    <option value="project">Projects</option>
                    <option value="goal">Goals</option>
                    <option value="finance">Finance</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Note Content *</label>
                <textarea
                  className="form-input"
                  rows={6}
                  required
                  placeholder="Detailed notes, rich text, code snippets, or thoughts..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tags (comma-separated)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="cybersecurity, study, budget, keybindings..."
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="pin-note-checkbox"
                  checked={pinned}
                  onChange={(e) => setPinned(e.target.checked)}
                />
                <label htmlFor="pin-note-checkbox" style={{ fontSize: '0.85rem', cursor: 'pointer' }}>
                  Pin note to top of list
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
