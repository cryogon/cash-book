import { useState } from 'react';
import { Pencil, Trash2, Settings2 } from 'lucide-react';
import { BookIcon } from '../components/BookIcon';
import { BookSheet } from '../components/BookSheet';
import { ConfirmSheet } from '../components/ConfirmSheet';
import { SettingsSheet } from '../components/SettingsSheet';
import { ActionMenu, ActionMenuDivider, ActionItem } from '../components/ActionMenu';
import type { Book, Settings } from '../types';

interface HomeScreenProps {
  books: Book[];
  settings: Settings;
  onUpdateSettings: (patch: Partial<Settings>) => void;
  onAddBook: (title: string, description: string) => void;
  onEditBook: (id: string, title: string, description: string) => void;
  onDeleteBook: (id: string) => void;
  onSelectBook: (book: Book) => void;
  getBookTransactionCount: (bookId: string) => number;
}

export function HomeScreen({
  books, settings, onUpdateSettings,
  onAddBook, onEditBook, onDeleteBook,
  onSelectBook, getBookTransactionCount,
}: HomeScreenProps) {
  const [sheetOpen,     setSheetOpen]     = useState(false);
  const [editingBook,   setEditingBook]   = useState<Book | null>(null);
  const [deletingBook,  setDeletingBook]  = useState<Book | null>(null);
  const [settingsOpen,  setSettingsOpen]  = useState(false);
  const [menuOpenId,    setMenuOpenId]    = useState<string | null>(null);

  function openAddSheet() { setEditingBook(null); setSheetOpen(true); }
  function openEditSheet(book: Book) { setMenuOpenId(null); setEditingBook(book); setSheetOpen(true); }

  function handleSave(title: string, description: string) {
    if (editingBook) onEditBook(editingBook.id, title, description);
    else             onAddBook(title, description);
    setSheetOpen(false); setEditingBook(null);
  }

  function requestDelete(book: Book) { setMenuOpenId(null); setDeletingBook(book); }
  function doDelete() { if (deletingBook) onDeleteBook(deletingBook.id); setDeletingBook(null); }

  function toggleMenu(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setMenuOpenId(prev => (prev === id ? null : id));
  }

  return (
    <div className="screen" onClick={() => setMenuOpenId(null)}>
      {/* ── Header ── */}
      <div style={{ paddingTop: 52, paddingBottom: 8, textAlign: 'center', position: 'relative' }}>
        <h1 className="page-title">Books</h1>
        <div className="title-underline" />

        {/* Settings gear */}
        <button
          onClick={e => { e.stopPropagation(); setSettingsOpen(true); }}
          style={{
            position: 'absolute', top: 52, right: 16,
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--muted)', display: 'flex', padding: 4,
          }}
          aria-label="Settings"
        >
          <Settings2 size={20} />
        </button>
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, padding: '12px 16px 100px' }}>
        {books.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', minHeight: '60vh',
          }}>
            <BookIcon style={{ width: 160, marginBottom: 20, opacity: 0.9 }} />
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', textAlign: 'center', lineHeight: 1.6 }}>
              no books available<br />
              press <strong style={{ color: 'var(--text)' }}>"+"</strong> to add
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
            {books.map(book => {
              const count    = getBookTransactionCount(book.id);
              const menuOpen = menuOpenId === book.id;
              return (
                <div key={book.id} style={{ position: 'relative' }}>
                  <div
                    onClick={() => { setMenuOpenId(null); onSelectBook(book); }}
                    style={{
                      width: '100%', textAlign: 'left',
                      background: 'var(--surface)', borderRadius: 'var(--radius-card)',
                      padding: '16px 18px', cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text)', flex: 1 }}>
                        {book.title}
                      </div>
                      <button
                        onClick={e => toggleMenu(book.id, e)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          padding: '0 2px', color: 'var(--muted)', flexShrink: 0,
                          fontSize: '1.2rem', lineHeight: 1, marginTop: -2,
                        }}
                        aria-label="Book options"
                      >⋯</button>
                    </div>
                    {book.description && (
                      <div style={{
                        fontSize: '0.875rem', color: 'var(--muted)', marginTop: 4, marginBottom: 10,
                        display: '-webkit-box', WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      }}>{book.description}</div>
                    )}
                    <span style={{
                      display: 'inline-block', marginTop: book.description ? 0 : 10,
                      fontSize: '0.75rem', fontWeight: 600,
                      background: '#f0c0d8', color: '#a0305a',
                      borderRadius: 999, padding: '2px 10px',
                    }}>
                      {count} {count === 1 ? 'transaction' : 'transactions'}
                    </span>
                  </div>

                  {menuOpen && (
                    <div onClick={e => e.stopPropagation()}>
                      <ActionMenu top={8} right={8}>
                        <ActionItem icon={<Pencil size={15} />} label="Edit"   onClick={() => openEditSheet(book)} />
                        <ActionMenuDivider />
                        <ActionItem icon={<Trash2 size={15} />} label="Delete" danger onClick={() => requestDelete(book)} />
                      </ActionMenu>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── FAB ── */}
      <button className="fab" onClick={openAddSheet} aria-label="Add book">
        <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {/* ── Sheets ── */}
      <BookSheet
        open={sheetOpen}
        book={editingBook}
        onClose={() => { setSheetOpen(false); setEditingBook(null); }}
        onSave={handleSave}
      />

      <ConfirmSheet
        open={deletingBook !== null}
        title="Delete book?"
        message={deletingBook ? `"${deletingBook.title}" and all its transactions will be permanently deleted.` : ''}
        onConfirm={doDelete}
        onCancel={() => setDeletingBook(null)}
      />

      <SettingsSheet
        open={settingsOpen}
        settings={settings}
        onClose={() => setSettingsOpen(false)}
        onSave={onUpdateSettings}
      />
    </div>
  );
}
