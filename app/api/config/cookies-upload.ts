import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  // Salva cookies.txt no diretório /app
  const cookiesDir = path.resolve(process.cwd(), 'app');
  const cookiesPath = path.join(cookiesDir, 'cookies.txt');

  const chunks: Buffer[] = [];
  req.on('data', chunk => chunks.push(chunk));
  req.on('end', () => {
    const buffer = Buffer.concat(chunks);
    fs.writeFileSync(cookiesPath, buffer);
    res.status(200).json({ success: true, path: cookiesPath });
  });
}
