import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { CONFIG } from '../../core/config';
import { Register } from './register';

describe('Inscription organisation', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CONFIG, useValue: { apiBaseUrl: '/api/v1' } },
      ],
    }),
  );
  it('affiche les erreurs au niveau des champs sans envoyer un formulaire invalide', async () => {
    const fixture = TestBed.createComponent(Register);
    fixture.componentInstance.submit();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('#legal-name-error')).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector('#organization-email').getAttribute('aria-invalid'),
    ).toBe('true');
    TestBed.inject(HttpTestingController).expectNone('/api/v1/organizations/');
  });
  it('bloque une raison sociale trop courte après suppression des espaces', () => {
    const form = TestBed.createComponent(Register).componentInstance.form;
    form.controls.legal_name.setValue(' a ');
    expect(form.controls.legal_name.valid).toBe(false);
  });
  it('désactive les champs pendant la requête puis affiche l’identifiant renvoyé', async () => {
    const fixture = TestBed.createComponent(Register);
    fixture.componentInstance.form.setValue({
      legal_name: 'Université',
      registration_number: '123',
      email: 'contact@example.org',
      phone: '',
    });
    fixture.componentInstance.submit();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('fieldset').disabled).toBe(true);
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/v1/organizations/').flush({ id: 'organization-id' });
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('code').textContent).toBe('organization-id');
    http.verify();
  });
});
