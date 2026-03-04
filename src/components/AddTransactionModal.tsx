import { useState } from 'react';
import { BottomSheet } from './BottomSheet';

interface AddTransactionModalProps {
  open: boolean;
  type: 'in' | 'out';
  onClose: () => void;
  onAdd: (title: string, description: string, amount: number) => void;
}

export function AddTransactionModal({ open, type, onClose, onAdd }: AddTransactionModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');

  const isCashIn = type === 'in';
  const accentColor = isCashIn ? 'var(--green)' : 'var(--red)';

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (!title.trim() || isNaN(parsed) || parsed <= 0) return;
    onAdd(title.trim(), description.trim(), parsed);
    reset();
    onClose();
  }

  function reset() {
    setTitle('');
    setDescription('');
    setAmount('');
  }

  function handleClose() {
    reset();
    onClose();
  }

  return (
    <BottomSheet open={open} onClose={handleClose}>
      <span
        className="sheet-title"
        style={{ borderBottomColor: accentColor }}
      >
        {isCashIn ? 'Cash In' : 'Cash Out'}
      </span>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label className="field-label">Title</label>
          <input
            className="field-input"
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder=""
            autoFocus
          />
        </div>

        <div>
          <label className="field-label">Amount</label>
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
              fontSize: '0.9375rem', color: 'var(--muted)', pointerEvents: 'none',
            }}>
              Rs.
            </span>
            <input
              className="field-input"
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0"
              style={{ paddingLeft: 40 }}
            />
          </div>
        </div>

        <div>
          <label className="field-label">
            Description{' '}
            <span style={{ fontWeight: 400, color: 'var(--muted)', fontSize: '0.85rem' }}>(optional)</span>
          </label>
          <input
            className="field-input"
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder=""
          />
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button type="button" className="btn-ghost" onClick={handleClose}>
            Cancel
          </button>
          <button
            type="submit"
            disabled={!title.trim() || !amount || parseFloat(amount) <= 0}
            style={{
              flex: 1, padding: 15, borderRadius: 999, border: 'none',
              background: accentColor, color: '#fff',
              fontSize: '1rem', fontWeight: 700, fontFamily: 'inherit',
              cursor: 'pointer', opacity: (!title.trim() || !amount || parseFloat(amount) <= 0) ? 0.45 : 1,
              transition: 'opacity 0.15s, transform 0.12s',
            }}
          >
            Add
          </button>
        </div>
      </form>
    </BottomSheet>
  );
}
