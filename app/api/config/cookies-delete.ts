import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).end('Method Not Allowed');
  }
  const cookiesPath = path.resolve(process.cwd(), 'app', 'cookies.txt');
  try {
    if (fs.existsSync(cookiesPath)) {
      fs.unlinkSync(cookiesPath);
    }
    res.status(200).json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Falha ao excluir cookies.txt' });
  }
}
