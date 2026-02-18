import { NextResponse } from 'next/server';
import { readdir } from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const cookiesDir = path.resolve(process.cwd(), 'app', 'cookies');
    const files = await readdir(cookiesDir);
    const txtFiles = files.filter(f => f.endsWith('.txt'));
    return NextResponse.json({ files: txtFiles });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao listar arquivos' }, { status: 500 });
  }
}
