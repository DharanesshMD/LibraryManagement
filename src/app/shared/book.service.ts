import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable, of } from 'rxjs';
// import { User } from './auth.service';

export interface Book {
  id: number;
  title: string;
  author: string;
  availableCopies: number;
}

export interface BorrowedBook {
  book: Book;
  quantity: number;
  borrowDate: Date; // Added borrow date
}

export interface BorrowingRecord {
  userId: number;
  bookId: number;
  book: Book;
  quantity: number;
  borrowDate: Date;
}

export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
  borrowedBooks?: number[];
}  

export interface ReturnedBookRecord {
  userId: number;
  userName: string;
  bookId: number;
  bookName: string;
  quantity: number;
  returnDate: Date;
}

@Injectable({
  providedIn: 'root'
})

export class BookService {
  private booksSubject = new BehaviorSubject<Book[]>([]);
  private books: Book[] = [];

  private borrowedBooksSubject = new BehaviorSubject<{ [userId: number]: BorrowedBook[] }>({});
  private borrowedBooks: { [userId: number]: BorrowedBook[] } = {};

  private borrowingHistorySubject = new BehaviorSubject<BorrowingRecord[]>([]);
  private borrowingHistory: BorrowingRecord[] = [];

  private currentUserName: string = '';

  private users: User[] = []; // Add this property
  private usersSubject = new BehaviorSubject<User[]>([]);

  private returnedBooksHistory: ReturnedBookRecord[] = [];
  private returnedBooksSubject = new BehaviorSubject<ReturnedBookRecord[]>([]);
  

  constructor() {}

  getBooks(): Observable<Book[]> {
    return this.booksSubject.asObservable();
  }

  getBorrowedBooks(userId: number): Observable<{ book: Book; quantity: number }[]> {
    return this.borrowedBooksSubject.asObservable().pipe(
      map((allBorrowedBooks) => allBorrowedBooks[userId] || [])
    );
  }

  getAllBorrowingRecords(): Observable<BorrowingRecord[]> {
    return this.borrowingHistorySubject.asObservable();
  }

  // New method to get borrowing records for a specific user
  getUserBorrowingRecords(userId: number): Observable<BorrowingRecord[]> {
    return this.borrowingHistorySubject.pipe(
      map(records => records.filter(record => record.userId === userId))
    );
  }

  // New method to get current borrowed books stats
  getBorrowingStats(): Observable<{
    totalBorrowed: number;
    uniqueUsers: number;
    uniqueBooks: number;
  }> {
    return this.borrowingHistorySubject.pipe(
      map(records => ({
        totalBorrowed: records.reduce((sum, record) => sum + record.quantity, 0),
        uniqueUsers: new Set(records.map(record => record.userId)).size,
        uniqueBooks: new Set(records.map(record => record.bookId)).size
      }))
    );
  }

  getBorrowedBooksObservable(userId: number): Observable<BorrowedBook[]> {
    return this.borrowedBooksSubject.pipe(
      map(borrowedBooks => borrowedBooks[userId] || [])
    );
  }

  private updateState(userId: number): void {
    const updatedBooks = [...this.books];
    const updatedBorrowedBooks = { ...this.borrowedBooks };

    if (updatedBorrowedBooks[userId]) {
      updatedBorrowedBooks[userId] = updatedBorrowedBooks[userId].map((entry) => ({
        ...entry,
        book: { ...entry.book },
      }));
    }

    this.booksSubject.next(updatedBooks);
    this.borrowedBooksSubject.next(updatedBorrowedBooks);
  }

  addBook(book: Book): Observable<void> {
    // Add the new book to the list
    this.books.push(book);
    
    // Update the BehaviorSubject with the new list
    this.booksSubject.next([...this.books]);
    
    return new Observable(observer => {
      observer.next();
      observer.complete();
    });
  }

  editBook(bookId: number, updatedBook: Book): void {
    const index = this.books.findIndex((b) => b.id === bookId);
    if (index !== -1) {
      this.books[index] = updatedBook;
      this.booksSubject.next([...this.books]); // Notify subscribers
    }
  }

  borrowBook(userId: number, bookId: number, copies: number): Observable<void> {
    const book = this.books.find((b) => b.id === bookId);
    if (book && book.availableCopies >= copies) {
      book.availableCopies -= copies;

      if (!this.borrowedBooks[userId]) {
        this.borrowedBooks[userId] = [];
      }

      const borrowedEntry = this.borrowedBooks[userId].find((entry) => entry.book.id === bookId);
      if (borrowedEntry) {
        borrowedEntry.quantity += copies;
      } else {
        this.borrowedBooks[userId].push({
          book: { ...book },
          quantity: copies,
          borrowDate: new Date(),
        });
      }

      this.borrowingHistory.push({
        userId,
        bookId,
        book: { ...book },
        quantity: copies,
        borrowDate: new Date(),
      });

      this.updateState(userId);
    }
    return of(void 0);
  }
  
  
  getCurrentBorrowingStatus(): Observable<{
    bookId: number;
    totalBorrowed: number;
    borrowedBy: { userId: number; userName: string }[];
  }[]> {
    return this.borrowedBooksSubject.pipe(
      map((borrowedBooks) => {
        const status: { 
          [key: number]: { 
            totalBorrowed: number; 
            borrowedBy: { userId: number; userName: string }[] 
          } 
        } = {};

        Object.entries(borrowedBooks).forEach(([userId, books]) => {
          books.forEach(({ book, quantity }) => {
            if (!status[book.id]) {
              status[book.id] = { totalBorrowed: 0, borrowedBy: [] };
            }
            status[book.id].totalBorrowed += quantity;
            status[book.id].borrowedBy.push({ 
              userId: Number(userId), 
              userName: this.currentUserName
            });
          });
        });

        return Object.entries(status).map(([bookId, data]) => ({
          bookId: Number(bookId),
          ...data,
        }));
      })
    );
  }
  
  

  deleteBook(bookId: number): void {
    this.books = this.books.filter((book) => book.id !== bookId);
    this.booksSubject.next([...this.books]); // Notify subscribers of the updated book list
  }
  
  setUserInfo(userId: number, userName: string) {
    this.currentUserName = userName;
  }

  // Add this method to get user name by ID
  getUserById(userId: number): User | undefined {
    return this.users.find(user => user.id === userId);
  }

  // Add method to set users (you might call this when initializing your app)
  setUsers(users: User[]) {
    this.users = users;
    this.usersSubject.next([...this.users]);
  }

  // Add method to get all users if needed
  getUsers(): Observable<User[]> {
    return this.usersSubject.asObservable();
  }

  returnBook(
    userId: number,
    bookId: number,
    copies: number,
    userName: string,
    bookName: string
  ): Observable<void> {
    const book = this.books.find((b) => b.id === bookId);
    if (book) {
      // Update available copies
      book.availableCopies += copies;
  
      // Update borrowed books
      if (this.borrowedBooks[userId]) {
        const borrowedEntry = this.borrowedBooks[userId].find(
          (entry) => entry.book.id === bookId
        );
        if (borrowedEntry) {
          borrowedEntry.quantity -= copies;
          if (borrowedEntry.quantity <= 0) {
            this.borrowedBooks[userId] = this.borrowedBooks[userId].filter(
              (entry) => entry.book.id !== bookId
            );
          }
        }
      }
  
      // Add to returned books history
      const returnRecord: ReturnedBookRecord = {
        userId,
        userName,
        bookId,
        bookName,
        quantity: copies,
        returnDate: new Date(),
      };
      this.returnedBooksHistory.push(returnRecord);
      this.returnedBooksSubject.next([...this.returnedBooksHistory]);
  
      // Update histories and states
      this.updateState(userId);
      this.borrowingHistorySubject.next([...this.borrowingHistory]);
    }
  
    return of(void 0);
  }
  

  getReturnedBooks(): Observable<ReturnedBookRecord[]> {
    return this.returnedBooksSubject.asObservable();
  }
}