export interface Book {
  id: string;
  title: string;
  description: string;
  createdAt: number;
}

export interface Transaction {
  id: string;
  bookId: string;
  title: string;
  description: string;
  amount: number;
  type: 'in' | 'out';
  createdAt: number;
}
