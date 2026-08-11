export type AccessLog = {
  id: number;
  client: { name: string; phone: string; initials: string };
  type: "member" | "non_member";
  gate: string;
  doorNumber: number;
  entryMethod: string;
  eventName: string;
  direction: string;
  cardNumber: string | null;
  entryDate: string;
  entryTime: string;
  createdAt: string;
};

export type AccessLogApiRecord = {
  id: number;
  clientName: string;
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
