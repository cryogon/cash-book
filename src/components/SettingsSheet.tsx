import { useState, useEffect } from 'react';
import { BottomSheet } from './BottomSheet';
import type { Settings } from '../types';

interface SettingsSheetProps {
  open: boolean;
  settings: Settings;
  onClose: () => void;
  onSave: (patch: Partial<Settings>) => void;
}

const PRESETS = ['Rs.', '$', '€', '£', '¥', '₹', 'AED'];

export function SettingsSheet({ open, settings, onClose, onSave }: SettingsSheetProps) {
  const [symbol, setSymbol] = useState(settings.currencySymbol);

  useEffect(() => {
    if (open) setSymbol(settings.currencySymbol);
  }, [open, settings.currencySymbol]);

  function handleSave() {
    onSave({ currencySymbol: symbol.trim() || 'Rs.' });
    onClose();
  }

  return (
    <BottomSheet open={open} onClose={onClose}>
      <span className="sheet-title">Settings</span>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 8 }}>
        <div>
          <label className="field-label">Currency symbol</label>
          {/* Quick-pick presets */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
            {PRESETS.map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setSymbol(p)}
                style={{
                  padding: '6px 14px', borderRadius: 999, border: 'none',
                  fontWeight: 700, fontSize: '0.875rem', fontFamily: 'inherit',
                  cursor: 'pointer',
                  background: symbol === p ? 'var(--blue)' : 'var(--input-bg)',
                  color: symbol === p ? '#fff' : 'var(--text)',
                  transition: 'background 0.15s, color 0.15s',
                }}
              >
                {p}
              </button>
            ))}
          </div>
          {/* Custom input */}
          <input
            className="field-input"
            type="text"
            value={symbol}
            onChange={e => setSymbol(e.target.value)}
            placeholder="or type a custom symbol"
            maxLength={6}
          />
        </div>

        <button className="btn-primary" onClick={handleSave}>Save</button>
      </div>
    </BottomSheet>
  );
}
