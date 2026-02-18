import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || '';
    console.log('[cookies-upload] content-type:', contentType);
    if (!contentType.startsWith('multipart/form-data')) {
      // Upload simples: salva como cookies.txt
      const data = await req.arrayBuffer();
      const buffer = Buffer.from(data);
      const cookiesDir = path.resolve(process.cwd(), 'app');
      const cookiesPath = path.join(cookiesDir, 'cookies.txt');
      await writeFile(cookiesPath, buffer);
      console.log('[cookies-upload] Upload simples salvo em', cookiesPath);
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
            console.log('[cookies-upload] Multipart: arquivo salvo', filePath);
          } else {
            console.log('[cookies-upload] Multipart: arquivo', filename, 'sem conteúdo');
          }
        } else {
          console.log('[cookies-upload] Multipart: sem filename em part');
        }
      }
    }
    console.log('[cookies-upload] Arquivos salvos:', saved);
    return NextResponse.json({ success: true, files: saved });
  } catch (error) {
    console.error('[cookies-upload] Erro:', error);
    return NextResponse.json({ error: 'Erro ao salvar cookies', details: String(error) }, { status: 500 });
  }
}
