import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { DllOverride, DllOverrideMode } from '../../shared/types';

interface Props {
  overrides: DllOverride[];
  onChange: (overrides: DllOverride[]) => void;
}

const MODES: { value: DllOverrideMode; label: string }[] = [
  { value: 'native', label: 'Native (Windows)' },
  { value: 'builtin', label: 'Builtin (Wine)' },
  { value: 'native,builtin', label: 'Native then Builtin' },
  { value: 'builtin,native', label: 'Builtin then Native' },
  { value: 'disabled', label: 'Disabled' },
  { value: '', label: 'Default' },
];

export function DllOverrideEditor({ overrides, onChange }: Props) {
  const handleUpdate = (index: number, field: keyof DllOverride, value: string) => {
    const updated = [...overrides];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const handleAdd = () => {
    onChange([...overrides, { name: '', mode: 'native' }]);
  };

  const handleRemove = (index: number) => {
    onChange(overrides.filter((_, i) => i !== index));
  };

  return (
    <div>
      <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
        DLL overrides control whether Wine uses its built-in implementation or a native Windows DLL.
        Backend-specific overrides are managed automatically.
      </p>

      {overrides.length === 0 && (
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
          No custom DLL overrides. Click + to add one.
        </p>
      )}

      {overrides.map((o, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, marginBottom: 6, alignItems: 'center' }}>
          <input
            className="form-input"
            placeholder="dll name (e.g. d3d11)"
            value={o.name}
            onChange={e => handleUpdate(i, 'name', e.target.value)}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}
          />
          <select
            className="form-select"
            value={o.mode}
            onChange={e => handleUpdate(i, 'mode', e.target.value)}
          >
            {MODES.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <button className="btn btn-icon btn-danger" onClick={() => handleRemove(i)}>
            <Trash2 size={14} />
          </button>
        </div>
      ))}

      <button className="btn btn-sm" onClick={handleAdd} style={{ marginTop: 8 }}>
        <Plus size={12} /> Add Override
      </button>
    </div>
  );
}
