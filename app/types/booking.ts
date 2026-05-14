export type Booking = {
  id: number;
  bookingCode: string;
  itemName: string;
  itemType: string;
  status: string;
  bookedDate: string | number;
  bookedFor: string | number;
  visitorCount: number;
  participantCount: number;
  clientName: string;
  clientEmail: string;
  clientPhoneNumber: string;
};
