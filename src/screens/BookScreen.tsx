import { useState, useEffect, useRef } from 'react';
import { Pencil, Trash2, Search, X, ArrowDownUp, FileDown } from 'lucide-react';
import { TransactionSheet } from '../components/TransactionSheet';
import { ConfirmSheet } from '../components/ConfirmSheet';
import { ActionMenu, ActionMenuDivider, ActionItem } from '../components/ActionMenu';
import { ImageViewer } from '../components/ImageViewer';
import { loadImage } from '../imageStore';
import type { Book, Transaction, Settings } from '../types';

interface BookScreenProps {
  book: Book;
  transactions: Transaction[];
  settings: Settings;
  onBack: () => void;
  onAddTransaction: (title: string, description: string, amount: number, type: 'in' | 'out', date: string, tags: string[], imageId?: string) => void;
  onEditTransaction: (id: string, title: string, description: string, amount: number, type: 'in' | 'out', date: string, tags: string[], imageId?: string, removedImageId?: string) => void;
  onDeleteTransaction: (id: string) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return n.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function fmtDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
}

function exportCSV(book: Book, transactions: Transaction[], currencySymbol: string) {
  const header = ['Date', 'Title', 'Description', 'Type', `Amount (${currencySymbol})`, 'Tags'];
  const rows = transactions.map(t => [
    t.date,
    `"${t.title.replace(/"/g, '""')}"`,
    `"${(t.description ?? '').replace(/"/g, '""')}"`,
    t.type === 'in' ? 'Cash In' : 'Cash Out',
    t.amount.toFixed(2),
    `"${(t.tags ?? []).join(', ')}"`,
  ]);
  const csv = [header, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${book.title.replace(/\s+/g, '_')}_transactions.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Component ─────────────────────────────────────────────────────────────────

export function BookScreen({
  book, transactions, settings, onBack,
  onAddTransaction, onEditTransaction, onDeleteTransaction,
}: BookScreenProps) {
  const cur = settings.currencySymbol;

  // Sheet / modal state
  const [sheetInitialType, setSheetInitialType] = useState<'in' | 'out'>('in');
  const [sheetOpen,  setSheetOpen]  = useState(false);
  const [editingTx,  setEditingTx]  = useState<Transaction | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [viewerUrl,  setViewerUrl]  = useState<string | null>(null);

  // Filters / sort
  const [search,   setSearch]   = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'in' | 'out'>('all');
  const [sortAsc,  setSortAsc]  = useState(false); // false = newest first

  // Compute filtered + sorted list
  const displayed = transactions
    .filter(t => {
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        (t.description ?? '').toLowerCase().includes(q) ||
        (t.tags ?? []).some(tag => tag.includes(q))
      );
    })
    .slice()
    .sort((a, b) => {
      const diff = new Date(a.date).getTime() - new Date(b.date).getTime()
        || a.createdAt - b.createdAt;
      return sortAsc ? diff : -diff;
    });

  // Running balance (computed on the displayed, chronological order)
  const chronological = [...displayed].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.createdAt - b.createdAt
  );
  let runningBalance = 0;
  const balanceMap: Record<string, number> = {};
  for (const t of chronological) {
    runningBalance += t.type === 'in' ? t.amount : -t.amount;
    balanceMap[t.id] = runningBalance;
  }

  // Totals from all (unfiltered) transactions
  const cashIn  = transactions.filter(t => t.type === 'in').reduce((s, t) => s + t.amount, 0);
  const cashOut = transactions.filter(t => t.type === 'out').reduce((s, t) => s + t.amount, 0);
  const total   = cashIn - cashOut;

  function openAddSheet(type: 'in' | 'out') {
    setEditingTx(null); setSheetInitialType(type); setSheetOpen(true);
  }
  function openEditSheet(tx: Transaction) {
    setMenuOpenId(null); setEditingTx(tx); setSheetOpen(true);
  }
  function handleSave(
    title: string, description: string, amount: number, type: 'in' | 'out',
    date: string, tags: string[], imageId?: string, removedImageId?: string,
  ) {
    if (editingTx) {
      onEditTransaction(editingTx.id, title, description, amount, type, date, tags, imageId, removedImageId);
    } else {
      onAddTransaction(title, description, amount, type, date, tags, imageId);
    }
    setSheetOpen(false); setEditingTx(null);
  }
  function confirmDelete(id: string) { setMenuOpenId(null); setDeletingId(id); }
  function doDelete() { if (deletingId) onDeleteTransaction(deletingId); setDeletingId(null); }
  function toggleMenu(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setMenuOpenId(prev => (prev === id ? null : id));
  }

  const deletingTx = transactions.find(t => t.id === deletingId);

  return (
    <div className="screen" onClick={() => setMenuOpenId(null)}>
      {/* ── Header ── */}
      <div style={{ padding: '48px 20px 0', textAlign: 'center' }}>
        <button onClick={onBack} style={{
          display: 'flex', alignItems: 'center', gap: 4,
          fontSize: '0.875rem', color: 'var(--muted)', background: 'none',
          border: 'none', cursor: 'pointer', padding: '4px 0', marginBottom: 8,
        }}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Books
        </button>

        <h1 className="page-title">{book.title}</h1>
        {book.description && (
          <p style={{ fontSize: '0.875rem', color: 'var(--muted)', marginTop: 6, lineHeight: 1.5 }}>
            {book.description}
          </p>
        )}

        {/* Summary */}
        <div style={{ marginTop: 20, textAlign: 'left' }}>
          <SummaryRow label="Cash In"  value={cashIn}  color="var(--green)" cur={cur} />
          <SummaryRow label="Cash Out" value={cashOut} color="var(--red)"   cur={cur} />
          <SummaryRow label="Total" value={total} color={total >= 0 ? 'var(--green)' : 'var(--red)'} cur={cur} bold />
        </div>
        <div style={{ height: 1, background: 'var(--divider)', margin: '16px 0 4px' }} />
      </div>

      {/* ── Toolbar: search + sort + filter + export ── */}
      <div style={{ padding: '10px 16px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Search bar */}
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--muted)', pointerEvents: 'none',
          }} />
          <input
            className="field-input"
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search title, note, tag…"
            style={{ paddingLeft: 34, paddingRight: search ? 34 : 14 }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)',
              display: 'flex', padding: 2,
            }}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter chips + sort + export */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {(['all', 'in', 'out'] as const).map(f => (
            <button
              key={f}
              onClick={() => setTypeFilter(f)}
              style={{
                padding: '5px 12px', borderRadius: 999, border: 'none',
                fontSize: '0.8rem', fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
                background: typeFilter === f ? 'var(--text)' : 'var(--surface)',
                color: typeFilter === f ? 'var(--bg)' : 'var(--muted)',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              {f === 'all' ? 'All' : f === 'in' ? 'In' : 'Out'}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          {/* Sort toggle */}
          <button
            onClick={() => setSortAsc(p => !p)}
            title={sortAsc ? 'Oldest first' : 'Newest first'}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '5px 10px', borderRadius: 999, border: 'none',
              fontSize: '0.8rem', fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
              background: 'var(--surface)', color: 'var(--muted)',
            }}
          >
            <ArrowDownUp size={13} />
            {sortAsc ? 'Oldest' : 'Newest'}
          </button>
          {/* Export CSV */}
          <button
            onClick={() => exportCSV(book, transactions, cur)}
            title="Export CSV"
            style={{
              display: 'flex', alignItems: 'center',
              padding: '5px 10px', borderRadius: 999, border: 'none',
              fontSize: '0.8rem', fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
              background: 'var(--surface)', color: 'var(--muted)',
            }}
          >
            <FileDown size={15} />
          </button>
        </div>
      </div>

      {/* ── Transactions list ── */}
      <div style={{ flex: 1, padding: '10px 16px 120px', overflowY: 'auto' }}>
        {displayed.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', height: 160, gap: 10,
            color: 'var(--muted)', fontSize: '0.875rem',
          }}>
            <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.5" opacity={0.3}>
              <rect x="2" y="3" width="20" height="18" rx="3" />
              <line x1="8" y1="9" x2="16" y2="9" />
              <line x1="8" y1="13" x2="13" y2="13" />
            </svg>
            {transactions.length === 0 ? 'No transactions yet' : 'No results'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {displayed.map(tx => {
              const menuOpen = menuOpenId === tx.id;
              const balance  = balanceMap[tx.id];
              return (
                <div key={tx.id} style={{ position: 'relative' }}>
                  <SwipeToDelete onDelete={() => confirmDelete(tx.id)}>
                    <div style={{
                      background: 'var(--surface)', borderRadius: 'var(--radius-card)',
                      padding: '12px 16px',
                    }}>
                      {/* Top row */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text)',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>{tx.title}</div>
                          {tx.description && (
                            <div style={{
                              fontSize: '0.8125rem', color: 'var(--muted)', marginTop: 1,
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>{tx.description}</div>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                          <span style={{
                            fontWeight: 700, fontSize: '1rem', fontVariantNumeric: 'tabular-nums',
                            color: tx.type === 'in' ? 'var(--green)' : 'var(--red)',
                          }}>
                            {tx.type === 'out' ? '−' : '+'}{cur}{fmt(tx.amount)}
                          </span>
                          <button onClick={e => toggleMenu(tx.id, e)} style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: 'var(--muted)', fontSize: '1.1rem', lineHeight: 1, padding: '2px 0',
                          }} aria-label="Transaction options">⋯</button>
                        </div>
                      </div>

                      {/* Bottom meta row: date + tags + running balance */}
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        marginTop: 6, flexWrap: 'wrap', gap: 4,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                            {fmtDate(tx.date)}
                          </span>
                          {(tx.tags ?? []).map(tag => (
                            <span key={tag} style={{
                              fontSize: '0.7rem', fontWeight: 600,
                              background: 'var(--input-bg)', color: 'var(--muted)',
                              borderRadius: 999, padding: '1px 8px',
                            }}>{tag}</span>
                          ))}
                        </div>
                        <span style={{
                          fontSize: '0.75rem', fontWeight: 700,
                          color: balance >= 0 ? 'var(--green)' : 'var(--red)',
                          fontVariantNumeric: 'tabular-nums',
                        }}>
                          {cur}{fmt(Math.abs(balance))}
                        </span>
                      </div>

                      {/* Image thumbnail */}
                      {tx.imageId && (
                        <TxImage imageId={tx.imageId} onOpen={url => setViewerUrl(url)} />
                      )}
                    </div>
                  </SwipeToDelete>

                  {/* Action menu */}
                  {menuOpen && (
                    <div onClick={e => e.stopPropagation()}>
                      <ActionMenu top={6} right={6}>
                        <ActionItem icon={<Pencil size={15} />} label="Edit"   onClick={() => openEditSheet(tx)} />
                        <ActionMenuDivider />
                        <ActionItem icon={<Trash2 size={15} />} label="Delete" danger onClick={() => confirmDelete(tx.id)} />
                      </ActionMenu>
                    </div>
                  )}
                </div>
              );
            })}
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
        <button className="btn-green" onClick={() => openAddSheet('in')}>Cash In</button>
        <button className="btn-red"   onClick={() => openAddSheet('out')}>Cash Out</button>
      </div>

      {/* ── Sheets ── */}
      <TransactionSheet
        open={sheetOpen}
        initialType={sheetInitialType}
        transaction={editingTx}
        currencySymbol={cur}
        onClose={() => { setSheetOpen(false); setEditingTx(null); }}
        onSave={handleSave}
      />

      <ConfirmSheet
        open={deletingId !== null}
        title="Delete transaction?"
        message={deletingTx ? `"${deletingTx.title}" will be permanently removed.` : ''}
        onConfirm={doDelete}
        onCancel={() => setDeletingId(null)}
      />

      {viewerUrl && <ImageViewer url={viewerUrl} onClose={() => setViewerUrl(null)} />}
    </div>
  );
}

// ── SwipeToDelete ─────────────────────────────────────────────────────────────

function SwipeToDelete({ children, onDelete }: { children: React.ReactNode; onDelete: () => void }) {
  const [offset, setOffset]     = useState(0);
  const [swiping, setSwiping]   = useState(false);
  const startX  = useRef<number | null>(null);
  const THRESHOLD = 80;

  function onTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX;
    setSwiping(false);
  }
  function onTouchMove(e: React.TouchEvent) {
    if (startX.current === null) return;
    const dx = e.touches[0].clientX - startX.current;
    if (dx < -4) { setSwiping(true); setOffset(Math.max(dx, -THRESHOLD * 1.4)); }
  }
  function onTouchEnd() {
    if (offset < -THRESHOLD) {
      // Snap all the way out then trigger delete
      setOffset(-400);
      setTimeout(() => { onDelete(); setOffset(0); }, 220);
    } else {
      setOffset(0);
    }
    setSwiping(false);
    startX.current = null;
  }

  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 'var(--radius-card)' }}>
      {/* Delete background */}
      <div style={{
        position: 'absolute', inset: 0, background: 'var(--red)',
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
        paddingRight: 20, borderRadius: 'var(--radius-card)',
      }}>
        <Trash2 size={20} color="#fff" />
      </div>
      {/* Sliding content */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          transform: `translateX(${offset}px)`,
          transition: swiping ? 'none' : 'transform 0.22s cubic-bezier(0.22,1,0.36,1)',
          willChange: 'transform',
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ── TxImage ───────────────────────────────────────────────────────────────────

function TxImage({ imageId, onOpen }: { imageId: string; onOpen: (url: string) => void }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let objectUrl: string | null = null;
    loadImage(imageId).then(u => { objectUrl = u; setUrl(u); });
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [imageId]);
  if (!url) return null;
  return (
    <img src={url} alt="Attachment"
      onClick={e => { e.stopPropagation(); onOpen(url); }}
      style={{ marginTop: 10, width: '100%', maxHeight: 140, objectFit: 'cover', borderRadius: 8, display: 'block', cursor: 'zoom-in' }}
    />
  );
}

// ── SummaryRow ────────────────────────────────────────────────────────────────

interface SummaryRowProps { label: string; value: number; color: string; cur: string; bold?: boolean; }
function SummaryRow({ label, value, color, cur, bold }: SummaryRowProps) {
  const fw = bold ? 800 : 700;
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
      <span style={{ width: 80, fontWeight: fw, fontSize: '0.9375rem', color: 'var(--text)' }}>{label}</span>
      <span style={{ fontWeight: fw, fontSize: '0.9375rem', color: 'var(--muted)' }}>:</span>
      <span style={{ fontWeight: fw, fontSize: '0.9375rem', color, fontVariantNumeric: 'tabular-nums' }}>
        {cur}{fmt(Math.abs(value))}
      </span>
    </div>
  );
}
