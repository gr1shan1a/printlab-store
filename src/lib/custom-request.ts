import { CustomRequestStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { sendCustomStatus } from "@/lib/email";
const allowed: Record<CustomRequestStatus, CustomRequestStatus[]> = {
  NEW: ["REVIEWING", "DEFERRED", "DECLINED"],
  REVIEWING: ["ACCEPTED", "DEFERRED", "DECLINED"],
  DEFERRED: ["REVIEWING", "DECLINED"],
  ACCEPTED: ["IN_PRODUCTION", "DECLINED"],
  IN_PRODUCTION: ["READY"],
  READY: ["COMPLETED"],
  COMPLETED: [],
  DECLINED: [],
};
export async function changeCustomRequestStatus(
  id: string,
  status: CustomRequestStatus,
  promisedDays?: number,
  actorId?: string,
) {
  const before = await db.contactMessage.findUnique({ where: { id } });
  if (!before) throw new Error("Заявка не найдена");
  if (!allowed[before.workflowStatus].includes(status))
    throw new Error(`Переход ${before.workflowStatus} → ${status} запрещён`);
  if (
    status === "ACCEPTED" &&
    (!promisedDays || promisedDays < 1 || promisedDays > 60)
  )
    throw new Error("Выберите срок от 1 до 60 дней");
  const now = new Date(),
    updated = await db.$transaction(async (tx) => {
      const changed = await tx.contactMessage.updateMany({
        where: { id, workflowStatus: before.workflowStatus },
        data: {
          workflowStatus: status,
          promisedDays: status === "ACCEPTED" ? promisedDays : undefined,
          acceptedAt: status === "ACCEPTED" ? now : undefined,
          startedAt: status === "IN_PRODUCTION" ? now : undefined,
          readyAt: status === "READY" ? now : undefined,
          completedAt: status === "COMPLETED" ? now : undefined,
          deferredAt: status === "DEFERRED" ? now : undefined,
        },
      });
      if (changed.count !== 1)
        throw new Error("Заявка уже была изменена. Обновите список.");
      const shouldQueuePrint =
        (before.mode === "READY_MODEL" && status === "ACCEPTED") ||
        (before.mode !== "READY_MODEL" && status === "IN_PRODUCTION");
      if (shouldQueuePrint)
        await tx.productionTask.upsert({
          where: { customRequestId: id },
          update: { quantity: before.quantity || 1 },
          create: {
            customRequestId: id,
            quantity: before.quantity || 1,
            status: "QUEUED",
            notes:
              before.mode === "READY_MODEL"
                ? "Печать по готовой модели"
                : "Кастомная модель согласована",
          },
        });
      const row = await tx.contactMessage.findUniqueOrThrow({ where: { id } });
      await tx.auditLog.create({
        data: {
          actorId,
          action: "CHANGE_CUSTOM_REQUEST_STATUS",
          entityType: "ContactMessage",
          entityId: id,
          before: { status: before.workflowStatus },
          after: { status, promisedDays },
        },
      });
      return row;
    });
  let emailSent = false;
  if (updated.email)
    try {
      emailSent = await sendCustomStatus(
        updated.email,
        updated.name,
        status,
        updated.promisedDays,
      );
    } catch (error) {
      console.error("Custom status email failed", error);
    }
  return { request: updated, emailSent };
}
export function isCustomStatus(value: string): value is CustomRequestStatus {
  return Object.values(CustomRequestStatus).includes(
    value as CustomRequestStatus,
  );
}
export const customStatusLabel: Record<CustomRequestStatus, string> = {
  NEW: "🆕 Новая",
  REVIEWING: "👀 На рассмотрении",
  DEFERRED: "⏰ Отложена",
  ACCEPTED: "✅ Принята",
  IN_PRODUCTION: "🖨 В печати",
  READY: "📦 Готова",
  COMPLETED: "🏁 Завершена",
  DECLINED: "❌ Отклонена",
};
