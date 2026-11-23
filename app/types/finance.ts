export type Payment = {
  id: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    avatar: string;
  };
  referenceCode: string;
  amount: number;
  paidAt: string;
  method: string;
  status: string;
  member?: { user?: { fullName?: string; email?: string; avatar?: string } };
  tiggInvoiceCode?: string | null;
  creditNoteCodes?: string | null;
  cancelledQuantity?: number;
  refundStatus?: string | null;
  pendingRefund?: number;
  refundDeduction?: number;
};

export type PaymentSummary = {
  cashPayments: number;
  onlinePayments: number;
  refunded: number;
  total: number;
  grossCollected: number;
  pendingRefunds: number;
  currency: string;
};
