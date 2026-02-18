import { NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const file = searchParams.get('file') || 'cookies.txt';
    if (!file.endsWith('.txt')) {
      return NextResponse.json({ error: 'Arquivo inválido' }, { status: 400 });
    }
    const cookiesPath = path.resolve(process.cwd(), 'app', file);
    if (existsSync(cookiesPath)) {
      await unlink(cookiesPath);
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Falha ao excluir arquivo' }, { status: 500 });
  }
}
