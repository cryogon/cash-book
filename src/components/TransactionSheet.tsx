import { useState, useEffect } from 'react';
import { BottomSheet } from './BottomSheet';
import type { Transaction } from '../types';

interface TransactionSheetProps {
  open: boolean;
  /** Initial type when adding. Ignored in edit mode (type comes from the transaction). */
  initialType?: 'in' | 'out';
  /** Pass a transaction to edit it; omit to add a new one */
  transaction?: Transaction | null;
  onClose: () => void;
  onSave: (title: string, description: string, amount: number, type: 'in' | 'out') => void;
}

export function TransactionSheet({
  open,
  initialType = 'in',
  transaction,
  onClose,
  onSave,
}: TransactionSheetProps) {
  const isEdit = !!transaction;

  const [type, setType] = useState<'in' | 'out'>(initialType);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');

  // Sync whenever sheet opens or target transaction changes
  useEffect(() => {
    if (open) {
      if (transaction) {
        setType(transaction.type);
        setTitle(transaction.title);
        setDescription(transaction.description);
        setAmount(String(transaction.amount));
      } else {
        setType(initialType);
        setTitle('');
        setDescription('');
        setAmount('');
      }
    }
  }, [open, transaction, initialType]);

  const accentColor = type === 'in' ? 'var(--green)' : 'var(--red)';
  const canSubmit = title.trim() && amount && parseFloat(amount) > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (!title.trim() || isNaN(parsed) || parsed <= 0) return;
    onSave(title.trim(), description.trim(), parsed, type);
    onClose();
  }

  return (
    <BottomSheet open={open} onClose={onClose}>
      {/* Header row: title + type toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
        <span className="sheet-title" style={{ borderBottomColor: accentColor, marginBottom: 0 }}>
          {isEdit ? 'Edit Transaction' : type === 'in' ? 'Cash In' : 'Cash Out'}
        </span>

        {/* Type toggle — visible in both add and edit */}
        <div style={{
          display: 'flex', borderRadius: 999,
          background: 'var(--input-bg)', padding: 3, gap: 2,
        }}>
          <ToggleBtn active={type === 'in'}  color="var(--green)" onClick={() => setType('in')}>In</ToggleBtn>
          <ToggleBtn active={type === 'out'} color="var(--red)"   onClick={() => setType('out')}>Out</ToggleBtn>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label className="field-label">Title</label>
          <input
            className="field-input"
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
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
          />
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button
            type="submit"
            disabled={!canSubmit}
            style={{
              flex: 1, padding: 15, borderRadius: 999, border: 'none',
              background: accentColor, color: '#fff',
              fontSize: '1rem', fontWeight: 700, fontFamily: 'inherit',
              cursor: 'pointer',
              opacity: canSubmit ? 1 : 0.45,
              transition: 'opacity 0.15s, transform 0.12s',
            }}
          >
            {isEdit ? 'Save' : 'Add'}
          </button>
        </div>
      </form>
    </BottomSheet>
  );
}

function ToggleBtn({
  active, color, onClick, children,
}: { active: boolean; color: string; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '5px 14px', borderRadius: 999, border: 'none',
        fontSize: '0.8125rem', fontWeight: 700, fontFamily: 'inherit',
        cursor: 'pointer',
        background: active ? color : 'transparent',
        color: active ? '#fff' : 'var(--muted)',
        transition: 'background 0.15s, color 0.15s',
      }}
    >
      {children}
    </button>
  );
}
