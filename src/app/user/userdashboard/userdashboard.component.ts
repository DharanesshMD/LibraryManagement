import { Component, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { Book, BookService } from '../../shared/book.service';
import { AuthService, User } from '../../shared/auth.service';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatTableModule,
    MatInputModule,
    FormsModule,
  ],
  templateUrl: './userdashboard.component.html',
  styleUrls: ['./userdashboard.component.css'],
})
export class UserDashboardComponent implements OnInit {
  availableBooks: Book[] = [];
  borrowedBooks: { book: Book; quantity: number }[] = [];
  userId = 1;
  userName = '';
  userProfile: User | null = null;
  isEditingProfile = false;
  showPassword = false;
  maskedPassword = '';
  private subscriptions: Subscription[] = [];

  availableColumns = ['title', 'author', 'availableCopies', 'action'];
  borrowedColumns = ['title', 'author', 'quantity', 'action'];

  constructor(private bookService: BookService, private authService: AuthService) {}

  ngOnInit() {
    this.setupSubscriptions();
    this.loadAvailableBooks();
    this.subscribeToBorrowedBooks();
    this.userProfile = this.authService.getLoggedInUser();
    if (this.userProfile) {
      this.userName = this.userProfile.name;
      this.bookService.setUserInfo(this.userProfile.id, this.userName);  // Add this line
    }
    this.maskPassword();
  }

  private setupSubscriptions() {
    // Subscribe to available books
    const booksSub = this.bookService.getBooks().subscribe(books => {
      this.availableBooks = books;
    });

    // Subscribe to borrowed books
    const borrowedSub = this.bookService.getBorrowedBooksObservable(this.userId)
      .subscribe(borrowedBooks => {
        this.borrowedBooks = borrowedBooks;
      });

    this.subscriptions.push(booksSub, borrowedSub);
  }

  toggleEditProfile() {
    this.isEditingProfile = !this.isEditingProfile;
  }

  saveProfile() {
    if (this.userProfile) {
      this.maskPassword();
      this.isEditingProfile = false;
      alert('Profile updated successfully!');
    }
  }

  cancelEdit() {
    this.isEditingProfile = false;
    this.userProfile = this.authService.getLoggedInUser();
    this.maskPassword();
  }

  private maskPassword() {
    if (this.userProfile?.password) {
      this.maskedPassword = '*'.repeat(this.userProfile.password.length);
    }
  }

  borrowBook(book: Book) {
    const copiesToBorrow = parseInt(prompt('Enter the number of copies to borrow (1 or 2):', '1') || '0', 10);
    const maxAllowed = Math.min(2, book.availableCopies);

    if (copiesToBorrow > 0 && copiesToBorrow <= maxAllowed) {
      this.bookService.borrowBook(this.userId, book.id, copiesToBorrow).subscribe({
        error: (err) => {
          console.error('Error borrowing book:', err);
          alert('Failed to borrow book. Please try again.');
        }
      });
    } else {
      alert(`Please enter a valid number between 1 and ${maxAllowed}`);
    }
  }

  // returnBook(borrowedBook: { book: Book; quantity: number }) {
  //   const returnQuantity = parseInt(
  //     prompt(`Enter the quantity to return (1 to ${borrowedBook.quantity}):`, '1') || '0',
  //     10
  //   );

  //   if (returnQuantity > 0 && returnQuantity <= borrowedBook.quantity) {
  //     this.bookService.returnBook(this.userId, borrowedBook.book.id, returnQuantity).subscribe({
  //       error: (err) => {
  //         console.error('Error returning book:', err);
  //         alert('Failed to return book. Please try again.');
  //       }
  //     });
  //   } else {
  //     alert('Invalid quantity.');
  //   }
  // }

  returnBook(borrowedBook: { book: Book; quantity: number }) {
    const returnQuantity = parseInt(
      prompt(`Enter the quantity to return (1 to ${borrowedBook.quantity}):`, '1') || '0',
      10
    );
  
    if (returnQuantity > 0 && returnQuantity <= borrowedBook.quantity) {
      if (this.userProfile) {
        this.bookService
          .returnBook(
            this.userId,
            borrowedBook.book.id,
            returnQuantity,
            this.userProfile.name,
            borrowedBook.book.title
          )
          .subscribe({
            error: err => {
              console.error('Error returning book:', err);
              alert('Failed to return book. Please try again.');
            }
          });
      }
    } else {
      alert('Invalid quantity.');
    }
  }  
  
  private loadAvailableBooks() {
    this.bookService.getBooks().subscribe((books) => {
      this.availableBooks = books;
    });
  }

  private subscribeToBorrowedBooks() {
    this.bookService.getBorrowedBooksObservable(this.userId).subscribe((borrowedBooks) => {
      this.borrowedBooks = borrowedBooks;
    });
  }

}
