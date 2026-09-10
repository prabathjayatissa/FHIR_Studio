'use client';

import { useFhir } from '@/lib/fhir/context';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  HeartPulse,
  Users,
  Activity,
  Stethoscope,
  ClipboardList,
  Pill,
  Loader2,
  Plug,
  XCircle,
  FlaskConical,
  RefreshCw,
} from 'lucide-react';

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Users,
  Activity,
  Stethoscope,
  ClipboardList,
  Pill,
};

const HAPI_FHIR_URL = 'https://hapi.fhir.org/baseR4';

export function ConnectionManager() {
  const { status, errorMessage, connectDemo, retryConnection } = useFhir();

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center overflow-y-auto p-6">
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-lg shadow-blue-500/20">
          <HeartPulse className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">FHIR Resource Studio</h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          Connect to the HAPI FHIR R4 public test server to search, view, create, and validate healthcare resources.
        </p>
      </div>

      <Card className="w-full max-w-lg shadow-xl">
        <CardContent className="pt-6">
          {status === 'connecting' && (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
              <div>
                <p className="text-lg font-semibold">Connecting to HAPI FHIR...</p>
                <p className="mt-1 text-sm text-muted-foreground">{HAPI_FHIR_URL}</p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Connection Error</AlertTitle>
                <AlertDescription className="space-y-3">
                  <p>{errorMessage}</p>
                  <p className="text-xs">
                    This environment may block outbound network requests to external servers.
                    You can retry the connection, or switch to Demo Mode to explore the app with sample data.
                  </p>
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button onClick={retryConnection} className="flex-1 gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Retry Connection
                </Button>
                <Button
                  onClick={connectDemo}
                  variant="outline"
                  className="flex-1 gap-2"
                >
                  <FlaskConical className="h-4 w-4" />
                  Demo Mode
                </Button>
              </div>
            </div>
          )}

          {status === 'disconnected' && (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <Plug className="h-10 w-10 text-muted-foreground" />
              <Button onClick={retryConnection} className="gap-2">
                <Plug className="h-4 w-4" />
                Connect to HAPI FHIR
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {status === 'connected' && (
        <Card className="mt-4 w-full max-w-lg border-emerald-200 bg-emerald-50/50">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <HeartPulse className="h-4 w-4 text-emerald-600" />
                  Connected to HAPI FHIR
                </div>
                <div className="text-sm text-muted-foreground">{HAPI_FHIR_URL}</div>
                <div className="flex gap-2 pt-1">
                  <Badge variant="secondary">Public</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mt-8 grid grid-cols-5 gap-3">
        {Object.entries(ICONS).map(([key, Icon]) => (
          <div
            key={key}
            className="flex flex-col items-center gap-1 rounded-lg border bg-card p-3 text-center transition-colors hover:border-primary/30 hover:bg-accent/50"
          >
            <Icon className="h-5 w-5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">{key}</span>
          </div>
        ))}
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Created by Dr Prabath Jayathissa
      </p>
    </div>
  );
}
