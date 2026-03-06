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
    const book = store.books.find(b => b.id === selectedBook.id) ?? selectedBook;
    const transactions = store.getBookTransactions(book.id);

    return (
      <BookScreen
        book={book}
        transactions={transactions}
        settings={store.settings}
        onBack={() => setSelectedBook(null)}
        onAddTransaction={(title, description, amount, type, date, tags, imageId) =>
          store.addTransaction(book.id, title, description, amount, type, date, tags, imageId)
        }
        onEditTransaction={(id, title, description, amount, type, date, tags, imageId, removedImageId) =>
          store.editTransaction(id, title, description, amount, type, date, tags, imageId, removedImageId)
        }
        onDeleteTransaction={id => store.deleteTransaction(id)}
      />
    );
  }

  return (
    <HomeScreen
      books={store.books}
      settings={store.settings}
      onUpdateSettings={store.updateSettings}
      onAddBook={(title, description) => store.addBook(title, description)}
      onEditBook={(id, title, description) => store.editBook(id, title, description)}
      onDeleteBook={id => store.deleteBook(id)}
      onSelectBook={book => setSelectedBook(book)}
      getBookTransactionCount={bookId => store.getBookTransactions(bookId).length}
    />
  );
}
