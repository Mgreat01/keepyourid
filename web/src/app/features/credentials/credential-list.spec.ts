import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { CONFIG } from '../../core/config';
import { CredentialList } from './credential-list';
import { Credential } from '../../shared/models';

describe('Consultation des justificatifs', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: CONFIG, useValue: { apiBaseUrl: '/api/v1' } },
      ],
    }),
  );
  const credential = (id: number, type = 'Diploma') =>
    ({
      id: String(id),
      credential_id: `urn:${id}`,
      credential_type: type,
      status: 'DRAFT',
      created_at: `2026-01-${String(id).padStart(2, '0')}T00:00:00Z`,
    }) as Credential;
  it('revient à la première page après une modification des filtres', () => {
    const component = TestBed.createComponent(CredentialList).componentInstance;
    component.records.set(Array.from({ length: 15 }, (_, i) => credential(i + 1)));
    component.page.set(2);
    component.setQuery('  Diploma  ');
    expect(component.currentPage()).toBe(1);
    expect(component.filtered().length).toBe(15);
    component.page.set(2);
    component.setStatus('ISSUED');
    expect(component.page()).toBe(1);
    component.resetFilters();
    expect(component.filtered().length).toBe(15);
  });
  it('trie les dates et les types sans modifier les données source', () => {
    const component = TestBed.createComponent(CredentialList).componentInstance;
    component.records.set([credential(1, 'Zeta'), credential(2, 'Alpha')]);
    expect(component.paginated()[0].id).toBe('2');
    component.setSort('oldest');
    expect(component.paginated()[0].id).toBe('1');
    component.setSort('type');
    expect(component.paginated()[0].credential_type).toBe('Alpha');
    expect(component.records()[0].id).toBe('1');
  });
  it('réessaie le chargement de la même organisation après une erreur', () => {
    const component = TestBed.createComponent(CredentialList).componentInstance;
    const http = TestBed.inject(HttpTestingController);
    component.load('organization');
    http
      .expectOne('/api/v1/organizations/organization/credentials')
      .flush({}, { status: 503, statusText: 'Unavailable' });
    expect(component.error()).toBeTruthy();
    component.refresh();
    http.expectOne('/api/v1/organizations/organization/credentials').flush([credential(1)]);
    expect(component.error()).toBe('');
    expect(component.loaded()).toBe(true);
    http.verify();
  });
});
