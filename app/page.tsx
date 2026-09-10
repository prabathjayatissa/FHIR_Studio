'use client';

import { useState, useEffect, useCallback } from 'react';
import { FhirProvider, useFhir } from '@/lib/fhir/context';
import { ConnectionManager } from '@/components/fhir/connection-manager';
import { ResourceExplorer } from '@/components/fhir/resource-explorer';
import { ResourceViewer } from '@/components/fhir/resource-viewer';
import { ResourceEditor } from '@/components/fhir/resource-editor';
import type { FhirResource } from '@/lib/fhir/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  HeartPulse,
  Plus,
  FileText,
  PanelLeftClose,
  PanelLeft,
  Activity,
} from 'lucide-react';

type MainView = 'viewer' | 'editor';

function FhirApp() {
  const { status, baseUrl, mode, auth, completeSmartCallback, disconnect } = useFhir();
  const [selectedResource, setSelectedResource] = useState<FhirResource | null>(null);
  const [editingResource, setEditingResource] = useState<FhirResource | null>(null);
  const [isNewResource, setIsNewResource] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mainView, setMainView] = useState<MainView>('viewer');

  // Handle SMART OAuth callback on mount (when returning from external auth redirect)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (url.searchParams.has('code') && url.searchParams.has('state')) {
        completeSmartCallback();
      }
    }
  }, [completeSmartCallback]);

  const handleEditResource = useCallback((r: FhirResource) => {
    setEditingResource(r);
    setIsNewResource(false);
    setMainView('editor');
  }, []);

  const handleNewResource = useCallback(() => {
    setEditingResource(null);
    setIsNewResource(true);
    setMainView('editor');
  }, []);

  const handleSaved = useCallback((r: FhirResource) => {
    setEditingResource(r);
    setIsNewResource(false);
    setSelectedResource(r);
    setMainView('viewer');
  }, []);

  const handleCloseEditor = useCallback(() => {
    setEditingResource(null);
    setMainView('viewer');
  }, []);

  if (status !== 'connected') {
    return <ConnectionManager />;
  }

  const activeResourceForEditor = editingResource || (isNewResource ? createNewResource('Patient') : null);

  return (
    <div className="flex h-screen flex-col">
      {/* Top Bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b bg-card px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-md p-1.5 hover:bg-accent"
          >
            {sidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeft className="h-5 w-5" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500">
              <HeartPulse className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">FHIR Studio</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 text-sm text-muted-foreground md:flex">
            <Activity className="h-3.5 w-3.5 text-emerald-500" />
            <span className="max-w-[300px] truncate font-mono text-xs">{baseUrl}</span>
          </div>
          <Badge variant={mode === 'smart' ? 'default' : mode === 'demo' ? 'secondary' : 'secondary'}>
            {mode === 'smart' ? 'SMART Auth' : mode === 'demo' ? 'Demo' : 'Public'}
          </Badge>
          {auth.patientId && (
            <Badge variant="outline" className="text-xs">
              Patient: {auth.patientId}
            </Badge>
          )}
          <span className="hidden text-xs text-muted-foreground lg:inline">
            Created by Dr Prabath Jayathissa
          </span>
          <Button variant="ghost" size="sm" onClick={disconnect}>
            Disconnect
          </Button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex min-h-0 flex-1">
        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="w-[380px] shrink-0 overflow-hidden border-r bg-card">
            <ResourceExplorer
              selectedResource={mainView === 'viewer' ? selectedResource : null}
              onSelectResource={(r) => {
                setSelectedResource(r);
                setMainView('viewer');
              }}
              onEditResource={handleEditResource}
            />
          </aside>
        )}

        {/* Main Content */}
        <main className="min-h-0 flex-1 overflow-hidden bg-background">
          {mainView === 'editor' && activeResourceForEditor ? (
            <ResourceEditor
              key={activeResourceForEditor.id || 'new'}
              resource={activeResourceForEditor}
              isNew={isNewResource}
              onClose={handleCloseEditor}
              onSaved={handleSaved}
            />
          ) : mainView === 'viewer' && selectedResource ? (
            <ResourceViewer resource={selectedResource} onEdit={handleEditResource} />
          ) : (
            <EmptyState onNew={handleNewResource} />
          )}
        </main>
      </div>

      {/* New Resource FAB / Action */}
      {mainView === 'viewer' && (
        <button
          onClick={handleNewResource}
          className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:scale-105 hover:shadow-xl"
          title="Create new resource"
        >
          <Plus className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <Card className="max-w-md p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="mb-2 text-xl font-semibold">No Resource Selected</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Click a resource from the list on the left to view its details, or create a new one below.
        </p>
        <Button onClick={onNew}>
          <Plus className="mr-2 h-4 w-4" />
          Create New Resource
        </Button>
      </Card>
    </div>
  );
}

function createNewResource(type: string): FhirResource {
  return {
    resourceType: type,
  } as FhirResource;
}

export default function FhirAppWrapper() {
  return (
    <FhirProvider>
      <FhirApp />
    </FhirProvider>
  );
}
