'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { json as jsonLang } from '@codemirror/lang-json';
import { EditorView } from '@codemirror/view';
import type { FhirResource } from '@/lib/fhir/types';
import { RESOURCE_METADATA } from '@/lib/fhir/metadata';
import { FhirError } from '@/lib/fhir/client';
import { getValueByPath, setValueByPath, cleanupEmpty } from '@/lib/fhir/path-utils';
import { useFhir } from '@/lib/fhir/context';
import { parseOperationOutcome, type ParsedOutcomeIssue } from '@/lib/fhir/operation-outcome';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { OperationOutcomeDisplay } from './operation-outcome-display';
import {
  Save,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  FileJson,
  FormInput,
  SplitSquareHorizontal,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

interface ResourceEditorProps {
  resource: FhirResource;
  isNew: boolean;
  onClose: () => void;
  onSaved: (r: FhirResource) => void;
}

export function ResourceEditor({ resource, isNew, onClose, onSaved }: ResourceEditorProps) {
  const { client } = useFhir();
  const [data, setData] = useState<FhirResource>(() => JSON.parse(JSON.stringify(resource)));
  const [jsonText, setJsonText] = useState(() => JSON.stringify(resource, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [view, setView] = useState<'split' | 'form' | 'json'>('split');
  const [validating, setValidating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validationIssues, setValidationIssues] = useState<ParsedOutcomeIssue[] | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const meta = RESOURCE_METADATA[resource.resourceType];

  // Sync JSON text when data changes from form edits
  const syncJsonFromData = useCallback((newData: FhirResource) => {
    setJsonText(JSON.stringify(newData, null, 2));
    setJsonError(null);
  }, []);

  // Update a form field and sync JSON
  const updateField = useCallback(
    (path: string, value: string) => {
      setData((prev) => {
        const next = JSON.parse(JSON.stringify(prev)) as Record<string, unknown>;
        if (value === '') {
          setValueByPath(next, path, undefined);
        } else {
          setValueByPath(next, path, value);
        }
        const cleaned = cleanupEmpty(next) as FhirResource || { resourceType: prev.resourceType };
        if (!cleaned.resourceType) cleaned.resourceType = prev.resourceType;
        syncJsonFromData(cleaned);
        return cleaned;
      });
      // Clear field error for this path
      setFieldErrors((prev) => {
        if (!prev[path]) return prev;
        const next = { ...prev };
        delete next[path];
        return next;
      });
    },
    [syncJsonFromData],
  );

  // Update data from JSON text edits (with debounce via useEffect)
  const handleJsonChange = useCallback((value: string) => {
    setJsonText(value);
    try {
      const parsed = JSON.parse(value);
      if (!parsed.resourceType) {
        setJsonError('Missing required "resourceType" field.');
        return;
      }
      setData(parsed);
      setJsonError(null);
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : 'Invalid JSON');
    }
  }, []);

  // Validate against FHIR server
  const handleValidate = useCallback(async () => {
    if (!client) return;
    if (jsonError) {
      toast.error('Fix JSON syntax errors before validating.');
      return;
    }
    setValidating(true);
    setValidationIssues(null);
    try {
      const outcome = await client.validate(data) as import('@/lib/fhir/types').FhirOperationOutcome;
      const issues = parseOperationOutcome(outcome);
      setValidationIssues(issues);

      // Map issues to form fields
      const errors: Record<string, string> = {};
      for (const issue of issues) {
        if (issue.field && (issue.severity === 'error' || issue.severity === 'fatal')) {
          errors[issue.field] = issue.message;
        }
      }
      setFieldErrors(errors);

      if (issues.length === 0) {
        toast.success('Validation passed — no issues found.');
      } else {
        const hasErrors = issues.some((i) => i.severity === 'error' || i.severity === 'fatal');
        if (hasErrors) {
          toast.warning('Validation found errors.');
        } else {
          toast.success('Validation passed with warnings.');
        }
      }
    } catch (err) {
      const outcome = err instanceof FhirError ? err.outcome : null;
      if (outcome) {
        const issues = parseOperationOutcome(outcome);
        setValidationIssues(issues);
      } else {
        setValidationIssues([
          {
            severity: 'fatal',
            code: 'exception',
            message: err instanceof Error ? err.message : 'Validation request failed.',
            field: null,
            cssClass: 'issue-fatal',
          },
        ]);
      }
      toast.error('Validation failed.');
    } finally {
      setValidating(false);
    }
  }, [client, data, jsonError]);

  // Save (create or update)
  const handleSave = useCallback(async () => {
    if (!client) return;
    if (jsonError) {
      toast.error('Fix JSON syntax errors before saving.');
      return;
    }
    setSaving(true);
    try {
      let saved: FhirResource;
      if (isNew || !data.id) {
        saved = await client.create(data) as FhirResource;
      } else {
        saved = await client.update(data) as FhirResource;
      }
      toast.success(isNew ? 'Resource created successfully.' : 'Resource updated successfully.');
      onSaved(saved);
    } catch (err) {
      const outcome = err instanceof FhirError ? err.outcome : null;
      if (outcome) {
        const issues = parseOperationOutcome(outcome);
        setValidationIssues(issues);
        const errors: Record<string, string> = {};
        for (const issue of issues) {
          if (issue.field && (issue.severity === 'error' || issue.severity === 'fatal')) {
            errors[issue.field] = issue.message;
          }
        }
        setFieldErrors(errors);
      }
      toast.error(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  }, [client, data, jsonError, isNew, onSaved]);

  const editorTheme = useMemo(
    () =>
      EditorView.theme({
        '&': {
          fontSize: '13px',
          height: '100%',
        },
        '.cm-scroller': {
          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
        },
        '.cm-content': {
          padding: '12px',
        },
      }),
    [],
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b p-3">
        <div className="flex items-center gap-3">
          <Badge variant={isNew ? 'default' : 'secondary'} className="font-mono">
            {isNew ? 'New' : 'Edit'}
          </Badge>
          <Badge variant="outline" className="font-mono">
            {resource.resourceType}
          </Badge>
          {data.id && (
            <span className="text-sm text-muted-foreground">ID: {data.id}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
            <TabsList>
              <TabsTrigger value="split" className="text-xs">
                <SplitSquareHorizontal className="h-3.5 w-3.5" />
              </TabsTrigger>
              <TabsTrigger value="form" className="text-xs">
                <FormInput className="h-3.5 w-3.5" />
              </TabsTrigger>
              <TabsTrigger value="json" className="text-xs">
                <FileJson className="h-3.5 w-3.5" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button size="sm" variant="outline" onClick={handleValidate} disabled={validating || !!jsonError}>
            {validating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
            Validate
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving || !!jsonError}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isNew ? 'Create' : 'Save'}
          </Button>
          <Button size="sm" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {jsonError && (
        <Alert variant="destructive" className="mx-3 mt-3">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>JSON Syntax Error</AlertTitle>
          <AlertDescription className="font-mono text-xs">{jsonError}</AlertDescription>
        </Alert>
      )}

      <div className="min-h-0 flex-1 overflow-hidden p-3">
        {view === 'split' && (
          <div className="grid h-full grid-cols-2 gap-3">
            <FormPane
              data={data}
              meta={meta}
              fieldErrors={fieldErrors}
              onFieldChange={updateField}
            />
            <JsonEditorPane jsonText={jsonText} onChange={handleJsonChange} theme={editorTheme} />
          </div>
        )}
        {view === 'form' && (
          <FormPane
            data={data}
            meta={meta}
            fieldErrors={fieldErrors}
            onFieldChange={updateField}
            full
          />
        )}
        {view === 'json' && (
          <JsonEditorPane jsonText={jsonText} onChange={handleJsonChange} theme={editorTheme} full />
        )}
      </div>

      {validationIssues && (
        <div className="border-t p-3">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-semibold">Validation Results</h4>
            <Button size="sm" variant="ghost" onClick={() => setValidationIssues(null)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          <OperationOutcomeDisplay issues={validationIssues} />
        </div>
      )}
    </div>
  );
}

function FormPane({
  data,
  meta,
  fieldErrors,
  onFieldChange,
  full,
}: {
  data: FhirResource;
  meta: typeof RESOURCE_METADATA[string] | undefined;
  fieldErrors: Record<string, string>;
  onFieldChange: (path: string, value: string) => void;
  full?: boolean;
}) {
  if (!meta) {
    return (
      <Card className="flex h-full items-center justify-center">
        <CardContent className="text-center text-muted-foreground">
          No form template available for this resource type.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <CardHeader className="shrink-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FormInput className="h-4 w-4 text-primary" />
          {meta.label} Form
        </CardTitle>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="space-y-4 pr-3">
            {meta.formFields.map((field) => {
              const value = getValueByPath(data, field.path);
              const valueStr = value === undefined ? '' : String(value);
              const error = fieldErrors[field.path];

              return (
                <div key={field.path} className="space-y-1.5">
                  <Label htmlFor={`field-${field.path}`} className="text-sm font-medium">
                    {field.label}
                    {field.required && <span className="ml-1 text-red-500">*</span>}
                  </Label>
                  {field.type === 'select' ? (
                    <Select
                      value={valueStr || '__none__'}
                      onValueChange={(v) => onFieldChange(field.path, v === '__none__' ? '' : v)}
                    >
                      <SelectTrigger id={`field-${field.path}`} className="w-full">
                        <SelectValue placeholder={field.placeholder || 'Select...'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">-- None --</SelectItem>
                        {field.options?.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : field.type === 'textarea' ? (
                    <Textarea
                      id={`field-${field.path}`}
                      value={valueStr}
                      placeholder={field.placeholder}
                      onChange={(e) => onFieldChange(field.path, e.target.value)}
                      className={error ? 'border-red-500' : ''}
                    />
                  ) : (
                    <Input
                      id={`field-${field.path}`}
                      type={
                        field.type === 'date'
                          ? 'date'
                          : field.type === 'datetime'
                            ? 'datetime-local'
                            : field.type === 'number'
                              ? 'number'
                              : 'text'
                      }
                      value={valueStr}
                      placeholder={field.placeholder}
                      onChange={(e) => onFieldChange(field.path, e.target.value)}
                      className={error ? 'border-red-500' : ''}
                    />
                  )}
                  {field.helpText && (
                    <p className="text-xs text-muted-foreground">{field.helpText}</p>
                  )}
                  {error && (
                    <p className="text-xs text-red-500">{error}</p>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function JsonEditorPane({
  jsonText,
  onChange,
  theme,
  full,
}: {
  jsonText: string;
  onChange: (value: string) => void;
  theme: ReturnType<typeof EditorView.theme>;
  full?: boolean;
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border">
      <div className="flex shrink-0 items-center gap-2 border-b bg-slate-900 px-3 py-2">
        <FileJson className="h-4 w-4 text-slate-400" />
        <span className="text-xs font-medium text-slate-300">FHIR JSON</span>
      </div>
      <div className="min-h-0 flex-1 overflow-auto bg-slate-950">
        <CodeMirror
          value={jsonText}
          onChange={onChange}
          extensions={[jsonLang(), theme, EditorView.lineWrapping]}
          theme="dark"
          height="100%"
          basicSetup={{
            foldGutter: true,
            highlightActiveLine: true,
            autocompletion: true,
            bracketMatching: true,
          }}
        />
      </div>
    </div>
  );
}
