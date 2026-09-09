'use client';

import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface JsonViewerProps {
  data: unknown;
  maxHeight?: string;
  className?: string;
}

export function JsonViewer({ data, maxHeight = '600px', className }: JsonViewerProps) {
  const [copied, setCopied] = useState(false);

  const formatted = useMemo(() => JSON.stringify(data, null, 2), [data]);

  const highlighted = useMemo(() => syntaxHighlight(formatted), [formatted]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formatted);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  };

  return (
    <Card className={`relative flex h-full flex-col overflow-hidden border bg-slate-950 ${className || ''}`}>
      <div className="absolute right-3 top-3 z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          <span className="ml-1.5 text-xs">{copied ? 'Copied' : 'Copy'}</span>
        </Button>
      </div>
      <ScrollArea className="w-full h-full" style={className ? undefined : { maxHeight }}>
        <pre className="p-4 text-sm leading-relaxed">
          <code
            className="font-mono text-slate-200"
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
        </pre>
      </ScrollArea>
    </Card>
  );
}

function syntaxHighlight(json: string): string {
  const escaped = json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return escaped.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
    (match) => {
      let cls = 'text-emerald-400'; // number
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'text-sky-400'; // key
        } else {
          cls = 'text-amber-300'; // string value
        }
      } else if (/true|false/.test(match)) {
        cls = 'text-purple-400'; // boolean
      } else if (/null/.test(match)) {
        cls = 'text-red-400'; // null
      }
      return `<span class="${cls}">${match}</span>`;
    },
  );
}
