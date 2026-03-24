import React from 'react';
import { GraphicsBackend, BACKEND_INFO } from '../../shared/types';

interface Props {
  selected: GraphicsBackend;
  onChange: (backend: GraphicsBackend) => void;
}

export function BackendSelector({ selected, onChange }: Props) {
  return (
    <div>
      <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>
        Select the rendering backend for this bottle. This determines how Direct3D calls are translated to Metal/Vulkan/OpenGL on macOS.
      </p>

      {Object.values(GraphicsBackend).map(b => {
        const info = BACKEND_INFO[b];
        const badgeClass =
          b === GraphicsBackend.D3DMetal ? 'badge-green' :
          b === GraphicsBackend.DXMT ? 'badge-orange' :
          b === GraphicsBackend.DXVK ? 'badge-yellow' : 'badge-purple';

        return (
          <div
            key={b}
            className={`backend-option ${selected === b ? 'selected' : ''}`}
            onClick={() => onChange(b)}
          >
            <div className="radio" />
            <div className="backend-info">
              <h4>
                {info.label}
                {' '}
                <span className={`badge ${badgeClass}`}>{info.tag}</span>
              </h4>
              <p>{info.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
