import { logger, consoleTransport } from "react-native-logs";

const config = {
  levels: {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  },
  transport: consoleTransport,
  transportOptions: {
    colors: {
      info: "blueBright",
      warn: "yellowBright",
      error: "redBright",
    } as const,
  },
};

const log = logger.createLogger(config);

export default log;
