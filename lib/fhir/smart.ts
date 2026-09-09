import type { SmartConfiguration } from './types';

const CLIENT_ID = 'fhir-viewer-editor-bolt';
const SCOPE =
  'patient/Patient.read patient/Observation.read patient/Condition.read patient/Encounter.read patient/MedicationRequest.read patient/*.rs launch/patient openid fhirUser';
const STATE_KEY = 'fhir_smart_state';
const VERIFIER_KEY = 'fhir_pkce_verifier';

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = '';
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string): string {
  let s = str.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return atob(s);
}

function randomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const values = new Uint8Array(length);
  crypto.getRandomValues(values);
  let result = '';
  for (let i = 0; i < values.length; i++) result += chars[values[i] % chars.length];
  return result;
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  const enc = new TextEncoder();
  return crypto.subtle.digest('SHA-256', enc.encode(plain));
}

export interface PkcePair {
  verifier: string;
  challenge: string;
}

export async function generatePkcePair(): Promise<PkcePair> {
  const verifier = randomString(64);
  const digest = await sha256(verifier);
  const challenge = base64UrlEncode(digest);
  return { verifier, challenge };
}

export interface SmartLaunchParams {
  iss: string;
  authorizeUrl: string;
  tokenUrl: string;
  redirectUri: string;
  clientId?: string;
  scope?: string;
}

export async function startSmartLaunch(params: SmartLaunchParams): Promise<void> {
  const pkce = await generatePkcePair();
  const state = randomString(32);
  sessionStorage.setItem(VERIFIER_KEY, pkce.verifier);
  sessionStorage.setItem(
    STATE_KEY,
    JSON.stringify({
      iss: params.iss,
      tokenUrl: params.tokenUrl,
      redirectUri: params.redirectUri,
      state,
    }),
  );
  const authUrl = new URL(params.authorizeUrl);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', params.clientId || CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', params.redirectUri);
  authUrl.searchParams.set('scope', params.scope || SCOPE);
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('code_challenge', pkce.challenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');
  authUrl.searchParams.set('aud', params.iss);
  window.location.assign(authUrl.toString());
}

export interface SmartTokenResponse {
  accessToken: string;
  refreshToken?: string;
  patientId?: string;
  expiresAt: number;
}

export interface SmartCallbackResult {
  code: string;
  state: string;
}

export function handleSmartCallback(): SmartCallbackResult | { error: string; errorDescription?: string } {
  const url = new URL(window.location.href);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');
  if (error) return { error, errorDescription: errorDescription || undefined };
  if (!code || !state) return { error: 'missing_callback_params' };
  return { code, state };
}

export async function exchangeCodeForToken(
  code: string,
  redirectUri: string,
  tokenUrl: string,
): Promise<SmartTokenResponse> {
  const verifier = sessionStorage.getItem(VERIFIER_KEY);
  if (!verifier) throw new Error('PKCE verifier missing from session storage.');
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: CLIENT_ID,
    code_verifier: verifier,
  });
  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body,
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error_description || json?.error || 'Token exchange failed.');
  }
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    patientId: json.patient,
    expiresAt: Date.now() + (json.expires_in ? json.expires_in * 1000 : 3600 * 1000),
  };
}

export async function refreshAccessToken(
  refreshToken: string,
  tokenUrl: string,
): Promise<SmartTokenResponse> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: CLIENT_ID,
  });
  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body,
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error_description || json?.error || 'Token refresh failed.');
  }
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token || refreshToken,
    patientId: json.patient,
    expiresAt: Date.now() + (json.expires_in ? json.expires_in * 1000 : 3600 * 1000),
  };
}

export function clearSmartSession(): void {
  sessionStorage.removeItem(STATE_KEY);
  sessionStorage.removeItem(VERIFIER_KEY);
}

export function getStoredSmartState(): {
  iss: string;
  tokenUrl: string;
  redirectUri: string;
  state: string;
} | null {
  const raw = sessionStorage.getItem(STATE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function fetchSmartConfig(baseUrl: string): Promise<SmartConfiguration> {
  const url = `${baseUrl.replace(/\/$/, '')}/.well-known/smart-configuration`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`SMART configuration not found (HTTP ${res.status}).`);
  return res.json();
}

export { base64UrlEncode, base64UrlDecode };
