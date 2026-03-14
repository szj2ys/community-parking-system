import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll, vi } from 'vitest';
import { server } from './mocks/server';

// Import vi explicitly
import { vi } from 'vitest';

// Mock Service Worker setup for API testing
beforeAll(() => {
  // Start MSW server for API mocking
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  // Cleanup React Testing Library
  cleanup();
  // Reset MSW handlers
  server.resetHandlers();
});

afterAll(() => {
  // Close MSW server
  server.close();
});

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
    getAll: vi.fn(),
    has: vi.fn(),
    forEach: vi.fn(),
    entries: vi.fn(),
    keys: vi.fn(),
    values: vi.fn(),
    toString: vi.fn(),
  }),
  usePathname: () => '/',
  redirect: vi.fn(),
  notFound: vi.fn(),
}));

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: () => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    has: vi.fn(),
  }),
  headers: () => ({
    get: vi.fn(),
    has: vi.fn(),
    entries: vi.fn(),
    keys: vi.fn(),
    values: vi.fn(),
    forEach: vi.fn(),
  }),
}));

// Mock environment variables
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET = 'test-secret-key';
