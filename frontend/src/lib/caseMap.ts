// Converts snake_case API payloads to camelCase internally, and back on write.
// The only boundary that calls these is sync/apiClient.ts.

export function snakeToCamel(input: unknown): unknown {
  if (Array.isArray(input)) return input.map(snakeToCamel);
  if (input && typeof input === "object" && input.constructor === Object) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      out[toCamel(k)] = snakeToCamel(v);
    }
    return out;
  }
  return input;
}

export function camelToSnake(input: unknown): unknown {
  if (Array.isArray(input)) return input.map(camelToSnake);
  if (input && typeof input === "object" && input.constructor === Object) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      out[toSnake(k)] = camelToSnake(v);
    }
    return out;
  }
  return input;
}

function toCamel(s: string): string {
  return s.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
}

function toSnake(s: string): string {
  return s.replace(/([A-Z])/g, (_, c) => "_" + c.toLowerCase());
}
