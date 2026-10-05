import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, WishlistItem } from '../db/schema';
import { Plus, Trash2, Edit3, ShoppingBag, BookOpen, Rocket, Tag as TagIcon, DollarSign, CheckCircle2, Archive, ExternalLink } from 'lucide-react';

export const WishlistView: React.FC = () => {
  const wishlistItems = useLiveQuery(() => db.wishlistItems.toArray()) || [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<WishlistItem | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'purchase' | 'resource' | 'project'>('purchase');
  const [estimatedCost, setEstimatedCost] = useState<number | ''>('');
  const [url, setUrl] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [tagsInput, setTagsInput] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const openAddModal = (item?: WishlistItem) => {
    if (item) {
      setItemToEdit(item);
      setTitle(item.title);
      setDescription(item.description || '');
      setCategory(item.category as any || 'purchase');
      setEstimatedCost(item.estimatedCost ?? '');
      setUrl(item.url || '');
      setPriority(item.priority || 'medium');
      setTagsInput(item.tags ? item.tags.join(', ') : '');
    } else {
      setItemToEdit(null);
      setTitle('');
      setDescription('');
      setCategory('purchase');
      setEstimatedCost('');
      setUrl('');
      setPriority('medium');
      setTagsInput('');
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const tags = tagsInput
      ? tagsInput.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    const itemData = {
      title: title.trim(),
      description: description.trim(),
      category,
      estimatedCost: typeof estimatedCost === 'number' ? estimatedCost : undefined,
      url: url.trim(),
      priority,
      status: itemToEdit ? itemToEdit.status : ('saved' as const),
      tags,
      updatedAt: new Date().toISOString(),
    };

    if (itemToEdit) {
      await db.wishlistItems.update(itemToEdit.id, itemData);
    } else {
      await db.wishlistItems.add({
        id: `wish-${Date.now()}`,
        ...itemData,
        createdAt: new Date().toISOString(),
      });
    }

    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this item from wishlist?')) {
      await db.wishlistItems.delete(id);
    }
  };

  const handleStatusToggle = async (item: WishlistItem) => {
    const nextStatus = item.status === 'acquired' ? 'saved' : 'acquired';
    await db.wishlistItems.update(item.id, { status: nextStatus, updatedAt: new Date().toISOString() });
  };

  const filteredItems = wishlistItems.filter((i) => {
    if (filterCategory === 'all') return true;
    return i.category === filterCategory;
  });

  const totalEstimatedCost = wishlistItems.reduce((acc, curr) => acc + (curr.estimatedCost || 0), 0);

  return (
    <div className="view-container">
      {/* Header */}
      <div className="view-header">
        <div>
          <h1 className="view-header-title">Wishlist & Resource Repository</h1>
          <p className="view-header-subtitle">
            Repository for future purchases, learning resources, and upcoming side projects (kept distinct from active workload).
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => openAddModal()}>
          <Plus size={16} /> Add Wishlist Item
        </button>
      </div>

      {/* Stats Summary Bar */}
      <div className="stat-badge-grid">
        <div className="liquid-panel flip-card-item">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-secondary)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>REPOSITORIES</span>
            <ShoppingBag size={18} />
          </div>
          <div className="hero-stat-number">{wishlistItems.length}</div>
          <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Wishlist & resource items</span>
        </div>

        <div className="liquid-panel flip-card-item">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-secondary)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>ACQUIRED / COMPLETED</span>
            <CheckCircle2 size={18} />
          </div>
          <div className="hero-stat-number">
            {wishlistItems.filter((i) => i.status === 'acquired').length}
          </div>
          <span style={{ fontSize: '0.825rem', color: 'var(--accent-secondary)' }}>Fulfilling wishlist goals</span>
        </div>

        <div className="liquid-panel flip-card-item">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--warning)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>ESTIMATED BUDGET</span>
            <DollarSign size={18} />
          </div>
          <div className="hero-stat-number" style={{ color: 'var(--warning)' }}>
            ${totalEstimatedCost.toLocaleString()}
          </div>
          <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Total potential cost</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', margin: '1rem 0' }}>
        {[
          { id: 'all', label: 'All Items' },
          { id: 'purchase', label: 'Purchases' },
          { id: 'resource', label: 'Resources & Courses' },
          { id: 'project', label: 'Future Projects' },
        ].map((f) => (
          <button
            key={f.id}
            className={`btn ${filterCategory === f.id ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}
            onClick={() => setFilterCategory(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
        {filteredItems.length === 0 ? (
          <div className="liquid-panel" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--text-muted)' }}>No wishlist items found in this category.</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className="liquid-panel flip-card-item"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '1.25rem',
                gap: '1rem',
                opacity: item.status === 'acquired' ? 0.65 : 1,
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {item.category === 'purchase' && <ShoppingBag size={18} style={{ color: 'var(--accent-secondary)' }} />}
                    {item.category === 'resource' && <BookOpen size={18} style={{ color: 'var(--accent-secondary)' }} />}
                    {item.category === 'project' && <Rocket size={18} style={{ color: 'var(--accent-secondary)' }} />}
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, textDecoration: item.status === 'acquired' ? 'line-through' : 'none' }}>
                      {item.title}
                    </h3>
                  </div>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-sm)',
                      background: item.priority === 'high' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(82, 118, 83, 0.2)',
                      color: item.priority === 'high' ? '#ef4444' : 'var(--accent-secondary)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    {item.priority}
                  </span>
                </div>

                {item.description && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.5rem 0 0 0' }}>
                    {item.description}
                  </p>
                )}

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {item.estimatedCost !== undefined && (
                    <span style={{ color: 'var(--warning)', fontWeight: 600 }}>
                      ${item.estimatedCost.toLocaleString()}
                    </span>
                  )}
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: 'var(--accent-secondary)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem', textDecoration: 'none' }}
                    >
                      Link <ExternalLink size={12} />
                    </a>
                  )}
                </div>

                {item.tags && item.tags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.6rem' }}>
                    {item.tags.map((tag, idx) => (
                      <span key={idx} style={{ fontSize: '0.7rem', padding: '1px 6px', background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                <button
                  className={`btn ${item.status === 'acquired' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                  onClick={() => handleStatusToggle(item)}
                >
                  <CheckCircle2 size={14} /> {item.status === 'acquired' ? 'Acquired' : 'Mark Acquired'}
                </button>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button className="btn btn-secondary btn-icon" onClick={() => openAddModal(item)}>
                    <Edit3 size={14} />
                  </button>
                  <button className="btn btn-danger btn-icon" onClick={() => handleDelete(item.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Modal */}
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
            style={{ width: '100%', maxWidth: '500px', padding: '1.5rem', background: 'var(--bg-secondary)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 1rem 0', fontWeight: 800 }}>
              {itemToEdit ? 'Edit Wishlist Item' : 'Add Wishlist Item'}
            </h3>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="e.g. Mechanical Keyboard, AWS Certification..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value as any)}>
                    <option value="purchase">Purchase</option>
                    <option value="resource">Resource / Book / Course</option>
                    <option value="project">Future Project</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="form-select" value={priority} onChange={(e) => setPriority(e.target.value as any)}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Estimated Cost ($)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="0.00"
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(e.target.value ? parseFloat(e.target.value) : '')}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Reference URL</label>
                  <input
                    type="url"
                    className="form-input"
                    placeholder="https://..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description / Notes</label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Additional context or notes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tags (comma-separated)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="hardware, learning, setup..."
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
