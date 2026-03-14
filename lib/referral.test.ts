import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateReferralCode,
  getReferralLink,
  isValidReferralCodeFormat,
  extractReferralCode,
  calculateReferralReward,
  storeReferralCode,
  getStoredReferralCode,
  clearStoredReferralCode,
} from './referral';

describe('referral', () => {
  describe('generateReferralCode', () => {
    it('should generate code with CP prefix', () => {
      const code = generateReferralCode();
      expect(code).toMatch(/^CP/);
    });

    it('should generate code with correct length', () => {
      const code = generateReferralCode();
      expect(code.length).toBe(10); // "CP" + 8 characters
    });

    it('should generate unique codes', () => {
      const codes = new Set();
      for (let i = 0; i < 100; i++) {
        codes.add(generateReferralCode());
      }
      expect(codes.size).toBe(100);
    });

    it('should not contain confusing characters', () => {
      const confusingChars = ['0', 'O', '1', 'I'];
      for (let i = 0; i < 50; i++) {
        const code = generateReferralCode();
        confusingChars.forEach(char => {
          expect(code).not.toContain(char);
        });
      }
    });
  });

  describe('getReferralLink', () => {
    it('should return link with referral code', () => {
      const code = 'CPABC234GH';
      const link = getReferralLink(code);
      expect(link).toContain(code);
      expect(link).toContain('/auth/login?ref=');
    });

    it('should use environment variable for base URL', () => {
      const originalEnv = process.env.NEXT_PUBLIC_APP_URL;
      process.env.NEXT_PUBLIC_APP_URL = 'https://test.example.com';

      const code = 'CPTEST2345';
      const link = getReferralLink(code);
      expect(link).toBe('https://test.example.com/auth/login?ref=CPTEST2345');

      process.env.NEXT_PUBLIC_APP_URL = originalEnv;
    });

    it('should fallback to default URL when env not set', () => {
      const originalEnv = process.env.NEXT_PUBLIC_APP_URL;
      delete process.env.NEXT_PUBLIC_APP_URL;

      const code = 'CPTEST2345';
      const link = getReferralLink(code);
      expect(link).toContain('parking.app');

      process.env.NEXT_PUBLIC_APP_URL = originalEnv;
    });
  });

  describe('isValidReferralCodeFormat', () => {
    it('should return true for valid code format', () => {
      expect(isValidReferralCodeFormat('CPABC234GH')).toBe(true);
      expect(isValidReferralCodeFormat('CP23456789')).toBe(true);
      expect(isValidReferralCodeFormat('CPABCDEFGH')).toBe(true);
    });

    it('should return false for code without CP prefix', () => {
      expect(isValidReferralCodeFormat('ABC2345678')).toBe(false);
      expect(isValidReferralCodeFormat('XXABC234GH')).toBe(false);
    });

    it('should return false for code with wrong length', () => {
      expect(isValidReferralCodeFormat('CPABC2345')).toBe(false); // 9 chars
      expect(isValidReferralCodeFormat('CPABC2345GH')).toBe(false); // 11 chars
    });

    it('should return false for code with confusing characters', () => {
      expect(isValidReferralCodeFormat('CPABC0O234')).toBe(false); // contains 0, O
      expect(isValidReferralCodeFormat('CPI2345678')).toBe(false); // contains I
    });

    it('should return false for empty string', () => {
      expect(isValidReferralCodeFormat('')).toBe(false);
    });

    it('should return false for lowercase letters', () => {
      expect(isValidReferralCodeFormat('cpabc234gh')).toBe(false);
      expect(isValidReferralCodeFormat('CpAbc234Gh')).toBe(false);
    });
  });

  describe('extractReferralCode', () => {
    it('should extract code from URL with ref parameter', () => {
      const url = 'https://example.com/auth/login?ref=CPABC234GH';
      expect(extractReferralCode(url)).toBe('CPABC234GH');
    });

    it('should return null for URL without ref parameter', () => {
      const url = 'https://example.com/auth/login';
      expect(extractReferralCode(url)).toBeNull();
    });

    it('should return null for invalid code format', () => {
      const url = 'https://example.com/auth/login?ref=INVALID';
      expect(extractReferralCode(url)).toBeNull();
    });

    it('should return null for malformed URL', () => {
      expect(extractReferralCode('not-a-url')).toBeNull();
    });

    it('should extract code from URL with multiple parameters', () => {
      const url = 'https://example.com/auth/login?other=value&ref=CPABC234GH&foo=bar';
      expect(extractReferralCode(url)).toBe('CPABC234GH');
    });
  });

  describe('calculateReferralReward', () => {
    it('should calculate 10% of order amount', () => {
      expect(calculateReferralReward(100)).toBe(10);
      expect(calculateReferralReward(200)).toBe(20);
      expect(calculateReferralReward(150)).toBe(15);
    });

    it('should cap reward at 50 yuan', () => {
      expect(calculateReferralReward(1000)).toBe(50);
      expect(calculateReferralReward(500)).toBe(50);
      expect(calculateReferralReward(600)).toBe(50);
    });

    it('should floor the reward amount', () => {
      expect(calculateReferralReward(105)).toBe(10); // 10.5 -> 10
      expect(calculateReferralReward(99)).toBe(9); // 9.9 -> 9
    });

    it('should handle zero order amount', () => {
      expect(calculateReferralReward(0)).toBe(0);
    });
  });

  describe('localStorage operations', () => {
    let localStorageMock: Storage;

    beforeEach(() => {
      const store: Record<string, string> = {};
      localStorageMock = {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
        removeItem: vi.fn((key: string) => { delete store[key]; }),
        clear: vi.fn(() => { Object.keys(store).forEach(key => delete store[key]); }),
        length: 0,
        key: vi.fn(),
      };
      Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    describe('storeReferralCode', () => {
      it('should store code in localStorage', () => {
        storeReferralCode('CPABC234GH');
        expect(localStorageMock.setItem).toHaveBeenCalledWith('referral_code', 'CPABC234GH');
      });

      it('should not throw when localStorage is unavailable', () => {
        Object.defineProperty(globalThis, 'localStorage', { value: undefined, writable: true });
        expect(() => storeReferralCode('CPABC234GH')).not.toThrow();
      });
    });

    describe('getStoredReferralCode', () => {
      it('should retrieve code from localStorage', () => {
        (localStorageMock.getItem as ReturnType<typeof vi.fn>).mockReturnValue('CPABC234GH');
        const code = getStoredReferralCode();
        expect(code).toBe('CPABC234GH');
        expect(localStorageMock.getItem).toHaveBeenCalledWith('referral_code');
      });

      it('should return null when no code stored', () => {
        (localStorageMock.getItem as ReturnType<typeof vi.fn>).mockReturnValue(null);
        const code = getStoredReferralCode();
        expect(code).toBeNull();
      });

      it('should return null when localStorage is unavailable', () => {
        Object.defineProperty(globalThis, 'localStorage', { value: undefined, writable: true });
        const code = getStoredReferralCode();
        expect(code).toBeNull();
      });
    });

    describe('clearStoredReferralCode', () => {
      it('should remove code from localStorage', () => {
        clearStoredReferralCode();
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('referral_code');
      });

      it('should not throw when localStorage is unavailable', () => {
        Object.defineProperty(globalThis, 'localStorage', { value: undefined, writable: true });
        expect(() => clearStoredReferralCode()).not.toThrow();
      });
    });
  });
});
