import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.startsWith('multipart/form-data')) {
      // Upload simples: salva como cookies.txt
      const data = await req.arrayBuffer();
      const buffer = Buffer.from(data);
      const cookiesDir = path.resolve(process.cwd(), 'app');
      const cookiesPath = path.join(cookiesDir, 'cookies.txt');
      await writeFile(cookiesPath, buffer);
      return NextResponse.json({ success: true, path: cookiesPath });
    }

    // Upload multipart: aceita múltiplos arquivos .txt
    const boundary = contentType.split('boundary=')[1];
    if (!boundary) throw new Error('Boundary não encontrado');
    const body = Buffer.from(await req.arrayBuffer());
    const parts = body.toString().split(`--${boundary}`);
    const cookiesDir = path.resolve(process.cwd(), 'app');
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
            await writeFile(filePath, fileContent, 'utf8');
            saved.push(filename);
          }
        }
      }
    }
    return NextResponse.json({ success: true, files: saved });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao salvar cookies' }, { status: 500 });
  }
}
