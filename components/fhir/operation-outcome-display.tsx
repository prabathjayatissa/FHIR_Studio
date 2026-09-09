'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import type { ParsedOutcomeIssue } from '@/lib/fhir/operation-outcome';
import { summarizeOutcome } from '@/lib/fhir/operation-outcome';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  AlertOctagon,
} from 'lucide-react';

interface OperationOutcomeDisplayProps {
  issues: ParsedOutcomeIssue[];
  showSummary?: boolean;
}

const SEVERITY_CONFIG: Record<
  ParsedOutcomeIssue['severity'],
  { icon: React.ComponentType<{ className?: string }>; color: string; bg: string }
> = {
  fatal: { icon: AlertOctagon, color: 'text-red-600', bg: 'border-red-300 bg-red-50' },
  error: { icon: XCircle, color: 'text-red-500', bg: 'border-red-200 bg-red-50/50' },
  warning: { icon: AlertTriangle, color: 'text-amber-600', bg: 'border-amber-200 bg-amber-50/50' },
  information: { icon: Info, color: 'text-blue-500', bg: 'border-blue-200 bg-blue-50/50' },
};

export function OperationOutcomeDisplay({ issues, showSummary = true }: OperationOutcomeDisplayProps) {
  if (issues.length === 0) {
    return (
      <Alert className="border-emerald-200 bg-emerald-50/50">
        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        <AlertTitle className="text-emerald-800">Validation Passed</AlertTitle>
        <AlertDescription className="text-emerald-700">
          No issues were reported by the FHIR server.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-3">
      {showSummary && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{summarizeOutcome(issues)}</span>
        </div>
      )}
      <ScrollArea className="max-h-[400px]">
        <div className="space-y-2">
          {issues.map((issue, i) => {
            const config = SEVERITY_CONFIG[issue.severity];
            const Icon = config.icon;
            return (
              <Card key={i} className={`p-3 ${config.bg}`}>
                <div className="flex items-start gap-3">
                  <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${config.color}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        {issue.severity}
                      </Badge>
                      <Badge variant="secondary" className="font-mono text-xs">
                        {issue.code}
                      </Badge>
                      {issue.field && (
                        <Badge variant="outline" className="font-mono text-xs text-muted-foreground">
                          {issue.field}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1.5 text-sm">{issue.message}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
