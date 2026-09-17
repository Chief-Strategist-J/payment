import { getTracer, SpanStatusCode } from '@chief-strategist-j/shared-infra/tracing';
import type { PaymentsService } from '../../../features/payments/service/payments.service';
import { PAYMENT_ROUTE_RULES, type PaymentRouteContext, type PaymentRouteRule } from './payment.route.rules';
import { PaymentDomainError } from '../../../shared/errors/payment.errors';

export interface StandardApiResponse<T> {
  success: boolean;
  statusCode: number;
  data?: T;
  error?: { code: string; message: string };
  meta: {
    requestId: string;
    correlationId: string;
    timestamp: string;
    apiVersion: string;
  };
}

function buildMeta(headers?: Record<string, string>): StandardApiResponse<unknown>['meta'] {
  return {
    requestId: headers?.['x-request-id'] ?? `req-${Date.now()}`,
    correlationId: headers?.['x-correlation-id'] ?? `corr-${Date.now()}`,
    timestamp: new Date().toISOString(),
    apiVersion: 'v1',
  };
}

function compilePathPattern(pattern: string): { regex: RegExp; paramNames: string[] } {
  const paramNames: string[] = [];
  const regexStr = pattern.replace(/:([a-zA-Z0-9_]+)/g, (_, name) => {
    paramNames.push(name as string);
    return '([^/]+)';
  });
  return { regex: new RegExp(`^${regexStr}$`), paramNames };
}

interface CompiledRouteRule extends PaymentRouteRule {
  regex: RegExp;
  paramNames: string[];
}

/**
 * PaymentRestV1Router — data-driven REST router.
 * All routing logic reads PAYMENT_ROUTE_RULES — no hardcoded if/switch on paths.
 */
export class PaymentRestV1Router {
  private readonly tracer = getTracer('payment-service');
  private readonly compiledRules: CompiledRouteRule[];

  constructor(private readonly paymentsService: PaymentsService) {
    this.compiledRules = PAYMENT_ROUTE_RULES.map((rule) => {
      const { regex, paramNames } = compilePathPattern(rule.pattern);
      return { ...rule, regex, paramNames };
    });
  }

  private findMatchingRule(
    method: string,
    path: string,
  ): { rule: CompiledRouteRule; params: Record<string, string> } | null {
    for (const rule of this.compiledRules) {
      if (rule.method !== method) continue;
      const match = rule.regex.exec(path);
      if (match) {
        const params: Record<string, string> = {};
        rule.paramNames.forEach((name, index) => {
          params[name] = decodeURIComponent(match[index + 1]!);
        });
        return { rule, params };
      }
    }
    return null;
  }

  async route(
    method: string,
    path: string,
    body?: unknown,
    headers?: Record<string, string>,
    queryParams?: Record<string, string>,
  ): Promise<{ statusCode: number; payload: StandardApiResponse<unknown> }> {
    const span = this.tracer.startSpan(`REST ${method} ${path}`);
    try {
      const match = this.findMatchingRule(method, path);
      if (!match) {
        return {
          statusCode: 404,
          payload: {
            success: false,
            statusCode: 404,
            error: { code: 'ROUTE_NOT_FOUND', message: `No route matched: ${method} ${path}` },
            meta: buildMeta(headers),
          },
        };
      }

      const { rule, params } = match;
      const ctx: PaymentRouteContext = {
        paymentsService: this.paymentsService,
        body,
        headers,
        queryParams,
        params,
      };

      const data = await rule.handler(ctx);
      const statusCode = rule.successStatus ?? 200;

      span.setStatus({ code: SpanStatusCode.OK });
      return {
        statusCode,
        payload: {
          success: true,
          statusCode,
          data,
          meta: buildMeta(headers),
        },
      };
    } catch (err: unknown) {
      const isDomain = err instanceof PaymentDomainError;
      const statusCode = isDomain ? err.statusCode : 500;
      const code = isDomain ? err.code : 'INTERNAL_ERROR';
      const message = isDomain ? err.message : 'An unexpected error occurred';

      span.setStatus({ code: SpanStatusCode.ERROR, message });
      return {
        statusCode,
        payload: {
          success: false,
          statusCode,
          error: { code, message },
          meta: buildMeta(headers),
        },
      };
    } finally {
      span.end();
    }
  }
}
