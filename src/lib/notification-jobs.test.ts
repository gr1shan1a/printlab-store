import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ findMany: vi.fn(), updateMany: vi.fn(), notifyNewOrder: vi.fn(), notifyContact: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { notificationJob: { findMany: mocks.findMany, updateMany: mocks.updateMany } } }));
vi.mock("@/lib/telegram", () => ({ notifyNewOrder: mocks.notifyNewOrder, notifyContact: mocks.notifyContact }));
import { processNotificationJobs } from "./notification-jobs";
const job = { id: "job1", eventKey: "ORDER_CREATED:order1", kind: "ORDER_CREATED", entityId: "order1", attempts: 0 };
beforeEach(() => { vi.resetAllMocks(); mocks.findMany.mockResolvedValue([job]); mocks.updateMany.mockResolvedValue({ count: 1 }); });
describe("durable Telegram delivery", () => {
  it("retries a failed delivery and records success only after Telegram accepts it", async () => {
    mocks.notifyNewOrder.mockRejectedValueOnce(new Error("network unavailable")).mockResolvedValueOnce(undefined);
    await processNotificationJobs();
    const failed = mocks.updateMany.mock.calls.at(-1)![0].data;
    expect(failed.sentAt).toBeUndefined();
    expect(failed.nextAttemptAt.getTime()).toBeGreaterThan(Date.now());
    expect(failed.lockToken).toBeNull();
    await processNotificationJobs();
    expect(mocks.notifyNewOrder).toHaveBeenCalledTimes(2);
    expect(mocks.updateMany.mock.calls.at(-1)![0].data.sentAt).toBeInstanceOf(Date);
  });
  it("does not send when another worker already claimed the job", async () => {
    mocks.updateMany.mockResolvedValueOnce({ count: 0 });
    await processNotificationJobs();
    expect(mocks.notifyNewOrder).not.toHaveBeenCalled();
  });
  it("routes paid and contact events to their notifications", async () => {
    mocks.findMany.mockResolvedValue([{ ...job, kind: "ORDER_PAID" }, { ...job, id: "job2", kind: "CONTACT_CREATED", entityId: "request1" }]);
    await processNotificationJobs();
    expect(mocks.notifyNewOrder).toHaveBeenCalledWith("order1", "paid");
    expect(mocks.notifyContact).toHaveBeenCalledWith("request1");
  });
});
