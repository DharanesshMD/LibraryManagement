import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { BorrowedBook } from './book.service';

export interface User {
    id: number;
    name: string;
    email: string;
    password: string;
    role: 'admin' | 'user';
    borrowedBooks: BorrowedBook[];
  }  

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private users: User[] = [];
  private loggedInUser: User | null = null;
  private usersSubject = new BehaviorSubject<User[]>([]);

  register(user: Omit<User, 'id' | 'borrowedBooks'>): void {
    const newUser: User = {
      ...user,
      id: this.users.length ? Math.max(...this.users.map(u => u.id)) + 1 : 1,
      borrowedBooks: []
    };
    this.users.push(newUser);
    this.usersSubject.next([...this.users]);
  }
  

  login(email: string, password: string): User | null {
    const user = this.users.find(
      (u) => u.email === email && u.password === password
    );
    this.loggedInUser = user || null;
    return this.loggedInUser;
  }

  getLoggedInUser(): User | null {
    return this.loggedInUser;
  }

  logout() {
    this.loggedInUser = null;
  }
  getAllUsers(): User[] {
    return [...this.users];
  }

  
  getUserById(userId: number): User | undefined {
    return this.users.find(user => user.id === userId);
  }

  addBorrowedBook(userId: number, book: BorrowedBook): void {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      user.borrowedBooks.push(book);
      this.usersSubject.next([...this.users]);
    }
  }

  returnBook(userId: number, bookId: number, quantity: number): void {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      const bookIndex = user.borrowedBooks.findIndex(b => b.book.id === bookId);
      if (bookIndex !== -1) {
        const borrowedBook = user.borrowedBooks[bookIndex];
        borrowedBook.quantity -= quantity;
        if (borrowedBook.quantity <= 0) {
          user.borrowedBooks.splice(bookIndex, 1);
        }
        this.usersSubject.next([...this.users]);
      }
    }
  }

  getBorrowedBooks(userId: number): BorrowedBook[] {
    const user = this.users.find(u => u.id === userId);
    return user ? [...user.borrowedBooks] : [];
  }
  
}
