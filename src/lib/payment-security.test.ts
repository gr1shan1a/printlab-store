import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ findFirst: vi.fn(), transaction: vi.fn() }));
vi.mock('./db', () => ({ db: { order: { findFirst: mocks.findFirst }, $transaction: mocks.transaction } }));
vi.mock('./email', () => ({ sendOrderStatus: vi.fn(), sendPaidOrderReceipt: vi.fn() }));
vi.mock('./notification-jobs', () => ({ enqueueNotification: vi.fn() }));
import { applyYooKassaPayment } from './payment-status';
import type { YooKassaPayment } from './yookassa';
const payment: YooKassaPayment = { id: 'payment-1', status: 'succeeded', paid: true, amount: { value: '524.00', currency: 'RUB' }, metadata: { orderId: 'order-1' } };
beforeEach(() => {
  vi.clearAllMocks();
  mocks.findFirst.mockResolvedValue({ id: 'order-1', status: 'NEW', totalInKopecks: 52400 });
  mocks.transaction.mockResolvedValue(false);
});
it.each([
  { ...payment, id: 'another-payment' },
  { ...payment, amount: { value: '1.00', currency: 'RUB' } },
  { ...payment, amount: { value: '524.00', currency: 'USD' } },
  { ...payment, metadata: { orderId: 'another-order' } },
  { ...payment, metadata: undefined },
])('rejects a mismatched confirmed payment before any write', async value => {
  await expect(applyYooKassaPayment('payment-1', value)).rejects.toThrow();
  expect(mocks.transaction).not.toHaveBeenCalled();
});
it('accepts a matching provider payment for processing', async () => {
  await applyYooKassaPayment('payment-1', payment);
  expect(mocks.transaction).toHaveBeenCalledOnce();
});
it('does not mark a pending payment paid', async () => {
  await applyYooKassaPayment('payment-1', { ...payment, status: 'pending', paid: false });
  expect(mocks.transaction).not.toHaveBeenCalled();
});
