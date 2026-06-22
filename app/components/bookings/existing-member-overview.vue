<script setup lang="ts">
import { computed, ref } from "vue";

import { findServiceGroup, findServiceItem } from "~/composables/services/use-booking";
import { useNotification } from "~/composables/use-notification";
import { ICONS } from "~/config/icons";
import { useBookingStore } from "~/stores/booking";
import { useMembershipStore } from "~/stores/membership";
import { getApiErrorMessage } from "~/utils/error";

const form = defineModel<any>({ required: true });

const bookingStore = useBookingStore();
const membershipStore = useMembershipStore();
const { error: showError, success } = useNotification();

const promoLoading = ref(false);
const appliedPromo = ref<{ code: string; type: string; amount: number; isValid: boolean } | null>(null);

const paymentMethods = [
  { value: "cash", label: "Cash", description: "Paid at counter", icon: ICONS.MONEY },
  { value: "online", label: "Online Transfer", description: "Fonepay / bank / card transfer", icon: ICONS.WIFI },
];

function getServicePrice(svc: any): number {
  if (svc.resolvedPrice != null)
    return Number(svc.resolvedPrice) || 0;

  const item = findServiceItem(svc.serviceId);
  if (!item)
    return 0;

  const group = findServiceGroup(svc.serviceId);
  const isSpa = (svc.serviceType || group?.type || "").toLowerCase() === "spa";

  if (isSpa) {
    const durations: any[] = Array.isArray(item.duration) ? item.duration : [];
    const selected = durations.find((d: any) => d?.id === svc.durationId);
    const price = Number(selected?.amount ?? selected?.price);
    if (!Number.isNaN(price))
      return price;
  }

  const price = Number(item.amount ?? item.price);
  return Number.isNaN(price) ? 0 : price;
}

function getServiceName(svc: any): string {
  return svc.resolvedItemName ?? findServiceItem(svc.serviceId)?.name ?? "Service";
}

function getServiceType(svc: any): string {
  return (svc.resolvedItemType ?? svc.serviceType ?? findServiceGroup(svc.serviceId)?.type ?? "").toString();
}

const SERVICE_TYPE_TO_BENEFIT: Record<string, string> = {
  spa: "spa",
  session: "class",
  class: "class",
  event: "event",
  workshop: "workshop",
};

function getBenefitPercent(benefits: Record<string, unknown> | undefined, serviceType: string): number {
  if (!benefits)
    return 0;

  const key = SERVICE_TYPE_TO_BENEFIT[(serviceType || "").toLowerCase()] ?? serviceType;
  const percent = Number(benefits[key]);
  return Number.isNaN(percent) ? 0 : percent;
}

function getDurationLabel(svc: any): string {
  if (svc.resolvedDurationLabel)
    return svc.resolvedDurationLabel;

  const item = findServiceItem(svc.serviceId);
  const durations: any[] = Array.isArray(item?.duration) ? item.duration : [];
  const selected = durations.find((d: any) => d?.id === svc.durationId);
  return selected ? `${selected.duration} ${selected.timeUnit}` : "";
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr)
    return "";
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime()))
    return dateStr;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatTime(timeStr: string | undefined): string {
  if (!timeStr)
    return "";
  const [h = "0", m = "0"] = timeStr.split(":");
  const hour = Number(h);
  const minute = Number(m);
  if (Number.isNaN(hour) || Number.isNaN(minute))
    return timeStr;
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${String(minute).padStart(2, "0")} ${period}`;
}

const selectedMember = computed(() =>
  (membershipStore.membershipOptions as any[]).find(
    (m: any) => m.memberId === form.value.selectedMemberId,
  ),
);

/** Discount percent for the selected member on a service type. */
function getMemberBenefitPercent(serviceType: string): number {
  return getBenefitPercent(selectedMember.value?.membershipBenefits, serviceType);
}

/** Discount percent for the selected member's guests/visitors on a service type. */
function getGuestBenefitPercent(serviceType: string): number {
  return getBenefitPercent(selectedMember.value?.guestBenefits, serviceType);
}
const memberName = computed(() => selectedMember.value?.fullName ?? "Member");

type OverviewRow = {
  client: string;
  tag: "Member" | "Visitor";
  service: string;
  serviceType: string;
  durationLabel: string;
  date: string;
  time: string;
  price: number;
  benefitPercent: number;
  benefitAmount: number;
};

const overviewColumns = [
  { accessorKey: "client", header: "Client" },
  { accessorKey: "service", header: "Service" },
  { accessorKey: "schedule", header: "Schedule" },
  { accessorKey: "benefitPercent", header: "Discount" },
  { accessorKey: "price", header: "Price" },
];

function rowData(row: { original: Record<string, unknown> }): OverviewRow {
  return row.original as OverviewRow;
}

function buildRow(svc: any, client: string, tag: "Member" | "Visitor", benefitPercent: number): OverviewRow {
  const price = getServicePrice(svc);
  return {
    client,
    tag,
    service: getServiceName(svc),
    serviceType: getServiceType(svc),
    durationLabel: getDurationLabel(svc),
    date: formatDate(svc.date),
    time: formatTime(svc.time),
    price,
    benefitPercent,
    benefitAmount: Math.round((price * benefitPercent) / 100),
  };
}

const rows = computed<OverviewRow[]>(() => {
  const result: OverviewRow[] = [];

  // Member row: discount comes from the selected member's membershipBenefits.
  if (form.value.serviceId) {
    const memberBenefit = getMemberBenefitPercent(getServiceType(form.value));
    result.push(buildRow(form.value, memberName.value, "Member", memberBenefit));
  }

  // Visitors are guests — their discount comes from the selected member's guestBenefits.
  (form.value.visitors ?? []).forEach((v: any) => {
    if (!v.serviceId)
      return;
    const guestBenefit = getGuestBenefitPercent(getServiceType(v));
    result.push(buildRow(v, v.fullName || "Visitor", "Visitor", guestBenefit));
  });

  return result;
});

const subTotal = computed(() => rows.value.reduce((sum, r) => sum + r.price, 0));
const benefitDiscount = computed(() => rows.value.reduce((sum, r) => sum + r.benefitAmount, 0));

const promoDiscount = computed(() => {
  if (!appliedPromo.value?.isValid)
    return 0;
  const base = Math.max(0, subTotal.value - benefitDiscount.value);
  if (appliedPromo.value.type === "fixed")
    return Math.min(appliedPromo.value.amount, base);
  return Math.round((base * appliedPromo.value.amount) / 100);
});

const totalAmount = computed(() =>
  Math.max(0, subTotal.value - benefitDiscount.value - promoDiscount.value),
);

async function applyPromoCode(): Promise<void> {
  if (!form.value.promoCode?.trim())
    return;
  promoLoading.value = true;
  try {
    const data = await bookingStore.validatePromoCode(form.value.promoCode);
    if (data?.isValid) {
      appliedPromo.value = {
        code: data.code,
        type: data.type,
        amount: data.amount,
        isValid: true,
      };
      success({ message: "Promo code applied successfully" });
    }
    else {
      appliedPromo.value = null;
      showError({ message: "Invalid promo code" });
    }
  }
  catch (error) {
    appliedPromo.value = null;
    showError({ message: getApiErrorMessage(error, "Invalid promo code") });
  }
  finally {
    promoLoading.value = false;
  }
}

function removePromo(): void {
  appliedPromo.value = null;
}

defineExpose({
  appliedPromo,
  subTotal,
  benefitDiscount,
  promoDiscount,
  totalAmount,
});
</script>

<template>
  <section class="space-y-6">
    <!-- Booking Overview -->
    <div class="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
      <h3 class="text-sm font-semibold text-stone-900 px-5 sm:px-6 pt-5">
        Booking Overview
      </h3>

      <div class="p-5 sm:p-6 space-y-4">
        <!-- Services table -->
        <div class="overflow-x-auto">
          <base-table
            :columns="overviewColumns"
            :data="rows"
            empty-title="No services selected"
            empty-description="Select a service to see the booking overview."
          >
            <template #client-cell="{ row }">
              <span class="text-stone-700">
                {{ rowData(row).client }}
                <span class="text-stone-400">({{ rowData(row).tag }})</span>
              </span>
            </template>

            <template #service-cell="{ row }">
              <div class="flex flex-col">
                <span class="text-stone-700">{{ rowData(row).service }}</span>
                <span class="text-xs text-stone-400 capitalize">
                  <template v-if="rowData(row).durationLabel">{{ rowData(row).durationLabel }}</template>
                </span>
              </div>
            </template>

            <template #schedule-cell="{ row }">
              <div
                v-if="rowData(row).date"
                class="flex flex-col"
              >
                <span class="text-stone-700">{{ rowData(row).date }}</span>
                <span
                  v-if="rowData(row).time"
                  class="text-xs text-stone-400"
                >{{ rowData(row).time }}</span>
              </div>
              <span
                v-else
                class="text-stone-400 text-xs"
              >—</span>
            </template>

            <template #benefitPercent-cell="{ row }">
              <base-badge
                v-if="rowData(row).benefitPercent > 0"
                color="success"
              >
                {{ rowData(row).benefitPercent }}% Off
              </base-badge>
              <span
                v-else
                class="text-stone-400 text-xs"
              >—</span>
            </template>

            <template #price-cell="{ row }">
              <div class="font-medium text-stone-900">
                Rs. {{ rowData(row).price }}
              </div>
              <div
                v-if="rowData(row).benefitAmount > 0"
                class="text-xs text-emerald-600"
              >
                - Rs. {{ rowData(row).benefitAmount }}
              </div>
            </template>
          </base-table>
        </div>

        <!-- Totals -->
        <div class="rounded-lg bg-stone-50 border border-stone-100 p-4 space-y-2">
          <div class="flex justify-between text-sm font-medium text-stone-900">
            <span>Sub-Total ({{ rows.length }} {{ rows.length === 1 ? "Service" : "Services" }})</span>
            <span>Rs. {{ subTotal }}</span>
          </div>
          <div
            v-if="benefitDiscount > 0"
            class="flex justify-between text-sm text-stone-500"
          >
            <span>Benefit Discount</span>
            <span class="text-emerald-600">- Rs. {{ benefitDiscount }}</span>
          </div>
          <div
            v-if="promoDiscount > 0"
            class="flex justify-between text-sm text-stone-500"
          >
            <span>Promo Discount</span>
            <span class="text-emerald-600">- Rs. {{ promoDiscount }}</span>
          </div>
          <div class="border-t border-stone-200 pt-3 mt-1 flex justify-between font-bold text-stone-900">
            <span>Total Amount</span>
            <span>Rs.{{ totalAmount }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Promo code -->
    <div class="flex gap-2 flex-row items-end">
      <div class="relative w-full">
        <base-input
          v-model="form.promoCode"
          name="promoCode"
          label="Promo Code"
          placeholder="e.g PROMO20"
          class="flex-1"
          @update:model-value="removePromo"
          @keypress.enter="applyPromoCode"
        />
        <div
          v-if="appliedPromo?.isValid"
          class="absolute right-2 bottom-0.5"
        >
          <UIcon
            :name="ICONS.CIRCLE_CHECK"
            class="w-5 h-5 text-green-500"
          />
        </div>
      </div>
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
          class="border rounded-lg p-3 cursor-pointer flex items-center gap-3 transition-all min-w-0"
          :class="form.paymentMethod === method.value
            ? 'border-stone-200 bg-[#F9F6F2]'
            : 'border-stone-200 hover:border-stone-300'"
          @click="form.paymentMethod = method.value"
        >
          <div class="bg-primary-700 p-2 rounded-full flex items-center justify-center shrink-0">
            <UIcon
              :name="method.icon"
              class="w-5 h-5 text-white"
            />
          </div>
          <div class="flex flex-col min-w-0">
            <span class="text-sm font-semibold truncate">{{ method.label }}</span>
            <span class="text-xs text-stone-500 truncate">{{ method.description }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
