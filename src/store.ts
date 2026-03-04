import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Book, Transaction } from './types';

const BOOKS_KEY = 'cashbook_books';
const TRANSACTIONS_KEY = 'cashbook_transactions';

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {
    // ignore
  }
  return fallback;
}

function saveToStorage<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function useStore() {
  const [books, setBooks] = useState<Book[]>(() =>
    loadFromStorage<Book[]>(BOOKS_KEY, [])
  );
  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    loadFromStorage<Transaction[]>(TRANSACTIONS_KEY, [])
  );

  useEffect(() => {
    saveToStorage(BOOKS_KEY, books);
  }, [books]);

  useEffect(() => {
    saveToStorage(TRANSACTIONS_KEY, transactions);
  }, [transactions]);

  function addBook(title: string, description: string): Book {
    const book: Book = {
      id: uuidv4(),
      title,
      description,
      createdAt: Date.now(),
    };
    setBooks((prev) => [book, ...prev]);
    return book;
  }

  function editBook(id: string, title: string, description: string) {
    setBooks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, title, description } : b))
    );
  }

  function deleteBook(id: string) {
    setBooks((prev) => prev.filter((b) => b.id !== id));
    setTransactions((prev) => prev.filter((t) => t.bookId !== id));
  }

  function addTransaction(
    bookId: string,
    title: string,
    description: string,
    amount: number,
    type: 'in' | 'out'
  ): Transaction {
    const tx: Transaction = {
      id: uuidv4(),
      bookId,
      title,
      description,
      amount,
      type,
      createdAt: Date.now(),
    };
    setTransactions((prev) => [tx, ...prev]);
    return tx;
  }

  function editTransaction(
    id: string,
    title: string,
    description: string,
    amount: number,
    type: 'in' | 'out'
  ) {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, title, description, amount, type } : t))
    );
  }

  function deleteTransaction(id: string) {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }

  function getBookTransactions(bookId: string): Transaction[] {
    return transactions.filter((t) => t.bookId === bookId);
  }

  function getBookSummary(bookId: string) {
    const txs = getBookTransactions(bookId);
    const cashIn = txs
      .filter((t) => t.type === 'in')
      .reduce((s, t) => s + t.amount, 0);
    const cashOut = txs
      .filter((t) => t.type === 'out')
      .reduce((s, t) => s + t.amount, 0);
    return { cashIn, cashOut, total: cashIn - cashOut };
  }

  return {
    books,
    transactions,
    addBook,
    editBook,
    deleteBook,
    addTransaction,
    editTransaction,
    deleteTransaction,
    getBookTransactions,
    getBookSummary,
  };
}
