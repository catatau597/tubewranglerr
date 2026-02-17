import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(req: Request) {
  try {
    const data = await req.arrayBuffer();
    const buffer = Buffer.from(data);
    const cookiesDir = path.resolve(process.cwd(), 'app');
    const cookiesPath = path.join(cookiesDir, 'cookies.txt');
    await writeFile(cookiesPath, buffer);
    return NextResponse.json({ success: true, path: cookiesPath });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao salvar cookies.txt' }, { status: 500 });
  }
}
