import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  const cookiesDir = path.resolve(process.cwd(), 'app', 'cookies');
  if (!fs.existsSync(cookiesDir)) fs.mkdirSync(cookiesDir, { recursive: true });

  const contentType = req.headers['content-type'] || '';
  if (!contentType.startsWith('multipart/form-data')) {
    // Upload simples: salva como cookies.txt
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      const buffer = Buffer.concat(chunks);
      const cookiesPath = path.join(cookiesDir, 'cookies.txt');
      fs.writeFileSync(cookiesPath, buffer);
      res.status(200).json({ success: true, path: cookiesPath });
    });
    return;
  }

  // Upload multipart: aceita múltiplos arquivos .txt
  const boundary = contentType.split('boundary=')[1];
  if (!boundary) return res.status(400).json({ error: 'Boundary não encontrado' });
  const chunks = [];
  req.on('data', chunk => chunks.push(chunk));
  req.on('end', () => {
    const body = Buffer.concat(chunks).toString();
    const parts = body.split(`--${boundary}`);
    let saved = [];
    for (const part of parts) {
      if (part.includes('Content-Disposition')) {
        const match = part.match(/filename="([^"]+)"/);
        if (match) {
          const filename = match[1];
          if (!filename.endsWith('.txt')) continue;
          const fileContent = part.split('\r\n\r\n')[1]?.replace(/\r\n--$/, '');
          if (fileContent) {
            const filePath = path.join(cookiesDir, filename);
            fs.writeFileSync(filePath, fileContent, 'utf8');
            saved.push(filename);
          }
        }
      }
    }
    res.status(200).json({ success: true, files: saved });
  });
}
