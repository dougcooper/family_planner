import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'family-dashboard-secret-key-change-in-production';

interface JWTPayload {
  userId: string;
  familyId: string;
  role: string;
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Missing or invalid authorization header' });
    }
    
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    
    // Attach user info to request
    request.user = {
      userId: decoded.userId,
      familyId: decoded.familyId,
      role: decoded.role,
    };
  } catch (error) {
    return reply.status(401).send({ error: 'Invalid or expired token' });
  }
}

// Type augmentation for Fastify request
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      userId: string;
      familyId: string;
      role: string;
    };
  }
}
