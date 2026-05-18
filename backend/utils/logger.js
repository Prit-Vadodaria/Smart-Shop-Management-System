const levels = {
  ERROR: '🔴 ERROR',
  WARN: '🟡 WARN',
  INFO: '🟢 INFO',
  DEBUG: '🔵 DEBUG',
};

const formatMessage = (level, message, meta) => {
  const timestamp = new Date().toISOString();
  const metaString = meta ? ` | Meta: ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] [${level}]: ${message}${metaString}`;
};

export const logger = {
  info: (message, meta) => {
    console.log(formatMessage(levels.INFO, message, meta));
  },
  warn: (message, meta) => {
    console.warn(formatMessage(levels.WARN, message, meta));
  },
  error: (message, error, meta) => {
    const errorDetails = error instanceof Error ? ` | Stack: ${error.stack}` : '';
    console.error(formatMessage(levels.ERROR, `${message}${errorDetails}`, meta));
  },
  debug: (message, meta) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(formatMessage(levels.DEBUG, message, meta));
    }
  },
};
