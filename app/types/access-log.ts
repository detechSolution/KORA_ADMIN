export type AccessLog = {
  id: number;
  clientName: string;
  phoneNumber?: string | null;
  type: "member" | "non_member";
  gate: string;
  doorNumber: number;
  entryMethod: string;
  eventName: string;
  direction: string;
  cardNumber: string | null;
  entryDateTime: string;
  createdAt: string;
};
