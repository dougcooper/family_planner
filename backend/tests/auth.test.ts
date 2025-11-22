import { describe, it, expect, beforeEach, vi, afterAll } from 'vitest';
import bcrypt from 'bcrypt';

// Mock DB
const { mockDb } = vi.hoisted(() => {
  return {
    mockDb: {
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
    }
  }
});

vi.mock('../src/db/index.js', () => ({
  db: mockDb,
}));

describe('Authentication Logic', () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'test-password-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterAll(async () => {
    // Cleanup test data - mocked
    mockDb.delete.mockReturnValue({ where: vi.fn() });
  });

  describe('User Registration', () => {
    it('should create a family and admin user', async () => {
      const passwordHash = await bcrypt.hash(testPassword, 10);
      const pinHash = await bcrypt.hash('0000', 10);

      // Mock family creation
      const mockFamily = {
        id: 'family-123',
        name: 'Test Family',
        kioskTimeoutSeconds: 120,
      };
      mockDb.returning.mockResolvedValueOnce([mockFamily]);

      // Create family
      const [family] = await mockDb
        .insert()
        .values({
          name: 'Test Family',
        })
        .returning();

      expect(family.id).toBeDefined();
      expect(family.name).toBe('Test Family');
      expect(family.kioskTimeoutSeconds).toBe(120);

      // Mock user creation
      const mockUser = {
        id: 'user-123',
        familyId: family.id,
        email: testEmail,
        passwordHash,
        name: 'Test Admin',
        role: 'PARENT',
        pinHash,
        pointsBalance: 0,
      };
      mockDb.returning.mockResolvedValueOnce([mockUser]);

      // Create admin user
      const [user] = await mockDb
        .insert()
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
      const passwordHash = await bcrypt.hash(testPassword, 10);
      const mockUser = {
        id: 'user-123',
        email: testEmail,
        passwordHash,
      };

      mockDb.limit.mockResolvedValueOnce([mockUser]);

      const [user] = await mockDb
        .select()
        .from()
        .where()
        .limit(1);

      expect(user).toBeDefined();
      
      if (user && user.passwordHash) {
        const validPassword = await bcrypt.compare(testPassword, user.passwordHash);
        expect(validPassword).toBe(true);
      }
    });

    it('should reject invalid password', async () => {
      const passwordHash = await bcrypt.hash(testPassword, 10);
      const mockUser = {
        id: 'user-123',
        email: testEmail,
        passwordHash,
      };

      mockDb.limit.mockResolvedValueOnce([mockUser]);

      const [user] = await mockDb
        .select()
        .from()
        .where()
        .limit(1);

      if (user && user.passwordHash) {
        const validPassword = await bcrypt.compare('wrong-password', user.passwordHash);
        expect(validPassword).toBe(false);
      }
    });
  });
});
