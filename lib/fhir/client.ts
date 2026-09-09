import type {
  FhirResource,
  FhirBundle,
  FhirCapabilityStatement,
  FhirOperationOutcome,
  FhirResourceType,
  PaginationLinks,
} from './types';

export interface FhirClientConfig {
  baseUrl: string;
  accessToken?: string;
  corsProxy?: string;
}

export interface SearchResult {
  bundle: FhirBundle;
  resources: FhirResource[];
  total: number;
  links: PaginationLinks;
}

export class FhirError extends Error {
  status: number;
  outcome: FhirOperationOutcome | null;
  constructor(message: string, status: number, outcome: FhirOperationOutcome | null) {
    super(message);
    this.name = 'FhirError';
    this.status = status;
    this.outcome = outcome;
  }
}

function normalizeBaseUrl(url: string): string {
  let u = url.trim();
  if (!u) return u;
  if (u.endsWith('/')) u = u.slice(0, -1);
  return u;
}

async function parseResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('json')) {
    const text = await res.text();
    throw new FhirError(text || `Non-JSON response (${res.status})`, res.status, null);
  }
  const body = await res.json();
  if (!res.ok) {
    const outcome = body?.resourceType === 'OperationOutcome' ? (body as FhirOperationOutcome) : null;
    const message =
      outcome?.issue?.[0]?.diagnostics ||
      outcome?.issue?.[0]?.details?.text ||
      body?.message ||
      `FHIR request failed with status ${res.status}`;
    throw new FhirError(message, res.status, outcome);
  }
  return body as T;
}

export class FhirClient {
  private baseUrl: string;
  private accessToken?: string;
  private corsProxy?: string;

  constructor(config: FhirClientConfig) {
    this.baseUrl = normalizeBaseUrl(config.baseUrl);
    this.accessToken = config.accessToken;
    this.corsProxy = config.corsProxy;
  }

  get base(): string {
    return this.baseUrl;
  }

  setToken(token: string | undefined) {
    this.accessToken = token;
  }

  private buildHeaders(extra?: Record<string, string>): HeadersInit {
    const headers: Record<string, string> = {
      Accept: 'application/fhir+json',
      'Content-Type': 'application/fhir+json',
      ...extra,
    };
    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }
    return headers;
  }

  private wrapUrl(url: string): string {
    if (this.corsProxy) {
      return this.corsProxy.replace('{url}', encodeURIComponent(url));
    }
    return url;
  }

  private async request<T>(
    path: string,
    method: string,
    body?: unknown,
    extraHeaders?: Record<string, string>,
  ): Promise<T> {
    const rawUrl = path.startsWith('http') ? path : `${this.baseUrl}/${path}`;
    const url = this.wrapUrl(rawUrl);
    let res: Response;
    try {
      res = await fetch(url, {
        method,
        headers: this.buildHeaders(extraHeaders),
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (err) {
      const hint = this.corsProxy
        ? 'The CORS proxy may be down or unreachable. Try a different proxy or disable it.'
        : 'The server may be down, unreachable from this environment, or blocking cross-origin requests (CORS). Try enabling a CORS proxy below.';
      throw new FhirError(
        `Network error: ${err instanceof Error ? err.message : 'fetch failed'}. ${hint}`,
        0,
        null,
      );
    }
    return parseResponse<T>(res);
  }

  async capabilityStatement(): Promise<FhirCapabilityStatement> {
    return this.request<FhirCapabilityStatement>('metadata', 'GET');
  }

  async read(resourceType: FhirResourceType, id: string): Promise<FhirResource> {
    return this.request<FhirResource>(`${resourceType}/${id}`, 'GET');
  }

  async search(
    resourceType: FhirResourceType,
    params: Record<string, string | string[] | undefined>,
    pageUrl?: string,
  ): Promise<SearchResult> {
    let path: string;
    if (pageUrl) {
      path = pageUrl;
    } else {
      const search = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) {
        if (v === undefined || v === '') continue;
        if (Array.isArray(v)) {
          for (const item of v) search.append(k, item);
        } else {
          search.append(k, v);
        }
      }
      const qs = search.toString();
      path = qs ? `${resourceType}?${qs}` : resourceType;
    }
    const bundle = await this.request<FhirBundle>(path, 'GET');
    const links: PaginationLinks = {};
    for (const l of bundle.link || []) {
      if (l.relation === 'self') links.self = l.url;
      if (l.relation === 'first') links.first = l.url;
      if (l.relation === 'previous') links.previous = l.url;
      if (l.relation === 'next') links.next = l.url;
      if (l.relation === 'last') links.last = l.url;
    }
    const resources = (bundle.entry || []).map((e) => e.resource).filter(Boolean) as FhirResource[];
    return { bundle, resources, total: bundle.total ?? resources.length, links };
  }

  async create(resource: FhirResource): Promise<FhirResource> {
    return this.request<FhirResource>(resource.resourceType, 'POST', resource);
  }

  async update(resource: FhirResource): Promise<FhirResource> {
    if (!resource.id) throw new Error('Cannot update a resource without an id.');
    return this.request<FhirResource>(`${resource.resourceType}/${resource.id}`, 'PUT', resource);
  }

  async validate(resource: FhirResource): Promise<FhirOperationOutcome> {
    return this.request<FhirOperationOutcome>(
      `${resource.resourceType}/$validate`,
      'POST',
      resource,
    );
  }

  async delete(resourceType: FhirResourceType, id: string): Promise<void> {
    await this.request<void>(`${resourceType}/${id}`, 'DELETE');
  }

  async fetchWellKnownSmart(): Promise<unknown> {
    const url = this.wrapUrl(`${this.baseUrl}/.well-known/smart-configuration`);
    let res: Response;
    try {
      res = await fetch(url, {
        headers: { Accept: 'application/json' },
      });
    } catch (err) {
      throw new FhirError(
        `Network error fetching SMART config: ${err instanceof Error ? err.message : 'fetch failed'}`,
        0,
        null,
      );
    }
    if (!res.ok) {
      throw new FhirError(`SMART configuration not found at ${this.baseUrl}/.well-known/smart-configuration`, res.status, null);
    }
    return res.json();
  }
}
