import { FastifyRequest, FastifyReply } from 'fastify';
import { pipeline } from 'stream';
import util from 'util';
import { createWriteStream } from 'fs';
import { unlink } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const pump = util.promisify(pipeline);
const __dirname = dirname(fileURLToPath(import.meta.url));
// Go up two levels from src/api to src, then to root, then to uploads
// src/api/upload.ts -> src/api -> src -> backend root -> uploads
const UPLOADS_DIR = join(__dirname, '..', '..', 'uploads');

export const uploadFile = async (req: FastifyRequest, reply: FastifyReply) => {
  const data = await req.file();
  
  if (!data) {
    return reply.status(400).send({ error: 'No file uploaded' });
  }

  const extension = data.filename.split('.').pop() || 'jpg';
  const filename = `${randomUUID()}.${extension}`;
  const filepath = join(UPLOADS_DIR, filename);

  await pump(data.file, createWriteStream(filepath));

  // Construct the URL
  // Assuming the server is running on the same host/port and serving static files from /uploads
  const protocol = req.protocol;
  const host = req.hostname;
  const url = `${protocol}://${host}/uploads/${filename}`;

  return { url };
};

export const deleteFile = async (req: FastifyRequest, reply: FastifyReply) => {
  const { url } = req.body as { url: string };
  
  if (!url) {
    return reply.status(400).send({ error: 'No url provided' });
  }

  try {
    // Extract filename from URL
    // URL format: http://host:port/uploads/filename.ext
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const filename = pathParts[pathParts.length - 1];

    if (!filename) {
      return reply.status(400).send({ error: 'Invalid url' });
    }

    // Basic security check to prevent directory traversal
    const safeFilename = filename.replace(/^.*[\\\/]/, '');
    const filepath = join(UPLOADS_DIR, safeFilename);

    await unlink(filepath);
    return { success: true };
  } catch (error) {
    req.log.error(error);
    // If file doesn't exist, we can consider it "deleted" or return 404.
    return { success: true, message: 'File deleted or not found' };
  }
};
