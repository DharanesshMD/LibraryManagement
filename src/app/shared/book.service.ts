import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable, of } from 'rxjs';


export interface Book {
  id: number;
  title: string;
  author: string;
  availableCopies: number;
}

export interface BorrowedBook {
  book: Book;
  quantity: number;
  borrowDate: Date; 
}

export interface BorrowingRecord {
  userId: number;
  bookId: number;
  book: Book;
  quantity: number;
  borrowDate: Date;
}

interface BorrowRecord {
  userId: number;
  userName: string;
  bookId: number;
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
  

  private currentUserName: string = '';

  private userNameMap: Map<number, string> = new Map();

  private users: User[] = []; 
  private usersSubject = new BehaviorSubject<User[]>([]);

  private returnedBooksHistory: ReturnedBookRecord[] = [];
  private returnedBooksSubject = new BehaviorSubject<ReturnedBookRecord[]>([]);
  
  private activeBookBorrowsSubject = new BehaviorSubject<BorrowRecord[]>([]);
  private activeBookBorrows: BorrowRecord[] = [];

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

  
  getUserBorrowingRecords(userId: number): Observable<BorrowingRecord[]> {
    return this.borrowingHistorySubject.pipe(
      map(records => records.filter(record => record.userId === userId))
    );
  }

  
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

  getBorrowedBooksObservable(userId: number): Observable<{ book: Book; quantity: number }[]> {
    return this.activeBookBorrowsSubject.pipe(
      map(borrows => {
        
        const userBorrows = borrows.filter(record => record.userId === userId);
        
        
        return userBorrows.map(record => ({
          book: this.books.find(b => b.id === record.bookId) || {
            id: record.bookId,
            title: 'Unknown Book',
            author: 'Unknown Author',
            availableCopies: 0
          },
          quantity: record.quantity
        }));
      })
    );
  }

  addBook(book: Book): Observable<void> {
    
    this.books.push(book);
    
    
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
      this.booksSubject.next([...this.books]); 
    }
  }

  borrowBook(userId: number, bookId: number, copies: number): Observable<void> {
    const book = this.books.find((b) => b.id === bookId);
    if (book && book.availableCopies >= copies) {
      
      book.availableCopies -= copies;

      
      const existingBorrowIndex = this.activeBookBorrows.findIndex(
        record => record.userId === userId && record.bookId === bookId
      );

      if (existingBorrowIndex !== -1) {
        
        this.activeBookBorrows[existingBorrowIndex].quantity += copies;
      } else {
        
        const borrowRecord: BorrowRecord = {
          userId,
          userName: this.userNameMap.get(userId) || 'Unknown User',
          bookId,
          quantity: copies,
          borrowDate: new Date()
        };
        this.activeBookBorrows.push(borrowRecord);
      }

      
      this.activeBookBorrowsSubject.next([...this.activeBookBorrows]);
      this.booksSubject.next([...this.books]);
    }
    return of(void 0);
  }
  
  
  getCurrentBorrowingStatus(): Observable<{
    bookId: number;
    totalBorrowed: number;
    borrowedBy: { userId: number; userName: string; quantity: number }[];
  }[]> {
    return this.activeBookBorrowsSubject.pipe(
      map((borrows) => {
        
        const bookGroups = borrows.reduce((groups, record) => {
          if (!groups[record.bookId]) {
            groups[record.bookId] = {
              bookId: record.bookId,
              totalBorrowed: 0,
              borrowedBy: []
            };
          }
          
          groups[record.bookId].totalBorrowed += record.quantity;
          groups[record.bookId].borrowedBy.push({
            userId: record.userId,
            userName: record.userName,
            quantity: record.quantity
          });
          
          return groups;
        }, {} as { [key: number]: any });

        return Object.values(bookGroups);
      })
    );
  }
  
  

  deleteBook(bookId: number): void {
    this.books = this.books.filter((book) => book.id !== bookId);
    this.booksSubject.next([...this.books]); 
  }
  
  setUserInfo(userId: number, userName: string) {
    this.userNameMap.set(userId, userName);
  }

  
  getUserById(userId: number): User | undefined {
    return this.users.find(user => user.id === userId);
  }

  
  setUsers(users: User[]) {
    this.users = users;
    this.usersSubject.next([...this.users]);
  }

  
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
      
      book.availableCopies += copies;

      
      const borrowIndex = this.activeBookBorrows.findIndex(
        record => record.userId === userId && record.bookId === bookId
      );

      if (borrowIndex !== -1) {
        const record = this.activeBookBorrows[borrowIndex];
        record.quantity -= copies;
        
        if (record.quantity <= 0) {
          
          this.activeBookBorrows.splice(borrowIndex, 1);
        }
      }

      
      const returnRecord: ReturnedBookRecord = {
        userId,
        userName: this.userNameMap.get(userId) || userName,
        bookId,
        bookName,
        quantity: copies,
        returnDate: new Date()
      };
      this.returnedBooksHistory.push(returnRecord);

      
      this.activeBookBorrowsSubject.next([...this.activeBookBorrows]);
      this.returnedBooksSubject.next([...this.returnedBooksHistory]);
      this.booksSubject.next([...this.books]);
    }
    return of(void 0);
  }
  

  getReturnedBooks(): Observable<ReturnedBookRecord[]> {
    return this.returnedBooksSubject.asObservable();
  }
}
