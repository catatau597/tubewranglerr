import prisma from '@/lib/db';
import { randomUUID } from 'crypto';
import { getConfig } from '@/lib/config';

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

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
  const globalLevel = (await getConfig('LOG_LEVEL', 'INFO')) as LogLevel;
  const smartPlayerLevel = (await getConfig('SMART_PLAYER_LOG_LEVEL', 'INFO')) as LogLevel;

  const currentLevel = component === 'SmartPlayer' ? smartPlayerLevel : globalLevel;
  
  // FORCE DEBUG LOGS TO CONSOLE ALWAYS FOR DIAGNOSTICS
  const line = `[${level}] [${component}] ${message}${serializeContext(context)}`;
  
  // Check if we should log to console based on level OR if it is DEBUG (force)
  if (level === 'DEBUG' || LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[currentLevel]) {
      if (level === 'ERROR') {
        console.error(line);
      } else if (level === 'WARN') {
        console.warn(line);
      } else {
        console.log(line);
      }
  }

  // Only persist to DB if it meets the configured level to avoid flooding DB
  if (LOG_LEVEL_PRIORITY[level] < LOG_LEVEL_PRIORITY[currentLevel]) {
    return;
  }

  const logToFile = await getConfig('LOG_TO_FILE', 'true');
  if (logToFile === 'true') {
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
}
