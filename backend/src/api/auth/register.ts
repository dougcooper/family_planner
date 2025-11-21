import { FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../../db/index.js';
import { families, users } from '../../db/schema.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'family-dashboard-secret-key-change-in-production';

interface RegisterBody {
  family_name: string;
  email: string;
  password: string;
  name: string;
}

export async function register(
  request: FastifyRequest<{ Body: RegisterBody }>,
  reply: FastifyReply
) {
  try {
    const { family_name, email, password, name } = request.body;

    // Validate input
    if (!family_name || !email || !password || !name) {
      return reply.status(400).send({ error: 'Missing required fields' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Generate default PIN hash (0000)
    const defaultPinHash = await bcrypt.hash('0000', 10);

    // Create family
    const [family] = await db
      .insert(families)
      .values({
        name: family_name,
      })
      .returning();

    // Create admin user
    const [user] = await db
      .insert(users)
      .values({
        familyId: family.id,
        email,
        passwordHash,
        name,
        role: 'PARENT',
        pinHash: defaultPinHash,
      })
      .returning();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, familyId: family.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '90d' }
    );

    return reply.status(201).send({
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Registration failed' });
  }
}
