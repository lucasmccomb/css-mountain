import type { Env } from "../types";

interface MockD1Result {
  results: Record<string, unknown>[];
  success: boolean;
  meta: Record<string, unknown>;
}

export function createMockD1(): D1Database {
  const mockResults: Map<string, unknown> = new Map();

  const createStatement = (query: string) => {
    let boundValues: unknown[] = [];

    const stmt = {
      bind(...values: unknown[]) {
        boundValues = values;
        return stmt;
      },
      async first<T>(_column?: string): Promise<T | null> {
        const key = `first:${query}:${JSON.stringify(boundValues)}`;
        const result = mockResults.get(key);
        return (result as T) ?? null;
      },
      async all<T>(): Promise<D1Result<T>> {
        const key = `all:${query}:${JSON.stringify(boundValues)}`;
        const result = (mockResults.get(key) as MockD1Result) ?? {
          results: [],
          success: true,
          meta: {},
        };
        return result as unknown as D1Result<T>;
      },
      async run(): Promise<D1Result> {
        return { results: [], success: true, meta: {} } as unknown as D1Result;
      },
      async raw(_options?: unknown): Promise<unknown[]> {
        return [];
      },
    } as unknown as D1PreparedStatement;

    return stmt;
  };

  return {
    prepare: (query: string) => createStatement(query),
    dump: async () => new ArrayBuffer(0),
    batch: async (stmts: D1PreparedStatement[]) => {
      return stmts.map(
        () =>
          ({
            results: [],
            success: true,
            meta: {},
          }) as unknown as D1Result,
      );
    },
    exec: async () => ({
      count: 0,
      duration: 0,
    }),
    withSession: () => createMockD1(),
  } as unknown as D1Database;
}

export function createMockKV(): KVNamespace {
  const store = new Map<string, { value: string; expiration?: number }>();

  return {
    get: async (key: string, _options?: unknown) => {
      const entry = store.get(key);
      if (!entry) return null;
      if (entry.expiration && Date.now() / 1000 > entry.expiration) {
        store.delete(key);
        return null;
      }
      return entry.value;
    },
    put: async (key: string, value: string, options?: { expirationTtl?: number }) => {
      const expiration = options?.expirationTtl
        ? Date.now() / 1000 + options.expirationTtl
        : undefined;
      store.set(key, { value, expiration });
    },
    delete: async (key: string) => {
      store.delete(key);
    },
    list: async () => ({
      keys: Array.from(store.keys()).map((name) => ({ name })),
      list_complete: true,
      cacheStatus: null,
    }),
    getWithMetadata: async () => ({ value: null, metadata: null, cacheStatus: null }),
  } as unknown as KVNamespace;
}

export function createMockR2(): R2Bucket {
  const store = new Map<string, { body: string; metadata?: Record<string, string> }>();

  return {
    get: async (key: string) => {
      const entry = store.get(key);
      if (!entry) return null;
      return {
        json: async () => JSON.parse(entry.body),
        text: async () => entry.body,
        arrayBuffer: async () => new TextEncoder().encode(entry.body).buffer,
        body: null,
        bodyUsed: false,
        key,
        version: "1",
        size: entry.body.length,
        etag: "mock-etag",
        httpEtag: '"mock-etag"',
        checksums: {},
        uploaded: new Date(),
        httpMetadata: {},
        customMetadata: entry.metadata ?? {},
        writeHttpMetadata: () => {},
        range: undefined,
        blob: async () => new Blob([entry.body]),
      };
    },
    put: async (key: string, value: unknown) => {
      store.set(key, { body: typeof value === "string" ? value : JSON.stringify(value) });
      return {} as R2Object;
    },
    delete: async (_key: string) => {},
    list: async () => ({
      objects: Array.from(store.keys()).map((key) => ({ key, size: 0 })),
      truncated: false,
      delimitedPrefixes: [],
    }),
    head: async () => null,
    createMultipartUpload: async () => ({}) as R2MultipartUpload,
    resumeMultipartUpload: () => ({}) as R2MultipartUpload,
  } as unknown as R2Bucket;
}

export function createMockEnv(overrides: Partial<Env> = {}): Env {
  return {
    DB: createMockD1(),
    KV: createMockKV(),
    ASSETS: createMockR2(),
    ENVIRONMENT: "development",
    GOOGLE_CLIENT_ID: "test-google-client-id",
    GOOGLE_CLIENT_SECRET: "test-google-client-secret",
    GITHUB_CLIENT_ID: "test-github-client-id",
    GITHUB_CLIENT_SECRET: "test-github-client-secret",
    APP_URL: "http://localhost:5173",
    ...overrides,
  };
}

export function createSessionCookie(sessionId: string): string {
  return `css_mountain_session=${sessionId}`;
}
