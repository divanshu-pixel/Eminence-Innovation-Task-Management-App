const formatMessage = (level, message, meta = {}) => {
  const log = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...meta
  };

  if (process.env.NODE_ENV === 'production') {
    return JSON.stringify(log);
  }

  const metaText = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `[${log.timestamp}] ${level.toUpperCase()}: ${message}${metaText}`;
};

export const logger = {
  info(message, meta) {
    console.info(formatMessage('info', message, meta));
  },

  warn(message, meta) {
    console.warn(formatMessage('warn', message, meta));
  },

  error(message, meta) {
    console.error(formatMessage('error', message, meta));
  }
};
