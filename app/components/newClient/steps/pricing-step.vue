<script setup lang="ts">
import { computed, ref } from "vue";

import { useBookingStore } from "~/stores/booking";

import { ICONS } from "../../../config/icons";

const form = defineModel<any>({ required: true });
const bookingStore = useBookingStore();

const promoLoading = ref(false);
const appliedPromo = ref<any>(null);

const paymentMethods = [
  { value: "cash", label: "Cash", description: "Paid at counter", icon: ICONS.MONEY },
  { value: "online", label: "Online Transfer", description: "Fonepay / Esewa", icon: ICONS.WIFI },
];

function findServiceItem(serviceId: number | undefined) {
  if (!serviceId)
    return undefined;
  return bookingStore.bookingItemOptions
    .flatMap((g: any) => g.items)
    .find((item: any) =>
      item.id === serviceId,
    );
}

function findServiceGroup(serviceId: number | undefined) {
  if (!serviceId)
    return undefined;
  return bookingStore.bookingItemOptions.find((g: any) =>
    g.items?.some((item: any) =>
      item.id === serviceId,
    ),
  );
}

function getServiceName(serviceId: number | undefined): string {
  return findServiceItem(serviceId)?.name ?? "Service";
}

function getServicePrice(serviceId: number | undefined): number {
  const item = findServiceItem(serviceId);
  if (!item)
    return 0;

  const group = findServiceGroup(serviceId);
  const isSpa = group?.type?.toLowerCase() === "spa";

  if (isSpa) {
    const rawDurations = item?.duration;
    const durations: any[] = Array.isArray(rawDurations) ? rawDurations : [];

    const selected = durations.find((d: any) => d?.id === form.value.durationId);

    const selectedPrice = Number(selected?.amount);
    if (!Number.isNaN(selectedPrice))
      return selectedPrice;
  }

  const itemPrice = Number(item?.amount);
  return Number.isNaN(itemPrice) ? 0 : itemPrice;
}

function getPromoDiscount(): number {
  if (!appliedPromo.value?.isValid)
    return 0;

  const servicePrice = getServicePrice(form.value.serviceId);
  const { type, amount } = appliedPromo.value;

  if (type === "fixed")
    return Math.min(amount, servicePrice);

  if (type === "percent")
    return Math.round(servicePrice * (amount / 100));

  return 0;
}

const totalPrice = computed(() => {
  const servicePrice = getServicePrice(form.value.serviceId);
  const discount = getPromoDiscount();
  return Math.max(0, servicePrice - discount);
});

async function applyPromoCode(): Promise<void> {
  if (!form.value.promoCode?.trim())
    return;

  try {
    promoLoading.value = true;
    const data = await bookingStore.validatePromoCode(form.value.promoCode);

    if (data?.isValid) {
      appliedPromo.value = {
        code: data.code,
        type: data.type,
        amount: data.amount,
        isValid: true,
      };
    }
    else {
      appliedPromo.value = null;
    }
  }
  catch (error) {
    console.warn("Promo code validation failed:", error);
    appliedPromo.value = null;
  }
  finally {
    promoLoading.value = false;
  }
}

function removePromo() {
  appliedPromo.value = null;
}

defineExpose({
  appliedPromo,
  totalPrice,
  getServiceName,
  getServicePrice,
  getPromoDiscount,
});
</script>

<template>
  <section class="space-y-6">
    <div class="rounded-xl border border-border bg-muted/20 p-5 sm:p-6 shadow-sm space-y-6">
      <div class="grid grid-cols-1 gap-4">
        <!-- Summary -->
        <div class="bg-stone-50 rounded-lg p-6 border border-stone-100">
          <h3 class="text-sm font-semibold mb-4">
            Overview
          </h3>
          <div class="flex flex-col gap-3">
            <div class="flex justify-between text-sm text-stone-600">
              <span>{{ getServiceName(form.serviceId) }}</span>
              <span class="font-medium text-stone-900">Rs. {{ getServicePrice(form.serviceId) }}</span>
            </div>
            <div class="flex justify-between text-sm text-stone-600">
              <span>Promo Discount</span>
              <span class="font-medium text-stone-900">{{ appliedPromo?.isValid ? `-Rs. ${getPromoDiscount()}` : "0" }}</span>
            </div>
            <div class="flex justify-between text-sm text-stone-600">
              <span>Membership Discount</span>
              <span class="font-medium text-stone-900">N/A</span>
            </div>
            <div class="border-t border-stone-200 pt-3 flex justify-between font-bold text-stone-900">
              <span>Total</span>
              <span>Rs. {{ totalPrice }}</span>
            </div>
          </div>
        </div>

        <!-- Promo code -->
        <div class="flex gap-2 items-end">
          <base-input
            v-model="form.promoCode"
            name="promoCode"
            label="Promo Code"
            placeholder="e.g PROMO20"
            class="flex-1"
            @update:model-value="removePromo"
          />
          <base-button
            variant="outline"
            :loading="promoLoading"
            @click="applyPromoCode"
          >
            Apply
          </base-button>
        </div>

        <!-- Payment method -->
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-stone-700">Payment Method</label>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              v-for="method in paymentMethods"
              :key="method.value"
              class="border rounded-lg p-3 cursor-pointer flex items-center gap-3 transition-all"
              :class="
                form.paymentMethod === method.value
                  ? 'border-stone-200 bg-[#F9F6F2]'
                  : 'border-stone-200 hover:border-stone-300'
              "
              @click="form.paymentMethod = method.value"
            >
              <div class="bg-primary-700 p-2 rounded-full flex items-center justify-center">
                <UIcon :name="method.icon" class="w-5 h-5 text-white" />
              </div>
              <div class="flex flex-col">
                <span class="text-sm font-semibold">{{ method.label }}</span>
                <span class="text-xs text-stone-500">{{ method.description }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
