import { prisma } from "@/lib/prisma";

import type { Prisma } from "@/generated/prisma/client";

export interface AuditEvent {
  userId?: string | null;
  action: string;
  resource: string;
  refId?: string | null;
  metadata?: Record<string, unknown>;
  request?: Request;
}

export async function writeAuditLog(event: AuditEvent) {
  const forwardedFor = event.request?.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() || null;
  const userAgent = event.request?.headers.get("user-agent") || null;

  return prisma.auditLog.create({
    data: {
      userId: event.userId ?? null,
      action: event.action,
      resource: event.resource,
      refId: event.refId ?? null,
      metadata: event.metadata as Prisma.InputJsonValue | undefined,
      ip,
      userAgent,
    },
  });
}
