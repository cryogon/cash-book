import { useState } from 'react';
import { BookIcon } from '../components/BookIcon';
import { AddBookSheet } from '../components/AddBookSheet';
import type { Book } from '../types';

interface HomeScreenProps {
  books: Book[];
  onAddBook: (title: string, description: string) => void;
  onSelectBook: (book: Book) => void;
  getBookTransactionCount: (bookId: string) => number;
}

export function HomeScreen({
  books,
  onAddBook,
  onSelectBook,
  getBookTransactionCount,
}: HomeScreenProps) {
  const [showAddSheet, setShowAddSheet] = useState(false);

  return (
    <div className="screen">
      {/* ── Header ── */}
      <div style={{ paddingTop: 52, paddingBottom: 8, textAlign: 'center' }}>
        <h1 className="page-title">Books</h1>
        <div className="title-underline" />
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, padding: '12px 16px 100px' }}>
        {books.length === 0 ? (
          /* Empty state */
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            minHeight: '60vh',
          }}>
            <BookIcon style={{ width: 160, marginBottom: 20, opacity: 0.9 }} />
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', textAlign: 'center', lineHeight: 1.6 }}>
              no books available<br />
              press <strong style={{ color: 'var(--text)' }}>"+"</strong> to add
            </p>
          </div>
        ) : (
          /* Books list */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
            {books.map((book) => {
              const count = getBookTransactionCount(book.id);
              return (
                <button
                  key={book.id}
                  onClick={() => onSelectBook(book)}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    background: 'var(--surface)', borderRadius: 'var(--radius-card)',
                    padding: '16px 18px', border: 'none', cursor: 'pointer',
                    transition: 'transform 0.1s',
                  }}
                  onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.985)')}
                  onMouseUp={e => (e.currentTarget.style.transform = '')}
                  onTouchStart={e => (e.currentTarget.style.transform = 'scale(0.985)')}
                  onTouchEnd={e => (e.currentTarget.style.transform = '')}
                >
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text)', marginBottom: 4 }}>
                    {book.title}
                  </div>
                  {book.description && (
                    <div style={{ fontSize: '0.875rem', color: 'var(--muted)', marginBottom: 10,
                      display: '-webkit-box', WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {book.description}
                    </div>
                  )}
                  <span style={{
                    display: 'inline-block',
                    fontSize: '0.75rem', fontWeight: 600,
                    background: '#f0c0d8', color: '#a0305a',
                    borderRadius: 999, padding: '2px 10px',
                  }}>
                    {count} {count === 1 ? 'transaction' : 'transactions'}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── FAB ── */}
      <button className="fab" onClick={() => setShowAddSheet(true)} aria-label="Add book">
        <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      <AddBookSheet
        open={showAddSheet}
        onClose={() => setShowAddSheet(false)}
        onAdd={onAddBook}
      />
    </div>
  );
}
