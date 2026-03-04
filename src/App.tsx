import { useState } from 'react';
import { useStore } from './store';
import { HomeScreen } from './screens/HomeScreen';
import { BookScreen } from './screens/BookScreen';
import type { Book } from './types';
import './index.css';

export default function App() {
  const store = useStore();
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  if (selectedBook) {
    // Keep the book reference in sync in case the book gets updated
    const book = store.books.find((b) => b.id === selectedBook.id) ?? selectedBook;
    const transactions = store.getBookTransactions(book.id);

    return (
      <BookScreen
        book={book}
        transactions={transactions}
        onBack={() => setSelectedBook(null)}
        onAddTransaction={(title, description, amount, type) => {
          store.addTransaction(book.id, title, description, amount, type);
        }}
      />
    );
  }

  return (
    <HomeScreen
      books={store.books}
      onAddBook={(title, description) => store.addBook(title, description)}
      onSelectBook={(book) => setSelectedBook(book)}
      getBookTransactionCount={(bookId) =>
        store.getBookTransactions(bookId).length
      }
    />
  );
}
