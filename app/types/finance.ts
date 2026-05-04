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
};

export type PaymentSummary = {
  cashPayments: number;
  onlinePayments: number;
  refunded: number;
};
