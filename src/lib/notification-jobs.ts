import type { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { notifyNewOrder, notifyContact } from "@/lib/telegram";
import { sendOrderStatus } from "@/lib/email";
import { guestOrderToken } from "@/lib/guest-order";

export type NotificationKind = "ORDER_CREATED" | "ORDER_PAID" | "ORDER_EMAIL_CREATED" | "CONTACT_CREATED";

export async function enqueueNotification(tx: Prisma.TransactionClient, kind: NotificationKind, entityId: string) {
  const eventKey = `${kind}:${entityId}`;
  await tx.notificationJob.upsert({
    where: { eventKey },
    create: { eventKey, kind, entityId },
    update: {},
  });
}

/** One leased job per event; failures remain in the database across restarts. */
export async function processNotificationJobs() {
  const now = new Date();
  const jobs = await db.notificationJob.findMany({
    where: { sentAt: null, nextAttemptAt: { lte: now }, OR: [{ lockedUntil: null }, { lockedUntil: { lte: now } }] },
    orderBy: { createdAt: "asc" }, take: 5,
  });
  for (const job of jobs) {
    const lockToken = randomUUID();
    const claimed = await db.notificationJob.updateMany({
      where: { id: job.id, sentAt: null, OR: [{ lockedUntil: null }, { lockedUntil: { lte: now } }] },
      data: { lockedUntil: new Date(Date.now() + 120_000), lockToken, attempts: { increment: 1 } },
    });
    if (!claimed.count) continue;
    try {
      if (job.kind === "CONTACT_CREATED") await notifyContact(job.entityId);
      else if (job.kind === "ORDER_EMAIL_CREATED") {
        const order = await db.order.findUnique({ where: { id: job.entityId }, select: { id: true, userId: true, email: true, firstName: true, customerName: true, number: true, status: true } });
        if (!order) throw new Error("Order missing for email notification");
        const baseUrl = process.env.NEXT_PUBLIC_STORE_URL;
        const access = order.userId ? "" : `?access=${guestOrderToken(order.id)}`;
        const link = baseUrl ? `${baseUrl}/order/${order.id}${access}` : undefined;
        const sent = await sendOrderStatus(order.email, order.customerName || order.firstName, order.number, order.status, link);
        if (!sent) throw new Error("SMTP is not configured for order emails");
      }
      else if (job.kind === "ORDER_CREATED" || job.kind === "ORDER_PAID")
        await notifyNewOrder(job.entityId, job.kind === "ORDER_PAID" ? "paid" : "created");
      else throw new Error("Unknown notification kind");
      await db.notificationJob.updateMany({ where: { id: job.id, lockToken }, data: { sentAt: new Date(), lockedUntil: null, lockToken: null, lastError: null } });
    } catch (error) {
      // Never persist fetch errors containing a Telegram token URL.
      const message = error instanceof Error && error.message.startsWith("Telegram ") ? error.message.slice(0,300) : "Notification delivery failed";
      await db.notificationJob.updateMany({
        where: { id: job.id, lockToken },
        data: { lockedUntil: null, lockToken: null, lastError: message, nextAttemptAt: new Date(Date.now() + Math.min(3600, 15 * 2 ** Math.min(job.attempts, 8)) * 1000) },
      });
      console.error("Notification retry scheduled", { event: job.eventKey, error: message });
    }
  }
}

const worker = globalThis as typeof globalThis & { notificationTimer?: ReturnType<typeof setInterval>; notificationBusy?: boolean };
export function startNotificationWorker() {
  if (worker.notificationTimer) return;
  const tick = async () => {
    if (worker.notificationBusy) return;
    worker.notificationBusy = true;
    try { await processNotificationJobs(); }
    catch { console.error("Notification worker unavailable; will retry"); }
    finally { worker.notificationBusy = false; }
  };
  worker.notificationTimer = setInterval(tick, 15_000);
  worker.notificationTimer.unref();
  void tick();
}
