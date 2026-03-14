import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateCode, verifyCode } from './auth-code';

describe('auth', () => {
  describe('generateCode', () => {
    beforeEach(() => {
      // Clear any existing codes before each test
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should generate 6-digit code', () => {
      const code = generateCode('13800138000');
      expect(code).toMatch(/^\d{6}$/);
    });

    it('should generate different codes for different phones', () => {
      const code1 = generateCode('13800138000');
      const code2 = generateCode('13900139000');
      expect(code1).not.toBe(code2);
    });

    it('should overwrite previous code for same phone', () => {
      const phone = '13800138000';
      const code1 = generateCode(phone);
      const code2 = generateCode(phone);
      expect(code1).not.toBe(code2);
      expect(verifyCode(phone, code2)).toBe(true);
      expect(verifyCode(phone, code1)).toBe(false);
    });

    it('should expire code after 5 minutes', () => {
      const phone = '13800138000';
      const code = generateCode(phone);

      // Code should be valid immediately
      expect(verifyCode(phone, code)).toBe(true);

      // Advance time by 5 minutes
      vi.advanceTimersByTime(5 * 60 * 1000);

      // Code should be expired
      expect(verifyCode(phone, code)).toBe(false);
    });

    it('should generate numeric codes only', () => {
      const code = generateCode('13800138000');
      expect(/\d/.test(code)).toBe(true);
      expect(/[a-zA-Z]/.test(code)).toBe(false);
    });
  });

  describe('verifyCode', () => {
    it('should return true for valid code', () => {
      const phone = '13800138000';
      const code = generateCode(phone);
      expect(verifyCode(phone, code)).toBe(true);
    });

    it('should return false for invalid code', () => {
      const phone = '13800138000';
      generateCode(phone);
      expect(verifyCode(phone, '000001')).toBe(false);
    });

    it('should return false for non-existent phone', () => {
      expect(verifyCode('13800138099', '123456')).toBe(false);
    });

    it('should return false for empty code', () => {
      const phone = '13800138000';
      generateCode(phone);
      expect(verifyCode(phone, '')).toBe(false);
    });

    it('should return false when code format is invalid', () => {
      const phone = '13800138000';
      generateCode(phone);
      expect(verifyCode(phone, '12345')).toBe(false); // 5 digits
      expect(verifyCode(phone, '1234567')).toBe(false); // 7 digits
      expect(verifyCode(phone, 'abcdef')).toBe(false); // non-numeric
    });

    it('should be case-sensitive for code comparison', () => {
      const phone = '13800138000';
      const code = generateCode(phone);
      // Since codes are numeric, this is more about exact match
      expect(verifyCode(phone, code)).toBe(true);
      expect(verifyCode(phone, code + ' ')).toBe(false);
      expect(verifyCode(phone, ' ' + code)).toBe(false);
    });

    it('should handle concurrent code generation', () => {
      const phone = '13800138000';
      const codes: string[] = [];

      // Generate multiple codes rapidly
      for (let i = 0; i < 10; i++) {
        codes.push(generateCode(phone));
      }

      // Only the last code should be valid
      const lastCode = codes[codes.length - 1];
      expect(verifyCode(phone, lastCode)).toBe(true);

      // All previous codes should be invalid
      for (let i = 0; i < codes.length - 1; i++) {
        expect(verifyCode(phone, codes[i])).toBe(false);
      }
    });
  });
});
