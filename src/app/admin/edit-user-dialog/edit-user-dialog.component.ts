import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { User } from '../../shared/auth.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-edit-user-dialog',
  template: `
    <h2 mat-dialog-title>Edit User Details</h2>
    <mat-dialog-content>
      <mat-form-field appearance="fill" class="dialog-input">
        <mat-label>Name</mat-label>
        <input matInput [(ngModel)]="data.name" />
      </mat-form-field>
      <mat-form-field appearance="fill" class="dialog-input">
        <mat-label>Email</mat-label>
        <input matInput [(ngModel)]="data.email" />
      </mat-form-field>
      <mat-form-field appearance="fill" class="dialog-input">
        <mat-label>Password</mat-label>
        <input matInput type="password" [(ngModel)]="data.password" />
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions>
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-button color="primary" (click)="save()">Save</button>
    </mat-dialog-actions>
  `,
  styleUrls: ['./edit-user-dialog.component.css'],
  standalone: true,
  imports: [
    MatFormFieldModule, 
    MatInputModule, 
    FormsModule, 
    MatButtonModule,
    MatDialogModule
  ],
    
})
export class EditUserDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<EditUserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: User
  ) {}

  save() {
    this.dialogRef.close(this.data);
  }
}
