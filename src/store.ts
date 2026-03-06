import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { deleteImage } from './imageStore';
import type { Book, Transaction, Settings } from './types';

const BOOKS_KEY        = 'cashbook_books';
const TRANSACTIONS_KEY = 'cashbook_transactions';
const SETTINGS_KEY     = 'cashbook_settings';

const DEFAULT_SETTINGS: Settings = { currencySymbol: 'Rs.' };

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch { /* ignore */ }
  return fallback;
}

function saveToStorage<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function useStore() {
  const [books, setBooks] = useState<Book[]>(() =>
    loadFromStorage<Book[]>(BOOKS_KEY, [])
  );
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const txs = loadFromStorage<Transaction[]>(TRANSACTIONS_KEY, []);
    // Back-fill date/tags for existing records that predate these fields
    return txs.map(t => ({
      ...t,
      date: t.date ?? todayISO(),
      tags: t.tags ?? [],
    }));
  });
  const [settings, setSettings] = useState<Settings>(() =>
    loadFromStorage<Settings>(SETTINGS_KEY, DEFAULT_SETTINGS)
  );

  useEffect(() => { saveToStorage(BOOKS_KEY, books); }, [books]);
  useEffect(() => { saveToStorage(TRANSACTIONS_KEY, transactions); }, [transactions]);
  useEffect(() => { saveToStorage(SETTINGS_KEY, settings); }, [settings]);

  // ── Settings ─────────────────────────────────────────────

  function updateSettings(patch: Partial<Settings>) {
    setSettings(prev => ({ ...prev, ...patch }));
  }

  // ── Books ─────────────────────────────────────────────────

  function addBook(title: string, description: string): Book {
    const book: Book = { id: uuidv4(), title, description, createdAt: Date.now() };
    setBooks(prev => [book, ...prev]);
    return book;
  }

  function editBook(id: string, title: string, description: string) {
    setBooks(prev => prev.map(b => b.id === id ? { ...b, title, description } : b));
  }

  function deleteBook(id: string) {
    const txs = transactions.filter(t => t.bookId === id);
    txs.forEach(t => { if (t.imageId) deleteImage(t.imageId); });
    setBooks(prev => prev.filter(b => b.id !== id));
    setTransactions(prev => prev.filter(t => t.bookId !== id));
  }

  // ── Transactions ──────────────────────────────────────────

  function addTransaction(
    bookId: string,
    title: string,
    description: string,
    amount: number,
    type: 'in' | 'out',
    date: string,
    tags: string[],
    imageId?: string,
  ): Transaction {
    const tx: Transaction = {
      id: uuidv4(), bookId, title, description,
      amount, type, date, tags,
      createdAt: Date.now(),
      ...(imageId ? { imageId } : {}),
    };
    setTransactions(prev => [tx, ...prev]);
    return tx;
  }

  function editTransaction(
    id: string,
    title: string,
    description: string,
    amount: number,
    type: 'in' | 'out',
    date: string,
    tags: string[],
    imageId?: string,
    removedImageId?: string,
  ) {
    if (removedImageId) deleteImage(removedImageId);
    setTransactions(prev =>
      prev.map(t => {
        if (t.id !== id) return t;
        const updated: Transaction = { ...t, title, description, amount, type, date, tags };
        if (imageId !== undefined) updated.imageId = imageId;
        else if (removedImageId) delete updated.imageId;
        return updated;
      })
    );
  }

  function deleteTransaction(id: string) {
    const tx = transactions.find(t => t.id === id);
    if (tx?.imageId) deleteImage(tx.imageId);
    setTransactions(prev => prev.filter(t => t.id !== id));
  }

  // ── Queries ───────────────────────────────────────────────

  function getBookTransactions(bookId: string): Transaction[] {
    return transactions.filter(t => t.bookId === bookId);
  }

  function getBookSummary(bookId: string) {
    const txs = getBookTransactions(bookId);
    const cashIn  = txs.filter(t => t.type === 'in').reduce((s, t) => s + t.amount, 0);
    const cashOut = txs.filter(t => t.type === 'out').reduce((s, t) => s + t.amount, 0);
    return { cashIn, cashOut, total: cashIn - cashOut };
  }

  return {
    books, transactions, settings,
    updateSettings,
    addBook, editBook, deleteBook,
    addTransaction, editTransaction, deleteTransaction,
    getBookTransactions, getBookSummary,
  };
}
