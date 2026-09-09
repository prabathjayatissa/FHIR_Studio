import type { FhirOperationOutcome, IssueSeverity } from './types';

export interface ParsedOutcomeIssue {
  severity: IssueSeverity;
  code: string;
  message: string;
  field: string | null;
  cssClass: 'issue-fatal' | 'issue-error' | 'issue-warning' | 'issue-info';
}

export function parseOperationOutcome(outcome: unknown): ParsedOutcomeIssue[] {
  if (!outcome || typeof outcome !== 'object') return [];
  const resource = outcome as FhirOperationOutcome;
  if (resource.resourceType !== 'OperationOutcome' || !Array.isArray(resource.issue)) {
    return [];
  }
  return resource.issue.map((issue) => ({
    severity: issue.severity,
    code: issue.code,
    message: issue.diagnostics || issue.details?.text || issue.code || 'Unknown issue',
    field: issue.expression?.[0] || issue.location?.[0] || null,
    cssClass: `issue-${issue.severity}` as ParsedOutcomeIssue['cssClass'],
  }));
}

export function hasBlockingErrors(issues: ParsedOutcomeIssue[]): boolean {
  return issues.some((i) => i.severity === 'error' || i.severity === 'fatal');
}

export function summarizeOutcome(issues: ParsedOutcomeIssue[]): string {
  if (issues.length === 0) return 'Validation passed with no issues.';
  const counts = issues.reduce(
    (acc, i) => {
      acc[i.severity] = (acc[i.severity] || 0) + 1;
      return acc;
    },
    {} as Record<IssueSeverity, number>,
  );
  const parts = Object.entries(counts).map(([sev, n]) => `${n} ${sev}${n > 1 ? 's' : ''}`);
  return `Validation completed: ${parts.join(', ')}.`;
}
