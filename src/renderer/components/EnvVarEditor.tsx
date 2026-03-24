import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { EnvVar } from '../../shared/types';

interface Props {
  vars: EnvVar[];
  onChange: (vars: EnvVar[]) => void;
  readOnly?: boolean;
}

export function EnvVarEditor({ vars, onChange, readOnly }: Props) {
  const handleUpdate = (index: number, field: keyof EnvVar, value: string | boolean) => {
    const updated = [...vars];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const handleAdd = () => {
    onChange([...vars, { key: '', value: '', enabled: true }]);
  };

  const handleRemove = (index: number) => {
    onChange(vars.filter((_, i) => i !== index));
  };

  return (
    <div>
      {vars.length === 0 && !readOnly && (
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
          No environment variables configured. Click + to add one.
        </p>
      )}

      {vars.map((v, i) => (
        <div key={i} className="env-row">
          <label className="checkbox-wrapper">
            <input
              type="checkbox"
              checked={v.enabled}
              onChange={e => handleUpdate(i, 'enabled', e.target.checked)}
              disabled={readOnly}
            />
          </label>
          <input
            className="form-input"
            placeholder="KEY"
            value={v.key}
            onChange={e => handleUpdate(i, 'key', e.target.value)}
            readOnly={readOnly}
            style={{ fontWeight: 600 }}
          />
          <input
            className="form-input"
            placeholder="value"
            value={v.value}
            onChange={e => handleUpdate(i, 'value', e.target.value)}
            readOnly={readOnly}
          />
          {!readOnly && (
            <button className="btn btn-icon btn-danger" onClick={() => handleRemove(i)}>
              <Trash2 size={14} />
            </button>
          )}
        </div>
      ))}

      {!readOnly && (
        <button className="btn btn-sm" onClick={handleAdd} style={{ marginTop: 8 }}>
          <Plus size={12} /> Add Variable
        </button>
      )}
    </div>
  );
}
