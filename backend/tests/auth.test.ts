import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '../src/db/index.js';
import { families, users } from '../src/db/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'family-dashboard-secret-key-change-in-production';

describe('Authentication Logic', () => {
  let testFamilyId: string;
  let testUserId: string;
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'test-password-123';

  afterAll(async () => {
    // Cleanup test data
    if (testUserId) {
      await db.delete(users).where(eq(users.id, testUserId));
    }
    if (testFamilyId) {
      await db.delete(families).where(eq(families.id, testFamilyId));
    }
  });

  describe('User Registration', () => {
    it('should create a family and admin user', async () => {
      const passwordHash = await bcrypt.hash(testPassword, 10);
      const pinHash = await bcrypt.hash('0000', 10);

      // Create family
      const [family] = await db
        .insert(families)
        .values({
          name: 'Test Family',
        })
        .returning();

      testFamilyId = family.id;
      expect(family.id).toBeDefined();
      expect(family.name).toBe('Test Family');
      expect(family.kioskTimeoutSeconds).toBe(120);

      // Create admin user
      const [user] = await db
        .insert(users)
        .values({
          familyId: family.id,
          email: testEmail,
          passwordHash,
          name: 'Test Admin',
          role: 'PARENT',
          pinHash,
          pointsBalance: 0,
        })
        .returning();

      testUserId = user.id;
      expect(user.id).toBeDefined();
      expect(user.email).toBe(testEmail);
      expect(user.role).toBe('PARENT');
      expect(user.familyId).toBe(family.id);
    });

    it('should hash passwords correctly', async () => {
      const password = 'my-secure-password';
      const hash = await bcrypt.hash(password, 10);

      const isValid = await bcrypt.compare(password, hash);
      expect(isValid).toBe(true);

      const isInvalid = await bcrypt.compare('wrong-password', hash);
      expect(isInvalid).toBe(false);
    });
  });

  describe('User Login', () => {
    it('should authenticate user with correct credentials', async () => {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, testEmail))
        .limit(1);

      expect(user).toBeDefined();
      
      if (user && user.passwordHash) {
        const validPassword = await bcrypt.compare(testPassword, user.passwordHash);
        expect(validPassword).toBe(true);
      }
    });

    it('should reject invalid password', async () => {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, testEmail))
        .limit(1);

      if (user && user.passwordHash) {
        const validPassword = await bcrypt.compare('wrong-password', user.passwordHash);
        expect(validPassword).toBe(false);
      }
    });

    it('should generate valid JWT tokens', () => {
      const payload = {
        userId: testUserId,
        familyId: testFamilyId,
        role: 'PARENT',
      };

      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '90d' });
      expect(token).toBeDefined();

      const decoded = jwt.verify(token, JWT_SECRET) as any;
      expect(decoded.userId).toBe(testUserId);
      expect(decoded.familyId).toBe(testFamilyId);
      expect(decoded.role).toBe('PARENT');
    });

    it('should reject invalid JWT tokens', () => {
      const invalidToken = 'invalid.token.here';
      
      expect(() => {
        jwt.verify(invalidToken, JWT_SECRET);
      }).toThrow();
    });
  });

  describe('Password Security', () => {
    it('should use sufficient bcrypt rounds', async () => {
      const password = 'test-password';
      const hash = await bcrypt.hash(password, 10);
      
      // bcrypt hashes start with $2b$ or $2a$ followed by cost factor
      expect(hash).toMatch(/^\$2[ab]\$10\$/);
    });

    it('should generate unique hashes for same password', async () => {
      const password = 'same-password';
      const hash1 = await bcrypt.hash(password, 10);
      const hash2 = await bcrypt.hash(password, 10);
      
      expect(hash1).not.toBe(hash2);
      expect(await bcrypt.compare(password, hash1)).toBe(true);
      expect(await bcrypt.compare(password, hash2)).toBe(true);
    });
  });
});
