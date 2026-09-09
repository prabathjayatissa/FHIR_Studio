'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useFhir } from '@/lib/fhir/context';
import { RESOURCE_METADATA, RESOURCE_TYPES } from '@/lib/fhir/metadata';
import type { FhirResource, FhirResourceType, PaginationLinks } from '@/lib/fhir/types';
import { FhirError } from '@/lib/fhir/client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  Activity,
  Stethoscope,
  ClipboardList,
  Pill,
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Users,
  Activity,
  Stethoscope,
  ClipboardList,
  Pill,
};

interface ResourceExplorerProps {
  selectedResource: FhirResource | null;
  onSelectResource: (r: FhirResource | null) => void;
  onEditResource: (r: FhirResource) => void;
}

export function ResourceExplorer({
  selectedResource,
  onSelectResource,
  onEditResource,
}: ResourceExplorerProps) {
  const { client } = useFhir();
  const [activeType, setActiveType] = useState<FhirResourceType>('Patient');
  const [searchValues, setSearchValues] = useState<Record<string, string>>({});
  const [results, setResults] = useState<FhirResource[]>([]);
  const [total, setTotal] = useState(0);
  const [links, setLinks] = useState<PaginationLinks>({});
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const meta = RESOURCE_METADATA[activeType];

  const performSearch = useCallback(
    async (pageUrl?: string) => {
      if (!client) return;
      setLoading(true);
      setError(null);
      try {
        const params: Record<string, string> = {};
        for (const [k, v] of Object.entries(searchValues)) {
          if (v.trim()) params[k] = v.trim();
        }
        const result = await client.search(activeType, params, pageUrl) as import('@/lib/fhir/client').SearchResult;
        setResults(result.resources);
        setTotal(result.total);
        setLinks(result.links);
        setSearched(true);
      } catch (err) {
        const msg = err instanceof FhirError ? err.message : err instanceof Error ? err.message : 'Search failed';
        setError(msg);
        setResults([]);
        toast.error('Search failed', { description: msg });
      } finally {
        setLoading(false);
      }
    },
    [client, activeType, searchValues],
  );

  // Auto-search when client or resource type changes (so demo data appears immediately)
  const skipSearchRef = useRef(false);
  useEffect(() => {
    if (skipSearchRef.current) {
      skipSearchRef.current = false;
      return;
    }
    if (client) {
      performSearch();
    }
  }, [client, activeType, performSearch]);

  const handleTypeChange = (type: FhirResourceType) => {
    setActiveType(type);
    setResults([]);
    setSearched(false);
    setLinks({});
    setTotal(0);
    setSearchValues({});
    setError(null);
    onSelectResource(null);
    // useEffect will auto-search when activeType changes
  };

  const handleParamChange = (name: string, value: string) => {
    setSearchValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleRowClick = (r: FhirResource) => {
    onSelectResource(selectedResource?.id === r.id ? null : r);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-3">
        <div className="mb-3 grid grid-cols-5 gap-1.5">
          {RESOURCE_TYPES.map((type) => {
            const m = RESOURCE_METADATA[type];
            const Icon = ICONS[m.icon] || Activity;
            const isActive = activeType === type;
            return (
              <button
                key={type}
                onClick={() => handleTypeChange(type)}
                className={`flex flex-col items-center gap-1.5 rounded-lg border p-2.5 transition-all ${
                  isActive
                    ? 'border-primary bg-primary/5 text-primary shadow-sm'
                    : 'border-border text-muted-foreground hover:border-primary/30 hover:bg-accent/50'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-[10px] font-medium leading-tight">{m.label}</span>
              </button>
            );
          })}
        </div>
        <p className="mb-2 text-xs text-muted-foreground">{meta.description}</p>

        <div className="space-y-2">
          {meta.searchParams.map((param) => (
            <div key={param.name} className="flex items-center gap-2">
              <Label htmlFor={`sp-${param.name}`} className="w-28 shrink-0 text-xs font-medium text-muted-foreground">
                {param.label}
              </Label>
              <Input
                id={`sp-${param.name}`}
                placeholder={param.placeholder || param.name}
                value={searchValues[param.name] || ''}
                onChange={(e) => handleParamChange(param.name, e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && performSearch()}
                className="h-8 text-sm"
              />
            </div>
          ))}
        </div>

        <div className="mt-3 flex gap-2">
          <Button onClick={() => performSearch()} disabled={loading} size="sm" className="flex-1">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
            Search
          </Button>
          <Button
            onClick={() => performSearch()}
            disabled={loading}
            size="sm"
            variant="outline"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        {loading && (
          <div className="space-y-2 p-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="p-3">
            <Card className="border-red-200 bg-red-50/50 p-3 text-sm text-red-700">{error}</Card>
          </div>
        )}

        {!loading && !error && searched && results.length === 0 && (
          <div className="p-6 text-center text-sm text-muted-foreground">
            No {meta.label.toLowerCase()} found matching your search.
          </div>
        )}

        {!loading && !error && results.length > 0 && (
          <div className="flex h-full flex-col">
            <div className="flex shrink-0 items-center justify-between border-b px-3 py-2">
              <span className="text-xs text-muted-foreground">
                {total} {total === 1 ? 'result' : 'results'}
              </span>
            </div>
            <ScrollArea className="min-h-0 flex-1">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card">
                  <tr className="border-b">
                    {meta.columns.map((col) => (
                      <th
                        key={col.key}
                        className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground"
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => {
                    const isSelected = selectedResource?.id === r.id;
                    return (
                      <tr
                        key={r.id}
                        onClick={() => handleRowClick(r)}
                        className={`cursor-pointer border-b transition-colors ${
                          isSelected ? 'bg-primary/10' : 'hover:bg-accent/50'
                        }`}
                      >
                        {meta.columns.map((col) => (
                          <td key={col.key} className="px-3 py-2.5">
                            {col.render(r)}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </ScrollArea>

            {(links.previous || links.next) && (
              <div className="flex shrink-0 items-center justify-center gap-2 border-t p-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!links.previous || loading}
                  onClick={() => performSearch(links.previous)}
                >
                  <ChevronLeft className="h-4 w-4" /> Prev
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!links.next || loading}
                  onClick={() => performSearch(links.next)}
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
