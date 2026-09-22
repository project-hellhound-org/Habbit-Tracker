import React, { useState, useEffect } from 'react';
import { db, Task, Subtask } from '../db/schema';
import { X, Plus, Calendar, CheckSquare, Trash2, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: Task | null;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({ isOpen, onClose, taskToEdit }) => {
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [frequency, setFrequency] = useState<'once_a_week' | 'daily' | 'custom'>('daily');
  const [customDays, setCustomDays] = useState<number[]>([1, 2, 3, 4, 5]); // 0=Sun..6=Sat
  const [startDate, setStartDate] = useState(todayStr);

  // Subtasks State inside Creation/Edit Panel
  const [draftSubtasks, setDraftSubtasks] = useState<Array<{ id: string; title: string; completed: boolean }>>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [submitBtnState, setSubmitBtnState] = useState<'idle' | 'creating' | 'created'>('idle');

  const daysOfWeek = [
    { label: 'Mon', value: 1 },
    { label: 'Tue', value: 2 },
    { label: 'Wed', value: 3 },
    { label: 'Thu', value: 4 },
    { label: 'Fri', value: 5 },
    { label: 'Sat', value: 6 },
    { label: 'Sun', value: 0 },
  ];

  useEffect(() => {
    let isMounted = true;
    const loadTaskData = async () => {
      if (taskToEdit) {
        setTitle(taskToEdit.title || '');
        setDescription(taskToEdit.description || '');
        setPriority(taskToEdit.priority || 'medium');
        setFrequency(taskToEdit.frequency || 'daily');
        setCustomDays(taskToEdit.customDays || [1, 2, 3, 4, 5]);
        setStartDate(taskToEdit.startDate || todayStr);

        // Fetch existing subtasks from IndexedDB
        try {
          const subs = await db.subtasks.where('taskId').equals(taskToEdit.id).toArray();
          if (isMounted) {
            setDraftSubtasks(subs.map((s) => ({ id: s.id, title: s.title, completed: s.completed })));
          }
        } catch (e) {
          if (isMounted) setDraftSubtasks([]);
        }
      } else {
        setTitle('');
        setDescription('');
        setPriority('medium');
        setFrequency('daily');
        setCustomDays([1, 2, 3, 4, 5]);
        setStartDate(todayStr);
        setDraftSubtasks([]);
      }
    };

    if (isOpen) {
      loadTaskData();
    }
    return () => { isMounted = false; };
  }, [taskToEdit, isOpen]);

  if (!isOpen) return null;

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    setDraftSubtasks((prev) => [
      ...prev,
      { id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`, title: newSubtaskTitle.trim(), completed: false },
    ]);
    setNewSubtaskTitle('');
  };

  const handleToggleDraftSubtask = (id: string) => {
    setDraftSubtasks((prev) =>
      prev.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s))
    );
  };

  const handleRemoveDraftSubtask = (id: string) => {
    setDraftSubtasks((prev) => prev.filter((s) => s.id !== id));
  };

  const toggleDay = (dayVal: number) => {
    if (customDays.includes(dayVal)) {
      if (customDays.length > 1) {
        setCustomDays(customDays.filter((d) => d !== dayVal));
      }
    } else {
      setCustomDays([...customDays, dayVal].sort());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitBtnState('creating');

    // Auto completion check: If subtasks exist and all are checked, full completion state triggers!
    const allSubtasksDone = draftSubtasks.length > 0 && draftSubtasks.every((s) => s.completed);
    const targetStatus = allSubtasksDone ? 'completed' : taskToEdit?.status || 'planned';
    const completedAtIso = allSubtasksDone ? new Date().toISOString() : taskToEdit?.completedAt || null;

    const taskId = taskToEdit ? taskToEdit.id : `task-${Date.now()}`;

    if (taskToEdit) {
      await db.tasks.update(taskId, {
        title: title.trim(),
        description: description.trim(),
        status: targetStatus,
        priority,
        frequency,
        customDays: frequency === 'custom' ? customDays : undefined,
        startDate,
        completedAt: completedAtIso,
        updatedAt: new Date().toISOString(),
      });

      // Clear existing subtasks for this task & bulk save current draft subtasks
      await db.subtasks.where('taskId').equals(taskId).delete();
    } else {
      await db.tasks.add({
        id: taskId,
        title: title.trim(),
        description: description.trim(),
        status: targetStatus,
        priority,
        frequency,
        customDays: frequency === 'custom' ? customDays : undefined,
        startDate,
        completedAt: completedAtIso,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // Insert updated subtasks
    if (draftSubtasks.length > 0) {
      const subtaskEntities: Subtask[] = draftSubtasks.map((s, idx) => ({
        id: s.id,
        taskId,
        title: s.title,
        completed: s.completed,
        order: idx,
      }));
      await db.subtasks.bulkAdd(subtaskEntities);
    }

    setSubmitBtnState('created');
    setTimeout(() => {
      setSubmitBtnState('idle');
      onClose();
    }, 400);
  };

  const completedSubtasksCount = draftSubtasks.filter((s) => s.completed).length;
  const isAllDraftSubtasksCompleted = draftSubtasks.length > 0 && completedSubtasksCount === draftSubtasks.length;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(12px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
      }}
      onClick={onClose}
    >
      <div
        className="liquid-panel"
        style={{
          width: '100%',
          maxWidth: '620px',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'var(--bg-secondary)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          padding: '1.75rem',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          border: '1px solid var(--border-glow)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <div>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              <Calendar size={20} style={{ color: 'var(--accent-secondary)' }} /> {taskToEdit ? 'Edit Task Specification' : 'Create New Task'}
            </h3>
            <p className="subtitle" style={{ fontSize: '0.825rem', margin: '0.2rem 0 0 0' }}>Configure priority level, subtasks, and execution scheduling.</p>
          </div>
          <button className="btn btn-secondary btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Section 1: Task Core Overview */}
          <div style={{ background: 'rgba(13, 34, 26, 0.65)', padding: '1.1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
              1. Task Specification
            </h4>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>Task Title *</label>
              <input
                type="text"
                className="form-input"
                required
                placeholder="e.g. System Architecture Security Review..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>Detailed Rationale & Scope</label>
              <textarea
                className="form-textarea"
                rows={2}
                placeholder="Task objectives, scope, or delivery specifications..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Section 2: Subtask Breakdown */}
          <div style={{ background: 'rgba(13, 34, 26, 0.65)', padding: '1.1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckSquare size={16} /> 2. Subtasks Checklist ({completedSubtasksCount}/{draftSubtasks.length})
              </h4>
              {isAllDraftSubtasksCompleted && (
                <span style={{ fontSize: '0.75rem', color: '#527653', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <CheckCircle2 size={14} /> Full Completion Satisfied
                </span>
              )}
            </div>

            {draftSubtasks.length > 0 && (
              <div className="progress-bar-track" style={{ height: '7px', marginBottom: '0.2rem' }}>
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${Math.round((completedSubtasksCount / draftSubtasks.length) * 100)}%`,
                    background: isAllDraftSubtasksCompleted ? '#527653' : 'var(--accent-secondary)',
                  }}
                />
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', maxHeight: '160px', overflowY: 'auto' }}>
              {draftSubtasks.map((st) => (
                <div key={st.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.45rem 0.75rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', flex: 1, textDecoration: st.completed ? 'line-through' : 'none', color: st.completed ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                    <input
                      type="checkbox"
                      checked={st.completed}
                      onChange={() => handleToggleDraftSubtask(st.id)}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <span>{st.title}</span>
                  </label>
                  <button type="button" className="btn btn-danger btn-icon btn-xs" onClick={() => handleRemoveDraftSubtask(st.id)}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
              <input
                type="text"
                className="form-input"
                style={{ flex: 1, fontSize: '0.85rem' }}
                placeholder="Add actionable subtask step..."
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
              />
              <button type="button" className="btn btn-secondary btn-xs" onClick={handleAddSubtask} style={{ padding: '0.5rem 0.85rem' }}>
                <Plus size={14} /> Add Step
              </button>
            </div>
          </div>

          {/* Section 3: Priority & Schedule */}
          <div style={{ background: 'rgba(13, 34, 26, 0.65)', padding: '1.1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
              3. Priority & Frequency Rules
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>Priority Level</label>
                <select className="form-select" value={priority} onChange={(e) => setPriority(e.target.value as any)}>
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                  <option value="critical">Critical Priority</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>Start Date *</label>
                <input
                  type="date"
                  className="form-input"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>Execution Frequency</label>
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <button
                  type="button"
                  className={`btn ${frequency === 'daily' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, padding: '0.65rem' }}
                  onClick={() => setFrequency('daily')}
                >
                  Daily
                </button>
                <button
                  type="button"
                  className={`btn ${frequency === 'once_a_week' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, padding: '0.65rem' }}
                  onClick={() => setFrequency('once_a_week')}
                >
                  Once a Week
                </button>
                <button
                  type="button"
                  className={`btn ${frequency === 'custom' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, padding: '0.65rem' }}
                  onClick={() => setFrequency('custom')}
                >
                  Custom Days
                </button>
              </div>

              {frequency === 'custom' && (
                <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'space-between', marginTop: '0.75rem' }}>
                  {daysOfWeek.map((d) => {
                    const selected = customDays.includes(d.value);
                    return (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => toggleDay(d.value)}
                        style={{
                          flex: 1,
                          padding: '0.5rem 0',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-color)',
                          background: selected ? 'var(--accent-primary)' : 'var(--bg-primary)',
                          color: selected ? '#ffffff' : 'var(--text-secondary)',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          transition: 'all 150ms ease',
                        }}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ padding: '0.65rem 1.25rem' }}>
              Cancel
            </button>
            <button
              type="submit"
              className={`btn btn-primary btn-morph ${submitBtnState}`}
              disabled={submitBtnState !== 'idle'}
              style={{ padding: '0.65rem 1.5rem' }}
            >
              {submitBtnState === 'creating' ? (
                'Creating...'
              ) : submitBtnState === 'created' ? (
                '✓ Created'
              ) : (
                <>
                  <Plus size={16} /> {taskToEdit ? 'Save Task Changes' : 'Add Task'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
