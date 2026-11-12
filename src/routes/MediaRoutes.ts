import { Router } from 'express';
import { storageBucket } from '../utils/storage';

export const mediaRouter = Router();

async function sendMedia(objectPath: string, res: import('express').Response) {
  try {
    const file = storageBucket.file(objectPath);
    const [metadata] = await file.getMetadata();
    const contentType = metadata.contentType?.startsWith('image/')
      ? metadata.contentType
      : 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    file.createReadStream().on('error', () => res.destroy()).pipe(res);
  } catch {
    res.status(404).end();
  }
}

mediaRouter.get('/logo', (_req, res) => sendMedia('logotext.png', res));

mediaRouter.get('/item/:itemId/:fileName', (req, res) => {
  const { itemId, fileName } = req.params;
  if (!/^\d+$/.test(itemId) || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(fileName)) {
    return res.status(400).end();
  }
  return sendMedia(`merch/item/${itemId}/${fileName}`, res);
});
