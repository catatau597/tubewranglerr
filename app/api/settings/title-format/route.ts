import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { TitleComponent } from '@/app/(dashboard)/settings/title-format/page';
import { CONFIG_METADATA } from '@/lib/config-metadata';

// Estrutura esperada para a configuração
interface TitleFormatConfig {
  components: TitleComponent[];
  useBrackets: boolean;
}

const CONFIG_KEY = 'TITLE_FORMAT_CONFIG';

// GET: Retorna a configuração de formato de título
export async function GET() {
  try {
    const config = await prisma.config.findUnique({
      where: { key: CONFIG_KEY },
    });

    if (config) {
      return NextResponse.json(JSON.parse(config.value));
    } else {
      // Retorna um valor padrão se não houver nada no banco
      const defaultConfig: TitleFormatConfig = {
        components: [
          { id: 'status', label: '[STATUS]', enabled: true },
          { id: 'channelName', label: '[NOME DO CANAL]', enabled: true },
          { id: 'eventName', label: '[NOME DO EVENTO]', enabled: true },
          { id: 'dateTime', label: '[DATA E HORA]', enabled: false },
          { id: 'youtubePlaylist', label: '[PLAYLIST DO YOUTUBE]', enabled: false },
        ],
        useBrackets: true,
      };
      return NextResponse.json(defaultConfig);
    }
  } catch (error) {
    console.error('Erro ao buscar configuração de formato de título:', error);
    return NextResponse.json({ error: 'Erro ao buscar configuração.' }, { status: 500 });
  }
}

// POST: Salva a configuração de formato de título
export async function POST(req: Request) {
  try {
    const body: TitleFormatConfig = await req.json();

    // Validação básica
    if (!body.components || typeof body.useBrackets !== 'boolean') {
      return NextResponse.json({ error: 'Dados de configuração inválidos.' }, { status: 400 });
    }
    
    const value = JSON.stringify(body);
    const metadata = CONFIG_METADATA[CONFIG_KEY];

    // Usando upsert para criar ou atualizar a configuração
    await prisma.config.upsert({
      where: { key: CONFIG_KEY },
      update: { value },
      create: { 
        key: CONFIG_KEY, 
        value: value,
        type: metadata.type,
        category: metadata.category,
        description: metadata.description,
      },
    });

    return NextResponse.json({ message: 'Configuração salva com sucesso.' });
  } catch (error) {
    console.error('Erro ao salvar configuração de formato de título:', error);
    return NextResponse.json({ error: 'Erro ao salvar configuração.' }, { status: 500 });
  }
}
