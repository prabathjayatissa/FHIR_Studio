'use client';

import { useState } from 'react';
import { useFhir } from '@/lib/fhir/context';
import { DEFAULT_FHIR_SERVERS } from '@/lib/fhir/metadata';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Activity,
  Users,
  Stethoscope,
  ClipboardList,
  Pill,
  HeartPulse,
  ShieldCheck,
  Globe,
  Loader2,
  Plug,
  XCircle,
  CheckCircle2,
  FlaskConical,
  ChevronDown,
  Network,
  Settings2,
} from 'lucide-react';

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Users,
  Activity,
  Stethoscope,
  ClipboardList,
  Pill,
};

const CORS_PROXIES = [
  { label: 'corsproxy.io', template: 'https://corsproxy.io/?url={url}' },
  { label: 'allorigins', template: 'https://api.allorigins.win/raw?url={url}' },
  { label: 'thingproxy', template: 'https://thingproxy.freeboard.io/fetch/{url}' },
];

export function ConnectionManager() {
  const {
    status,
    errorMessage,
    baseUrl,
    mode,
    auth,
    testConnection,
    connectPublic,
    connectDemo,
    connectSmart,
    disconnect,
  } = useFhir();

  const [urlInput, setUrlInput] = useState('');
  const [testing, setTesting] = useState(false);
  const [useProxy, setUseProxy] = useState(false);
  const [proxyIdx, setProxyIdx] = useState(0);
  const [advOpen, setAdvOpen] = useState(false);

  const activeProxy = useProxy ? CORS_PROXIES[proxyIdx].template : '';

  const handleTest = async () => {
    setTesting(true);
    await testConnection(urlInput, activeProxy || undefined);
    setTesting(false);
  };

  const handleConnect = () => {
    connectPublic(urlInput, activeProxy || undefined);
  };

  const handleSmart = async () => {
    const redirectUri = window.location.origin + window.location.pathname;
    await connectSmart(urlInput, redirectUri);
  };

  const statusIcon = () => {
    switch (status) {
      case 'connected':
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'connecting':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Plug className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const statusText = () => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'error':
        return 'Connection Error';
      default:
        return 'Not Connected';
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center overflow-y-auto p-6">
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-lg shadow-blue-500/20">
          <HeartPulse className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">FHIR Resource Studio</h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          Connect to any FHIR R4 server to search, view, create, and validate healthcare resources.
        </p>
      </div>

      {/* Demo Mode Button - prominent */}
      <Button
        onClick={connectDemo}
        size="lg"
        className="mb-4 w-full max-w-lg gap-2 bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-lg hover:from-emerald-700 hover:to-teal-600"
      >
        <FlaskConical className="h-5 w-5" />
        Try Demo Mode (No Server Needed)
      </Button>

      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Server Connection</CardTitle>
              <CardDescription>Choose how to connect to a FHIR R4 endpoint.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {statusIcon()}
              <span className="text-sm font-medium">{statusText()}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="public">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="public" className="gap-2">
                <Globe className="h-4 w-4" />
                Public Server
              </TabsTrigger>
              <TabsTrigger value="smart" className="gap-2">
                <ShieldCheck className="h-4 w-4" />
                SMART on FHIR
              </TabsTrigger>
            </TabsList>

            <TabsContent value="public" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fhir-url">FHIR Base URL</Label>
                <Input
                  id="fhir-url"
                  placeholder="https://hapi.fhir.org/baseR4"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_FHIR_SERVERS.map((s) => (
                  <Badge
                    key={s.url}
                    variant="secondary"
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => setUrlInput(s.url)}
                  >
                    {s.label}
                  </Badge>
                ))}
              </div>

              {/* Advanced / CORS Proxy */}
              <Collapsible open={advOpen} onOpenChange={setAdvOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Settings2 className="h-3.5 w-3.5" />
                      Advanced Settings (CORS Proxy)
                    </span>
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${advOpen ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3 space-y-3 rounded-lg border bg-muted/30 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Network className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor="cors-toggle" className="text-sm">
                        Use CORS Proxy
                      </Label>
                    </div>
                    <Switch id="cors-toggle" checked={useProxy} onCheckedChange={setUseProxy} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    If the FHIR server doesn&apos;t allow cross-origin requests from the browser, a CORS proxy
                    can relay the traffic. Try this if you see a &quot;Network error&quot; or CORS message.
                  </p>
                  {useProxy && (
                    <div className="flex flex-wrap gap-2">
                      {CORS_PROXIES.map((p, i) => (
                        <Badge
                          key={p.label}
                          variant={proxyIdx === i ? 'default' : 'secondary'}
                          className="cursor-pointer"
                          onClick={() => setProxyIdx(i)}
                        >
                          {p.label}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={handleTest}
                  disabled={!urlInput || testing}
                  className="flex-1"
                >
                  {testing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Activity className="mr-2 h-4 w-4" />
                  )}
                  Test Connection
                </Button>
                <Button onClick={handleConnect} disabled={!urlInput} className="flex-1">
                  <Plug className="mr-2 h-4 w-4" />
                  Connect
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="smart" className="mt-4 space-y-4">
              <Alert>
                <ShieldCheck className="h-4 w-4" />
                <AlertTitle>SMART Standalone Launch</AlertTitle>
                <AlertDescription>
                  This initiates an OAuth2 + PKCE flow. You will be redirected to the FHIR
                  server&apos;s authorization page and returned with an access token.
                </AlertDescription>
              </Alert>
              <div className="space-y-2">
                <Label htmlFor="smart-url">FHIR Issuer URL</Label>
                <Input
                  id="smart-url"
                  placeholder="https://sandbox.smarthealthit.org/smart/api/fhir/"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                />
              </div>
              <Button onClick={handleSmart} disabled={!urlInput} className="w-full">
                <ShieldCheck className="mr-2 h-4 w-4" />
                Launch SMART Authorization
              </Button>
            </TabsContent>
          </Tabs>

          {errorMessage && (
            <Alert variant="destructive" className="mt-4">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Connection Error</AlertTitle>
              <AlertDescription className="space-y-3">
                <p>{errorMessage}</p>
                {(errorMessage.includes('Network error') || errorMessage.includes('CORS')) && (
                  <>
                    <p className="text-xs">
                      This environment blocks outbound network requests to external servers.
                      Demo Mode works without any network connection.
                    </p>
                    <Button
                      onClick={connectDemo}
                      size="sm"
                      className="w-full gap-2 bg-gradient-to-r from-emerald-600 to-teal-500 text-white hover:from-emerald-700 hover:to-teal-600"
                    >
                      <FlaskConical className="h-4 w-4" />
                      Switch to Demo Mode Now
                    </Button>
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {status === 'connected' && (
        <Card className="mt-4 w-full max-w-lg border-emerald-200 bg-emerald-50/50">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  {mode === 'demo' ? 'Demo Mode Active' : 'Connected to FHIR Server'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {mode === 'demo' ? 'Built-in sample data — no server required' : baseUrl}
                </div>
                <div className="flex gap-2 pt-1">
                  <Badge variant="secondary">
                    {mode === 'smart' ? 'SMART Auth' : mode === 'demo' ? 'Demo' : 'Public'}
                  </Badge>
                  {auth.patientId && (
                    <Badge variant="outline">Patient: {auth.patientId}</Badge>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={disconnect}>
                Disconnect
              </Button>
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
    </div>
  );
}
