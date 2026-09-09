'use client';

import { useState } from 'react';
import type { FhirResource } from '@/lib/fhir/types';
import { RESOURCE_METADATA } from '@/lib/fhir/metadata';
import { JsonViewer } from './json-viewer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Pencil, FileJson, User, Calendar, Hash } from 'lucide-react';

interface ResourceViewerProps {
  resource: FhirResource;
  onEdit: (r: FhirResource) => void;
}

export function ResourceViewer({ resource, onEdit }: ResourceViewerProps) {
  const [view, setView] = useState<'split' | 'human' | 'json'>('split');
  const meta = RESOURCE_METADATA[resource.resourceType];
  const summary = meta?.renderSummary(resource) || [];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b p-3">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="font-mono">
            {resource.resourceType}
          </Badge>
          {resource.id && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Hash className="h-3.5 w-3.5" />
              {resource.id}
            </div>
          )}
          {resource.meta?.versionId && (
            <Badge variant="outline" className="text-xs">
              v{resource.meta.versionId}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
            <TabsList>
              <TabsTrigger value="split" className="text-xs">Split</TabsTrigger>
              <TabsTrigger value="human" className="text-xs">Details</TabsTrigger>
              <TabsTrigger value="json" className="text-xs">JSON</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button size="sm" onClick={() => onEdit(resource)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden p-3">
        {view === 'split' && (
          <div className="grid h-full grid-cols-2 gap-3">
            <HumanPane resource={resource} summary={summary} />
            <JsonViewer data={resource} className="h-full" />
          </div>
        )}
        {view === 'human' && <HumanPane resource={resource} summary={summary} full />}
        {view === 'json' && <JsonViewer data={resource} className="h-full" />}
      </div>
    </div>
  );
}

function HumanPane({
  resource,
  summary,
  full,
}: {
  resource: FhirResource;
  summary: { label: string; value: string }[];
  full?: boolean;
}) {
  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <CardHeader className="shrink-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <User className="h-5 w-5 text-primary" />
          Resource Details
        </CardTitle>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <dl className="space-y-3">
            {summary.map((item) => (
              <div key={item.label} className="grid grid-cols-3 gap-2">
                <dt className="text-sm font-medium text-muted-foreground">{item.label}</dt>
                <dd className="col-span-2 text-sm">{item.value}</dd>
              </div>
            ))}
          </dl>

          {resource.meta?.lastUpdated && (
            <div className="mt-6 flex items-center gap-2 border-t pt-4 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              Last updated: {new Date(resource.meta.lastUpdated).toLocaleString()}
            </div>
          )}

          <div className="mt-6">
            <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
              <FileJson className="h-4 w-4" />
              Raw JSON Preview
            </h4>
            <pre className="max-h-48 overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-200">
              {JSON.stringify(resource, null, 2).slice(0, 2000)}
              {JSON.stringify(resource).length > 2000 ? '\n...' : ''}
            </pre>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
