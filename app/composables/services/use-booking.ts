import { useBookingStore } from "~/stores/booking";

export function findServiceItem(serviceId: number | undefined) {
  if (!serviceId)
    return undefined;

  const bookingStore = useBookingStore();

  return bookingStore.bookingItemOptions
    .flatMap((g: any) => g.items)
    .find((item: any) => item.id === serviceId);
}

export function findServiceGroup(serviceId: number | undefined) {
  if (!serviceId)
    return undefined;

  const bookingStore = useBookingStore();

  return bookingStore.bookingItemOptions.find((g: any) =>
    g.items?.some((item: any) => item.id === serviceId),
  );
}
