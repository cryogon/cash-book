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
  /** User-visible date as ISO date string "YYYY-MM-DD". Defaults to today when created. */
  date: string;
  /** Free-form tags e.g. ["salary", "rent"] */
  tags: string[];
  createdAt: number;
  /** Key into IndexedDB image store — undefined means no image */
  imageId?: string;
}

export interface Settings {
  /** ISO 4217 currency code shown as a prefix, e.g. "Rs." | "USD" | "$" */
  currencySymbol: string;
}
