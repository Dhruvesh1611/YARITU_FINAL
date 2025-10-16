"use client";

import React, { useEffect, useMemo, useState } from 'react';

export default function CategoryMetaEditor({
  category, // 'MEN' | 'WOMEN' | 'CHILDREN'
  metaMap, // the current metaOptions map from page state
  onClose,
  onSaved,
}) {
  const isChildren = category === 'CHILDREN';
  const primaryChoices = isChildren
    ? [ { key: 'BOYS', label: 'BOYS' }, { key: 'GIRLS', label: 'GIRLS' } ]
    : [ { key: 'type', label: 'RENT BY TYPE' }, { key: 'occasion', label: 'RENT BY OCCASION' } ];

  const [scope, setScope] = useState(primaryChoices[0].key);
  const [items, setItems] = useState([]);
  const [originalItems, setOriginalItems] = useState([]);
  const [newValue, setNewValue] = useState("");
  const [saving, setSaving] = useState(false);

  // derive meta key in DB based on scope
  const metaKey = useMemo(() => {
    if (isChildren) {
      const subgroup = scope === 'BOYS' ? 'boys' : 'girls';
      return `collectionType_children_${subgroup}`;
    }
    if (scope === 'type') return `collectionType_${category.toLowerCase()}`;
    return `occasion_${category.toLowerCase()}`;
  }, [category, isChildren, scope]);

  // load items from provided metaMap, with sensible fallbacks for children
  useEffect(() => {
    let list = [];
    if (metaMap && Array.isArray(metaMap[metaKey])) {
      list = metaMap[metaKey].filter(v => v && v.toString().toUpperCase() !== 'OTHER');
    } else if (isChildren) {
      // no configured list? provide a minimal fallback so UI is usable
      list = scope === 'BOYS'
        ? ['SUIT','KOTI','SHIRT-PENT','DHOTI']
        : ['FROCK','LEHENGA','GOWN','ANARKALI SUITS'];
    }
    setItems(list);
    setOriginalItems(list);
  }, [metaKey, metaMap, isChildren, scope]);

  const addItem = () => {
    const v = (newValue || '').trim().toUpperCase();
    if (!v) return;
    if (v === 'OTHER') { setNewValue(''); return; }
    if (items.map(x => x.toUpperCase()).includes(v.toUpperCase())) return;
    setItems(prev => [...prev, v]);
    setNewValue("");
  };

  const removeItem = (idx) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const updateItem = (idx, v) => {
    const val = (v || '').toString().toUpperCase();
    if (val === 'OTHER') return; // ignore setting to OTHER
    const next = [...items];
    next[idx] = val;
    setItems(next);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // compute diffs
      const norm = (arr) => (arr || []).map(x => (x || '').trim()).filter(Boolean);
  const before = norm(originalItems).map(x => x.toUpperCase()).filter(x => x !== 'OTHER');
  const after = norm(items).map(x => x.toUpperCase()).filter(x => x !== 'OTHER');

  const toAdd = after.filter(v => !before.includes(v));
  const toRemove = before.filter(v => !after.includes(v));

      // perform API calls
      const addCalls = toAdd.map(v => fetch('/api/meta-options', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: metaKey, value: v })
      }));
      const delCalls = toRemove.map(v => fetch('/api/meta-options', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: metaKey, value: v })
      }));

      const res = await Promise.allSettled([...addCalls, ...delCalls]);
      const hasError = res.some(r => r.status === 'rejected');
      if (hasError) console.warn('Some meta-option updates failed:', res);

      // build updated meta map for parent
      const updated = { ...(metaMap || {}) };
      updated[metaKey] = after;
      onSaved && onSaved(updated);
      onClose && onClose();
    } catch (e) {
      console.error('Save meta options failed', e);
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="metaEditorOverlay" onClick={onClose}>
      <div className="metaEditor" onClick={(e) => e.stopPropagation()}>
        <div className="header">
          <h3>Edit {category} Options</h3>
        </div>
        <div className="body">
          <div className="row">
            <label>Choose set</label>
            <select value={scope} onChange={(e) => setScope(e.target.value)}>
              {primaryChoices.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
          </div>

          <div className="list">
            {items.map((v, idx) => (
              <div key={idx} className="itemRow">
                <input value={v} onChange={(e) => updateItem(idx, e.target.value)} />
                <button className="danger" onClick={() => removeItem(idx)}>Delete</button>
              </div>
            ))}
            <div className="itemRow">
              <input placeholder="Add new..." value={newValue} onChange={(e) => setNewValue(e.target.value)} />
              <button onClick={addItem}>Add</button>
            </div>
          </div>
        </div>
        <div className="footer">
          <button onClick={onClose} disabled={saving}>Cancel</button>
          <button className="primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </div>

      <style jsx>{`
        .metaEditorOverlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .metaEditor { width: 560px; max-width: 95%; background: #fff; border-radius: 12px; padding: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
        .header h3 { margin: 0 0 12px; }
        .row { display: flex; gap: 12px; align-items: center; margin-bottom: 12px; }
        .row select { padding: 8px; border-radius: 6px; border: 1px solid #ccc; }
        .list { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; }
        .itemRow { display: flex; gap: 8px; }
        .itemRow input { flex: 1; padding: 8px 10px; border: 1px solid #ccc; border-radius: 6px; }
        .itemRow button { padding: 8px 12px; border: 1px solid #ccc; border-radius: 6px; background: #f5f5f5; cursor: pointer; }
        .itemRow button.danger { background: #fee2e2; border-color: #fecaca; color: #7f1d1d; }
        .footer { display: flex; justify-content: flex-end; gap: 12px; margin-top: 16px; padding-top: 12px; border-top: 1px solid #eee; }
        .footer .primary { background: #111; color: #fff; border-color: #111; }
      `}</style>
    </div>
  );
}
