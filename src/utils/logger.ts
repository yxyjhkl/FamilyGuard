// src/utils/logger.ts
// 统一日志工具 — 在开发环境输出详细日志，生产环境可替换为远程上报

const IS_DEV = __DEV__;

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  module: string;
  message: string;
  data?: unknown;
  timestamp: string;
}

const MAX_HISTORY = 200;
const logHistory: LogEntry[] = [];

function createEntry(level: LogLevel, module: string, message: string, data?: unknown): LogEntry {
  return {
    level,
    module,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
}

function log(level: LogLevel, module: string, message: string, data?: unknown): void {
  const entry = createEntry(level, module, message, data);

  // 保留最近日志
  logHistory.push(entry);
  if (logHistory.length > MAX_HISTORY) {
    logHistory.shift();
  }

  // 开发环境输出到控制台
  if (IS_DEV) {
    const prefix = `[${module}]`;
    switch (level) {
      case 'debug':
        console.debug(prefix, message, data ?? '');
        break;
      case 'info':
        console.info(prefix, message, data ?? '');
        break;
      case 'warn':
        console.warn(prefix, message, data ?? '');
        break;
      case 'error':
        console.error(prefix, message, data ?? '');
        break;
    }
  }
  // 生产环境可在此添加远程日志上报逻辑
}

export const logger = {
  debug: (module: string, message: string, data?: unknown) =>
    log('debug', module, message, data),

  info: (module: string, message: string, data?: unknown) =>
    log('info', module, message, data),

  warn: (module: string, message: string, data?: unknown) =>
    log('warn', module, message, data),

  error: (module: string, message: string, data?: unknown) =>
    log('error', module, message, data),

  /** 获取最近的日志记录（用于调试面板） */
  getHistory: (): readonly LogEntry[] => logHistory,

  /** 清空日志历史 */
  clearHistory: (): void => {
    logHistory.length = 0;
  },
};

export default logger;
