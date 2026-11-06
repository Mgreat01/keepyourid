import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { ApiService } from '../../core/api.service';
@Component({ imports: [ReactiveFormsModule], templateUrl: './register.html' })
export class Register {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  busy = signal(false);
  error = signal('');
  result = signal('');
  form = this.fb.nonNullable.group({
    legal_name: [
      '',
      [Validators.required, Validators.pattern(/\S[\s\S]*\S/), Validators.maxLength(255)],
    ],
    registration_number: [
      '',
      [Validators.required, Validators.pattern(/.*\S.*/), Validators.maxLength(100)],
    ],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.maxLength(30)],
  });
  invalid(field: keyof typeof this.form.controls) {
    const control = this.form.controls[field];
    return control.touched && control.invalid;
  }
  submit() {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.busy()) return;
    this.error.set('');
    this.busy.set(true);
    const v = this.form.getRawValue();
    this.api
      .register({
        ...v,
        legal_name: v.legal_name.trim(),
        registration_number: v.registration_number.trim(),
      })
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({ next: (r) => this.result.set(r.id), error: (e) => this.error.set(e.message) });
  }
}
