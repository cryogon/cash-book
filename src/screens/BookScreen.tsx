import { useState } from 'react';
import { AddTransactionModal } from '../components/AddTransactionModal';
import type { Book, Transaction } from '../types';

interface BookScreenProps {
  book: Book;
  transactions: Transaction[];
  onBack: () => void;
  onAddTransaction: (title: string, description: string, amount: number, type: 'in' | 'out') => void;
}

export function BookScreen({ book, transactions, onBack, onAddTransaction }: BookScreenProps) {
  const [modalType, setModalType] = useState<'in' | 'out' | null>(null);

  const cashIn  = transactions.filter(t => t.type === 'in').reduce((s, t) => s + t.amount, 0);
  const cashOut = transactions.filter(t => t.type === 'out').reduce((s, t) => s + t.amount, 0);
  const total   = cashIn - cashOut;

  return (
    <div className="screen">
      {/* ── Header ── */}
      <div style={{ padding: '48px 20px 0', textAlign: 'center' }}>

        {/* Back */}
        <button
          onClick={onBack}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: '0.875rem', color: 'var(--muted)', background: 'none',
            border: 'none', cursor: 'pointer', padding: '4px 0', marginBottom: 8,
          }}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Books
        </button>

        {/* Title */}
        <h1 className="page-title">{book.title}</h1>

        {/* Description */}
        {book.description && (
          <p style={{ fontSize: '0.875rem', color: 'var(--muted)', marginTop: 6, lineHeight: 1.5 }}>
            {book.description}
          </p>
        )}

        {/* ── Summary ── */}
        <div style={{ marginTop: 20, textAlign: 'left' }}>
          <SummaryRow label="Cash In"  value={cashIn}  color="var(--green)" />
          <SummaryRow label="Cash Out" value={cashOut} color="var(--red)"   />
          <SummaryRow
            label="Total"
            value={total}
            color={total >= 0 ? 'var(--green)' : 'var(--red)'}
            bold
          />
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--divider)', margin: '16px 0 4px' }} />
      </div>

      {/* ── Transactions list ── */}
      <div style={{ flex: 1, padding: '8px 16px 120px', overflowY: 'auto' }}>
        {transactions.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', height: 180, gap: 10,
            color: 'var(--muted)', fontSize: '0.875rem',
          }}>
            <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" opacity={0.35}>
              <rect x="2" y="3" width="20" height="18" rx="3" />
              <line x1="8" y1="9" x2="16" y2="9" />
              <line x1="8" y1="13" x2="13" y2="13" />
            </svg>
            No transactions yet
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {transactions.map(tx => (
              <div
                key={tx.id}
                style={{
                  background: 'var(--surface)', borderRadius: 'var(--radius-card)',
                  padding: '14px 18px', display: 'flex',
                  alignItems: 'center', justifyContent: 'space-between',
                }}
              >
                <div style={{ flex: 1, minWidth: 0, marginRight: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {tx.title}
                  </div>
                  {tx.description && (
                    <div style={{ fontSize: '0.8125rem', color: 'var(--muted)', marginTop: 2,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {tx.description}
                    </div>
                  )}
                </div>
                <span style={{
                  fontWeight: 700, fontSize: '1rem', flexShrink: 0, fontVariantNumeric: 'tabular-nums',
                  color: tx.type === 'in' ? 'var(--green)' : 'var(--red)',
                }}>
                  {fmt(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Bottom buttons ── */}
      <div style={{
        position: 'fixed', bottom: 0,
        left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 430,
        display: 'flex', gap: 12, padding: '12px 16px 32px',
        background: 'linear-gradient(to top, var(--bg) 70%, transparent)',
      }}>
        <button className="btn-green" onClick={() => setModalType('in')}>Cash In</button>
        <button className="btn-red"   onClick={() => setModalType('out')}>Cash Out</button>
      </div>

      {/* ── Add transaction sheet ── */}
      <AddTransactionModal
        open={modalType !== null}
        type={modalType ?? 'in'}
        onClose={() => setModalType(null)}
        onAdd={(title, description, amount) => {
          if (!modalType) return;
          onAddTransaction(title, description, amount, modalType);
        }}
      />
    </div>
  );
}

interface SummaryRowProps {
  label: string;
  value: number;
  color: string;
  bold?: boolean;
}

function SummaryRow({ label, value, color, bold }: SummaryRowProps) {
  const fw = bold ? 800 : 700;
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
      <span style={{ width: 80, fontWeight: fw, fontSize: '0.9375rem', color: 'var(--text)' }}>
        {label}
      </span>
      <span style={{ fontWeight: fw, fontSize: '0.9375rem', color: 'var(--muted)' }}>:</span>
      <span style={{ fontWeight: fw, fontSize: '0.9375rem', color, fontVariantNumeric: 'tabular-nums' }}>
        {fmt(Math.abs(value))}
      </span>
    </div>
  );
}

function fmt(n: number): string {
  return n.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}
