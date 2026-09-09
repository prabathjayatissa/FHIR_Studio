// Path-based get/set utilities for navigating and mutating nested FHIR JSON objects
// Paths use dot notation with array indices: e.g. "name[0].given[0]"

export function getValueByPath(obj: unknown, path: string): unknown {
  if (!obj || typeof obj !== 'object') return undefined;
  let current: unknown = obj;
  const parts = path.split(/\.|\[(\d+)\]/).filter(Boolean);
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (/^\d+$/.test(part)) {
      current = (current as unknown[])[parseInt(part, 10)];
    } else {
      current = (current as Record<string, unknown>)[part];
    }
  }
  return current;
}

function ensureStructure(obj: Record<string, unknown>, path: string, isLeaf: boolean): void {
  const parts = path.split(/\.|\[(\d+)\]/).filter(Boolean);
  let current: unknown = obj;
  for (let i = 0; i < parts.length - (isLeaf ? 0 : 1); i++) {
    const part = parts[i];
    const isIndex = /^\d+$/.test(part);
    const idx = isIndex ? parseInt(part, 10) : 0;
    const parent = current as Record<string, unknown> | unknown[];
    const key = isIndex ? idx : part;
    const child = isIndex ? (parent as unknown[])[idx] : (parent as Record<string, unknown>)[part];

    if (child === undefined || child === null) {
      const nextPart = parts[i + 1];
      const nextIsIndex = nextPart !== undefined && /^\d+$/.test(nextPart);
      const newVal = nextIsIndex ? [] : {};
      if (isIndex) {
        const arr = parent as unknown[];
        while (arr.length < idx) arr.push(undefined);
        arr[idx] = newVal;
      } else {
        (parent as Record<string, unknown>)[part] = newVal;
      }
    }
    current = isIndex ? (parent as unknown[])[idx] : (parent as Record<string, unknown>)[part];
  }
}

export function setValueByPath(obj: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split(/\.|\[(\d+)\]/).filter(Boolean);
  let current: unknown = obj;
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const isIndex = /^\d+$/.test(part);
    const idx = isIndex ? parseInt(part, 10) : 0;
    const isLast = i === parts.length - 1;
    const parent = current as Record<string, unknown> | unknown[];

    if (isIndex) {
      const arr = parent as unknown[];
      while (arr.length < idx) arr.push(undefined);
      if (isLast) {
        arr[idx] = value;
      } else {
        const nextPart = parts[i + 1];
        const nextIsIndex = nextPart !== undefined && /^\d+$/.test(nextPart);
        if (arr[idx] === undefined || arr[idx] === null) {
          arr[idx] = nextIsIndex ? [] : {};
        }
        current = arr[idx];
      }
    } else {
      if (isLast) {
        (parent as Record<string, unknown>)[part] = value;
      } else {
        const nextPart = parts[i + 1];
        const nextIsIndex = nextPart !== undefined && /^\d+$/.test(nextPart);
        if ((parent as Record<string, unknown>)[part] === undefined || (parent as Record<string, unknown>)[part] === null) {
          (parent as Record<string, unknown>)[part] = nextIsIndex ? [] : {};
        }
        current = (parent as Record<string, unknown>)[part];
      }
    }
  }
}

export function cleanupEmpty(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    const cleaned = obj.map(cleanupEmpty).filter((v) => v !== undefined && v !== null);
    if (cleaned.length === 0) return undefined;
    if (cleaned.some((v, i) => v !== obj[i])) return cleaned;
    return cleaned.length === obj.length ? obj : cleaned;
  }
  if (obj !== null && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    let changed = false;
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      const cleaned = cleanupEmpty(v);
      if (cleaned === undefined || cleaned === null) {
        changed = true;
      } else {
        if (cleaned !== v) changed = true;
        result[k] = cleaned;
      }
    }
    if (Object.keys(result).length === 0) return undefined;
    return changed ? result : obj;
  }
  if (obj === '' || obj === undefined || obj === null) return undefined;
  return obj;
}

export { ensureStructure };
