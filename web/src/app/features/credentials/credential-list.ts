import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize, Subscription } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { WorkspaceService } from '../../core/workspace.service';
import { Credential } from '../../shared/models';
import { OrganizationContext } from '../../shared/organization-context';
@Component({
  imports: [OrganizationContext, RouterLink, DatePipe, FormsModule],
  templateUrl: './credential-list.html',
})
export class CredentialList {
  private api = inject(ApiService);
  private workspace = inject(WorkspaceService);
  private request?: Subscription;
  records = signal<Credential[]>([]);
  busy = signal(false);
  error = signal('');
  loaded = signal(false);
  query = signal('');
  status = signal('');
  sort = signal('newest');
  page = signal(1);
  labels = { DRAFT: 'Brouillon', ISSUED: 'Émis', REVOKED: 'Révoqué' };
  drafts = computed(() => this.records().filter((c) => c.status === 'DRAFT').length);
  issued = computed(() => this.records().filter((c) => c.status === 'ISSUED').length);
  filtered = computed(() =>
    this.records().filter(
      (c) =>
        (!this.status() || c.status === this.status()) &&
        `${c.credential_type} ${c.credential_id}`
          .toLowerCase()
          .includes(this.query().trim().toLowerCase()),
    ),
  );
  sorted = computed(() =>
    [...this.filtered()].sort((a, b) =>
      this.sort() === 'type'
        ? a.credential_type.localeCompare(b.credential_type, 'fr')
        : (this.sort() === 'oldest' ? 1 : -1) *
          (Date.parse(a.created_at) - Date.parse(b.created_at)),
    ),
  );
  pages = computed(() => Math.max(1, Math.ceil(this.filtered().length / 10)));
  currentPage = computed(() => Math.min(this.page(), this.pages()));
  paginated = computed(() =>
    this.sorted().slice((this.currentPage() - 1) * 10, this.currentPage() * 10),
  );
  rangeStart = computed(() => (this.filtered().length ? (this.currentPage() - 1) * 10 + 1 : 0));
  rangeEnd = computed(() => Math.min(this.currentPage() * 10, this.filtered().length));
  private organization = '';
  setQuery(value: string) {
    this.query.set(value);
    this.page.set(1);
  }
  setStatus(value: string) {
    this.status.set(value);
    this.page.set(1);
  }
  setSort(value: string) {
    this.sort.set(value);
    this.page.set(1);
  }
  resetFilters() {
    this.query.set('');
    this.status.set('');
    this.page.set(1);
  }
  refresh() {
    if (this.organization && !this.busy()) this.load(this.organization);
  }
  constructor() {
    if (this.workspace.organizationId()) this.load(this.workspace.organizationId());
  }
  load(id: string) {
    this.organization = id;
    this.request?.unsubscribe();
    this.records.set([]);
    this.loaded.set(false);
    this.error.set('');
    this.busy.set(true);
    this.page.set(1);
    this.request = this.api
      .list(id)
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: (r) => {
          this.records.set(r);
          this.loaded.set(true);
        },
        error: (e) => this.error.set(e.message),
      });
  }
  ngOnDestroy() {
    this.request?.unsubscribe();
  }
}
