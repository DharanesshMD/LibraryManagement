import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-edit-book-dialog',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    FormsModule,
    MatDialogActions,
    MatDialogClose,
    MatDialogContent
  ],
  templateUrl: './edit-book-dialog.component.html',
  styleUrls: ['./edit-book-dialog.component.css'],
})
export class EditBookDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { title: string; author: string; availableCopies: number }) {}
}
