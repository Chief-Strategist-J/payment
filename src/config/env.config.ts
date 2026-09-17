import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../.env');

if (typeof process.loadEnvFile === 'function') {
  try {
    if (fs.existsSync(envPath)) {
      process.loadEnvFile(envPath);
    } else {
      process.loadEnvFile();
    }
  } catch {}
}

function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (value === undefined || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${key} does not exist`);
  }
  return value;
}

/**
 * PAYMENT_CONFIG — the single, frozen config object for the payment service.
 * All env access in the entire package goes through this object.
 * Raw process.env calls anywhere outside this file are a spec violation.
 */
export const PAYMENT_CONFIG = Object.freeze({
  db: {
    host: getRequiredEnv('PAYMENT_DB_HOST'),
    port: parseInt(getRequiredEnv('PAYMENT_DB_PORT'), 10),
    user: getRequiredEnv('PAYMENT_DB_USER'),
    password: getRequiredEnv('PAYMENT_DB_PASSWORD'),
    name: getRequiredEnv('PAYMENT_DB_NAME'),
    url: getRequiredEnv('DATABASE_URL'),
  },
  kafka: {
    brokers: getRequiredEnv('KAFKA_BROKERS'),
    clientId: getRequiredEnv('KAFKA_CLIENT_ID'),
    securityProtocol: getRequiredEnv('KAFKA_SECURITY_PROTOCOL'),
  },
  auth: {
    serviceUrl: getRequiredEnv('AUTH_SERVICE_URL'),
  },
  otel: {
    endpoint: getRequiredEnv('OTEL_EXPORTER_OTLP_ENDPOINT'),
    grpcEndpoint: getRequiredEnv('OTEL_EXPORTER_OTLP_GRPC_ENDPOINT'),
    serviceName: getRequiredEnv('OTEL_SERVICE_NAME'),
    insecure: getRequiredEnv('OTEL_EXPORTER_OTLP_INSECURE') === 'true',
  },
  serviceRegistry: {
    url: getRequiredEnv('SERVICE_REGISTRY_URL'),
  },
  server: {
    port: parseInt(process.env['PORT'] ?? '3002', 10),
    host: process.env['HOST'] ?? 'localhost',
    protocol: process.env['PROTOCOL'] ?? 'http',
  },
});

export const paymentEnv = PAYMENT_CONFIG;
export default PAYMENT_CONFIG;
