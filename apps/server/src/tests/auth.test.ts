import { describe, it, expect } from 'vitest';
import { hashToken, generateToken } from '../utils/crypto';

describe('crypto utils', () => {
  it('hashes tokens consistently', () => {
    const token = 'test-token';
    expect(hashToken(token)).toBe(hashToken(token));
  });

  it('generates unique tokens', () => {
    expect(generateToken()).not.toBe(generateToken());
  });
});
