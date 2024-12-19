import { Component, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog'; // Import MatDialog
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BookService, Book, ReturnedBookRecord } from '../../shared/book.service';
import { EditBookDialogComponent } from '../edit-book-dialog/edit-book-dialog.component';
import { AuthService, User } from '../../shared/auth.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Subscription } from 'rxjs';
import { EditUserDialogComponent } from '../edit-user-dialog/edit-user-dialog.component';

interface BorrowedBookRecord {
  userId: number;
  userName: string;
  bookId: number;
  bookTitle: string;
  quantity: number;
  borrowDate: Date;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatDialogModule,
    FontAwesomeModule,
  ],
  templateUrl: './admindashboard.component.html',
  styleUrls: ['./admindashboard.component.css'],
})
export class AdminDashboardComponent implements OnInit {
  books: Book[] = [];
  private users: User[] = [];
  newBook = { title: '', author: '', availableCopies: 0 };
  adminProfile: User | null = null;
  isEditingProfile = false;
  showPassword = false;
  maskedPassword = '';

  borrowedBooks: BorrowedBookRecord[] = [];
  borrowedColumns = ['userName', 'bookTitle', 'quantity', 'borrowDate'];
  private subscription: Subscription = new Subscription();

  borrowingStatus: {
    bookId: number;
    totalBorrowed: number;
    borrowedBy: number[];
  }[] = [];

  borrowingColumns = ['bookId', 'totalBorrowed', 'borrowedBy'];

  displayedColumns = ['title', 'author', 'availableCopies', 'actions'];

  returnedDetails: ReturnedBookRecord[] = [];
  returnedColumns = ['userName', 'bookName', 'quantity', 'returnDate'];
  
  constructor(
    private bookService: BookService,
    private dialog: MatDialog,
    public authService: AuthService
  ) {} // Inject MatDialog and AuthService

  ngOnInit() {
    this.loadBooks();
    this.adminProfile = this.authService.getLoggedInUser();
    this.maskPassword();
    this.subscribeToBorrowedBooks();
    this.users = this.authService.getAllUsers();
    this.loadReturnedDetails();
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  private subscribeToBorrowedBooks() {
    this.subscription = this.bookService.getCurrentBorrowingStatus().subscribe((borrowingStatus) => {
      const allBorrowed: BorrowedBookRecord[] = [];
  
      borrowingStatus.forEach((status) => {
        status.borrowedBy.forEach((user) => {
          allBorrowed.push({
            userId: user.userId,
            userName: user.userName,
            bookId: status.bookId,
            bookTitle: this.getBookTitle(status.bookId),
            quantity: status.totalBorrowed / status.borrowedBy.length, // Distribute quantity evenly
            borrowDate: new Date(), // Example: Replace with actual borrow date if tracked in the service
          });
        });
      });
  
      this.borrowedBooks = allBorrowed;
    });
  }
  

  getBookTitle(bookId: number): string {
    return this.books.find(book => book.id === bookId)?.title || 'Unknown Book';
  }

  toggleEditProfile() {
    this.isEditingProfile = !this.isEditingProfile;
  }

  saveProfile() {
    if (this.adminProfile) {
      // Ensure password masking after saving
      this.maskPassword();
      this.isEditingProfile = false;
      alert('Profile updated successfully!');
    }
  }

  cancelEdit() {
    this.isEditingProfile = false;
    this.adminProfile = this.authService.getLoggedInUser(); // Reset to original profile data
    this.maskPassword();
  }

  private maskPassword() {
    if (this.adminProfile?.password) {
      this.maskedPassword = '*'.repeat(this.adminProfile.password.length);
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  addBook() {
    if (!this.newBook.title || !this.newBook.author || this.newBook.availableCopies <= 0) return;
    const bookWithId: Book = {
      ...this.newBook,
      id: Date.now(),
    };

    this.bookService.addBook(bookWithId).subscribe(() => {
      this.newBook = { title: '', author: '', availableCopies: 0 };
      this.loadBooks();
    });
  }

  loadBooks() {
    this.bookService.getBooks().subscribe((data) => {
      this.books = data;
    });
  }

  openEditDialog(book: Book) {
    const dialogRef = this.dialog.open(EditBookDialogComponent, {
      width: '400px',
      data: { ...book },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'delete') {
        this.deleteBook(book.id); // Handle delete action
      } else if (result) {
        this.bookService.editBook(book.id, result); // Handle save action
        this.loadBooks();
      }
    });
  }

  deleteBook(bookId: number) {
    this.bookService.deleteBook(bookId);
    this.loadBooks(); // Reload the book list after deletion
  }

  // getBookTitle(bookId: number): string {
  //   return this.books.find(book => book.id === bookId)?.title || 'Unknown Book';
  // }

  getUserName(userId: number): string {
    const user = this.users.find(user => user.id === userId);
    console.log('Looking for user ID:', userId, 'Result:', user);
    return user?.name || 'Unknown User';
  }

  private loadReturnedDetails() {
    this.bookService.getReturnedBooks().subscribe((details) => {
      this.returnedDetails = details;
    });
  }
  
  openEditUserDialog(userId: number) {
    const user = this.users.find((u) => u.id === userId);
    if (user) {
      const dialogRef = this.dialog.open(EditUserDialogComponent, {
        width: '400px',
        data: { ...user },
      });

      dialogRef.afterClosed().subscribe((updatedUser) => {
        if (updatedUser) {
          this.updateUserProfile(updatedUser);
        }
      });
    }
  }

  private updateUserProfile(updatedUser: User) {
    const index = this.users.findIndex((u) => u.id === updatedUser.id);
    if (index !== -1) {
      this.users[index] = updatedUser;
      console.log('User updated:', updatedUser);
      // Update any dependent data if needed
    }
  }
  
}
