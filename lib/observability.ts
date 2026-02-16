import prisma from '@/lib/db';
import { randomUUID } from 'crypto';

export type LogLevel = 'INFO' | 'WARN' | 'ERROR';

export interface LogContext {
  requestId?: string;
  [key: string]: unknown;
}

function serializeContext(context?: LogContext) {
  if (!context) return '';
  try {
    return ` ${JSON.stringify(context)}`;
  } catch {
    return ' {"context":"unserializable"}';
  }
}

export function getRequestId(req?: Request): string {
  const incoming = req?.headers.get('x-request-id');
  return incoming || randomUUID();
}

export async function logEvent(level: LogLevel, component: string, message: string, context?: LogContext) {
  const line = `[${level}] [${component}] ${message}${serializeContext(context)}`;

  if (level === 'ERROR') {
    console.error(line);
  } else if (level === 'WARN') {
    console.warn(line);
  } else {
    console.log(line);
  }

  try {
    await prisma.log.create({
      data: {
        level,
        component,
        message: `${message}${serializeContext(context)}`,
      },
    });
  } catch {
    // best-effort persistence
  }
}
