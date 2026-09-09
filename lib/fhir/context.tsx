'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { FhirClient, FhirError } from './client';
import { DemoFhirClient } from './demo-client';
import type { SmartConfiguration } from './types';
import * as smart from './smart';

export type ConnectionMode = 'public' | 'smart' | 'demo';
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface AuthState {
  accessToken?: string;
  refreshToken?: string;
  patientId?: string;
  expiresAt?: number;
}

// A unified client interface that both FhirClient and DemoFhirClient satisfy
export interface UnifiedFhirClient {
  get base(): string;
  setToken(token: string | undefined): void;
  capabilityStatement(): Promise<unknown>;
  read(resourceType: string, id: string): Promise<unknown>;
  search(
    resourceType: string,
    params: Record<string, string | string[] | undefined>,
    pageUrl?: string,
  ): Promise<unknown>;
  create(resource: unknown): Promise<unknown>;
  update(resource: unknown): Promise<unknown>;
  validate(resource: unknown): Promise<unknown>;
  delete(resourceType: string, id: string): Promise<void>;
  fetchWellKnownSmart(): Promise<unknown>;
}

export interface FhirContextValue {
  baseUrl: string;
  mode: ConnectionMode;
  status: ConnectionStatus;
  errorMessage: string | null;
  client: UnifiedFhirClient | null;
  auth: AuthState;
  smartConfig: SmartConfiguration | null;
  corsProxy: string;
  testConnection: (url: string, corsProxy?: string) => Promise<boolean>;
  connectPublic: (url: string, corsProxy?: string) => void;
  connectDemo: () => void;
  connectSmart: (url: string, redirectUri: string) => Promise<void>;
  completeSmartCallback: () => Promise<void>;
  disconnect: () => void;
  refreshAuth: () => Promise<void>;
}

const FhirContext = createContext<FhirContextValue | null>(null);

export function useFhir(): FhirContextValue {
  const ctx = useContext(FhirContext);
  if (!ctx) throw new Error('useFhir must be used within a FhirProvider');
  return ctx;
}

export function FhirProvider({ children }: { children: React.ReactNode }) {
  // Start in demo mode immediately so the app is usable without a network connection.
  const demoClientRef = useRef<UnifiedFhirClient | null>(null);
  if (!demoClientRef.current) {
    demoClientRef.current = new DemoFhirClient({ baseUrl: 'demo://fhir-studio' }) as unknown as UnifiedFhirClient;
  }

  const [baseUrl, setBaseUrl] = useState('demo://fhir-studio');
  const [mode, setMode] = useState<ConnectionMode>('demo');
  const [status, setStatus] = useState<ConnectionStatus>('connected');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [auth, setAuth] = useState<AuthState>({});
  const [smartConfig, setSmartConfig] = useState<SmartConfiguration | null>(null);
  const [corsProxy, setCorsProxy] = useState('');
  const clientRef = useRef<UnifiedFhirClient | null>(demoClientRef.current);
  const tokenUrlRef = useRef<string>('');

  const setClient = useCallback((url: string, token?: string, proxy?: string) => {
    clientRef.current = new FhirClient({ baseUrl: url, accessToken: token, corsProxy: proxy || undefined }) as unknown as UnifiedFhirClient;
  }, []);

  const testConnection = useCallback(
    async (url: string, proxy?: string): Promise<boolean> => {
      setStatus('connecting');
      setErrorMessage(null);
      setCorsProxy(proxy || '');
      try {
        const temp = new FhirClient({ baseUrl: url, corsProxy: proxy || undefined });
        const cap = await temp.capabilityStatement();
        if (!cap.fhirVersion?.startsWith('4')) {
          setErrorMessage(
            `Server reports FHIR version ${cap.fhirVersion || 'unknown'} — this app targets R4 (4.x.x).`,
          );
          setStatus('error');
          return false;
        }
        setBaseUrl(url);
        setClient(url, undefined, proxy);
        setStatus('connected');
        setMode('public');
        return true;
      } catch (err) {
        const msg = err instanceof FhirError ? err.message : err instanceof Error ? err.message : 'Connection failed';
        setErrorMessage(msg);
        setStatus('error');
        return false;
      }
    },
    [setClient],
  );

  const connectPublic = useCallback(
    (url: string, proxy?: string) => {
      setBaseUrl(url);
      setCorsProxy(proxy || '');
      setClient(url, undefined, proxy);
      setStatus('connected');
      setMode('public');
      setAuth({});
      setSmartConfig(null);
      setErrorMessage(null);
    },
    [setClient],
  );

  const connectDemo = useCallback(() => {
    const demo = new DemoFhirClient({ baseUrl: 'demo://fhir-studio' }) as unknown as UnifiedFhirClient;
    clientRef.current = demo;
    setBaseUrl('demo://fhir-studio');
    setMode('demo');
    setStatus('connected');
    setAuth({});
    setSmartConfig(null);
    setCorsProxy('');
    setErrorMessage(null);
  }, []);

  const connectSmart = useCallback(async (url: string, redirectUri: string): Promise<void> => {
    setStatus('connecting');
    setErrorMessage(null);
    try {
      const config = await smart.fetchSmartConfig(url);
      setSmartConfig(config);
      tokenUrlRef.current = config.token_endpoint;
      await smart.startSmartLaunch({
        iss: url,
        authorizeUrl: config.authorization_endpoint,
        tokenUrl: config.token_endpoint,
        redirectUri,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'SMART launch failed';
      setErrorMessage(msg);
      setStatus('error');
    }
  }, []);

  const completeSmartCallback = useCallback(async (): Promise<void> => {
    const stored = smart.getStoredSmartState();
    if (!stored) return;
    const callback = smart.handleSmartCallback();
    if ('error' in callback) {
      setErrorMessage(callback.errorDescription || callback.error);
      setStatus('error');
      smart.clearSmartSession();
      return;
    }
    if (callback.state !== stored.state) {
      setErrorMessage('OAuth state mismatch — possible CSRF. Aborting.');
      setStatus('error');
      smart.clearSmartSession();
      return;
    }
    setStatus('connecting');
    try {
      const tokenResp = await smart.exchangeCodeForToken(callback.code, stored.redirectUri, stored.tokenUrl);
      setAuth({
        accessToken: tokenResp.accessToken,
        refreshToken: tokenResp.refreshToken,
        patientId: tokenResp.patientId,
        expiresAt: tokenResp.expiresAt,
      });
      setBaseUrl(stored.iss);
      setMode('smart');
      setClient(stored.iss, tokenResp.accessToken);
      setStatus('connected');
      smart.clearSmartSession();
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Token exchange failed';
      setErrorMessage(msg);
      setStatus('error');
      smart.clearSmartSession();
    }
  }, [setClient]);

  const refreshAuth = useCallback(async (): Promise<void> => {
    if (!auth.refreshToken || !tokenUrlRef.current) return;
    try {
      const tokenResp = await smart.refreshAccessToken(auth.refreshToken, tokenUrlRef.current);
      setAuth({
        accessToken: tokenResp.accessToken,
        refreshToken: tokenResp.refreshToken,
        patientId: tokenResp.patientId,
        expiresAt: tokenResp.expiresAt,
      });
      if (clientRef.current) {
        clientRef.current.setToken(tokenResp.accessToken);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Token refresh failed';
      setErrorMessage(msg);
      setStatus('error');
    }
  }, [auth.refreshToken]);

  const disconnect = useCallback(() => {
    clientRef.current = null;
    setBaseUrl('');
    setMode('public');
    setStatus('disconnected');
    setAuth({});
    setSmartConfig(null);
    setCorsProxy('');
    setErrorMessage(null);
    smart.clearSmartSession();
  }, []);

  const value: FhirContextValue = {
    baseUrl,
    mode,
    status,
    errorMessage,
    client: clientRef.current,
    auth,
    smartConfig,
    corsProxy,
    testConnection,
    connectPublic,
    connectDemo,
    connectSmart,
    completeSmartCallback,
    disconnect,
    refreshAuth,
  };

  return <FhirContext.Provider value={value}>{children}</FhirContext.Provider>;
}
