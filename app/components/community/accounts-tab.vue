<script setup lang="ts">
import { computed, ref, watch } from "vue";

import { useNotification } from "~/composables/use-notification";
import { usePermission } from "~/composables/use-permission";
import { SUBSCRIPTION_STATUS } from "~/config/constants";
import { ICONS } from "~/config/icons";
import { PERMISSIONS_COMMUNITIES } from "~/config/permissions";
import { getSubscriptionStatusConfig } from "~/config/subscription-status";
import { useCommunitiesStore } from "~/stores/communities";
import { formatDateTime, formatNumber } from "~/utils/common";
import { getApiErrorMessage } from "~/utils/error";

type Props = {
  community: any;
};

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "updated"): void;
}>();

const communitiesStore = useCommunitiesStore();
const { can } = usePermission();
const { success, error } = useNotification();

const summaryData = ref<any>(null);
const summaryLoading = ref(false);

const community = computed(() => props.community || null);

const displayCommunity = computed(() => {
  const c = community.value;
  const s = summaryData.value;
  if (!c)
    return null;
  if (!s || typeof s !== "object")
    return c;
  return { ...c, ...s };
});

async function fetchSummary(): Promise<void> {
  const id = community.value?.id;
  if (!id)
    return;
  summaryData.value = null;
  summaryLoading.value = true;
  try {
    const data = await communitiesStore.getCommunitySummary(id);
    if (data && typeof data === "object")
      summaryData.value = data;
  }
  catch {
    // Cards will show 0.00 from list data
  }
  finally {
    summaryLoading.value = false;
  }
}

watch(
  () => community.value?.id,
  (id) => {
    if (id)
      fetchSummary();
    else
      summaryData.value = null;
  },
  { immediate: true },
);

const totalInvoiced = computed(() => {
  const v = displayCommunity.value?.total_invoiced;
  return v !== undefined && v !== null ? formatNumber(Number(v)) : "0.00";
});

const hasInvoiced = computed(() => {
  const v = displayCommunity.value?.total_invoiced;
  return Number(v ?? 0) > 0;
});

const isTrial = computed(() => {
  return Boolean(displayCommunity.value?.subscription_is_trial);
});

const totalPendingAmount = computed(() => {
  const v = displayCommunity.value?.total_pending_amount;
  return v !== undefined && v !== null ? formatNumber(Number(v)) : "0.00";
});

const hasPlanData = computed(() => {
  const c = displayCommunity.value;
  return c?.subscription_plan_name ?? c?.subscription_plan_start_date ?? c?.subscription_plan_end_date;
});

const selectedStatus = ref("");
const updating = ref(false);

const statusConfig = computed(() => {
  const status = displayCommunity.value?.status || "N/A";
  return getSubscriptionStatusConfig(status);
});

const statusOptions = [
  { label: "Active", value: SUBSCRIPTION_STATUS.ACTIVE },
  { label: "Inactive", value: SUBSCRIPTION_STATUS.INACTIVE },
  { label: "Canceled", value: SUBSCRIPTION_STATUS.CANCELED },
  { label: "Expired", value: SUBSCRIPTION_STATUS.EXPIRED },
  { label: "Past Due", value: SUBSCRIPTION_STATUS.PAST_DUE },
];

const hasStatusChanged = computed(() => {
  const currentStatus = displayCommunity.value?.status || "";
  return selectedStatus.value && selectedStatus.value !== currentStatus;
});

const subscriptionId = computed(() => {
  const c = displayCommunity.value;
  return c?.subscription_id ?? null;
});

watch(
  () => displayCommunity.value?.status,
  () => {
    selectedStatus.value = "";
  },
);

async function handleUpdateStatus(): Promise<void> {
  const subscriptionIdValue = subscriptionId.value;
  if (!subscriptionIdValue) {
    error({ message: "No subscription linked to this community. Cannot update subscription status." });
    return;
  }

  try {
    updating.value = true;
    await communitiesStore.updateCommunitySubscriptionStatus({
      subscription_id: Number(subscriptionIdValue),
      status: selectedStatus.value,
    });
    success({ message: "Subscription status updated successfully" });
    selectedStatus.value = "";
    emit("updated");
  }
  catch (err: unknown) {
    error({ message: getApiErrorMessage(err, "Failed to update subscription status") });
  }
  finally {
    updating.value = false;
  }
}

const sectionTitleClass = "flex items-center gap-3 mb-4";
const sectionHeadingClass = "text-sm font-semibold text-foreground uppercase tracking-wide";
const fieldLabelClass = "block text-xs font-medium text-muted-foreground";
const fieldValueClass = "text-sm text-foreground bg-muted/30 rounded-lg px-3 py-2.5 border border-border/50 min-h-[44px] flex items-center";
</script>

<template>
  <div v-if="!community" class="bg-card border border-border rounded-xl p-6 shadow-sm">
    <div class="flex flex-col items-center justify-center py-12 gap-2">
      <div class="p-4 rounded-full bg-muted/50">
        <UIcon :name="ICONS.BUILDING" class="w-6 h-6 text-muted-foreground" />
      </div>
      <div class="text-sm font-medium text-muted-foreground">
        No community selected
      </div>
    </div>
  </div>
  <div v-else class="bg-card border border-border rounded-xl p-6 shadow-sm">
    <!-- Header -->
    <div class="flex items-center gap-3 mb-6 pb-4 border-b border-border">
      <div class="p-2 rounded-lg bg-primary/10">
        <UIcon :name="ICONS.BUILDING" class="w-5 h-5 text-primary" />
      </div>
      <div>
        <h3 class="text-lg font-semibold text-foreground">
          Accounts
        </h3>
        <p class="text-xs text-muted-foreground mt-0.5">
          Subscription, billing and invoicing
        </p>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
      <div class="relative rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:bg-muted/30">
        <div class="flex items-center justify-between gap-3">
          <div class="flex flex-col gap-1 min-w-0">
            <span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Total Invoiced
            </span>
            <USkeleton v-if="summaryLoading" class="w-[100px] h-[25px]" />
            <p v-else class="text-lg sm:text-xl font-semibold text-foreground leading-tight tabular-nums">
              {{ totalInvoiced }}
            </p>
          </div>
          <div class="flex items-center justify-center rounded-lg bg-primary/10 text-primary h-9 w-9 shrink-0">
            <UIcon :name="ICONS.BILLING" class="h-4 w-4" />
          </div>
        </div>
      </div>
      <div class="relative rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:bg-muted/30">
        <div class="flex items-center justify-between gap-3">
          <div class="flex flex-col gap-1 min-w-0">
            <span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Total Pending
            </span>
            <USkeleton v-if="summaryLoading" class="w-[100px] h-[25px]" />
            <p v-else class="text-lg sm:text-xl font-semibold text-foreground leading-tight tabular-nums">
              {{ totalPendingAmount }}
            </p>
          </div>
          <div class="flex items-center justify-center rounded-lg bg-primary/10 text-primary h-9 w-9 shrink-0">
            <UIcon :name="ICONS.CLOCK" class="h-4 w-4" />
          </div>
        </div>
      </div>
    </div>

    <div class="space-y-6">
      <!-- Billing Units -->
      <div class="border-b border-border pb-6">
        <div :class="sectionTitleClass">
          <UIcon :name="ICONS.BILLING" class="w-4 h-4 text-primary shrink-0" />
          <h4 :class="sectionHeadingClass">
            Billing Units
          </h4>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-1.5">
            <label :class="fieldLabelClass">Declared Units</label>
            <div class="min-h-[38px]">
              <div :class="fieldValueClass">
                {{ displayCommunity?.declared_units ?? "N/A" }}
              </div>
            </div>
          </div>
          <div class="space-y-1.5">
            <label :class="fieldLabelClass">Billed Units</label>
            <div class="min-h-[38px]">
              <div :class="fieldValueClass">
                {{ displayCommunity?.billed_units ?? "N/A" }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Subscription Plan -->
      <div class="border-b border-border pb-6">
        <div :class="sectionTitleClass">
          <UIcon :name="ICONS.SUBSCRIPTIONS" class="w-4 h-4 text-primary shrink-0" />
          <h4 :class="sectionHeadingClass">
            Subscription Plan
          </h4>
        </div>

        <div v-if="!hasPlanData" class="text-sm text-muted-foreground bg-muted/30 rounded-lg px-3 py-2.5 border border-border/50">
          No subscription plan found
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-1.5">
            <label :class="fieldLabelClass">Plan Name</label>
            <div class="min-h-[38px]">
              <div :class="fieldValueClass">
                {{ displayCommunity?.subscription_plan_name || "N/A" }}
              </div>
            </div>
          </div>
          <div class="space-y-1.5">
            <label :class="fieldLabelClass">Interval</label>
            <div class="min-h-[38px]">
              <div :class="fieldValueClass">
                {{ displayCommunity?.subscription_plan_interval || "N/A" }}
              </div>
            </div>
          </div>
          <div class="space-y-1.5 md:col-span-2">
            <label :class="fieldLabelClass">Description</label>
            <div class="min-h-[38px]">
              <div :class="fieldValueClass">
                {{ displayCommunity?.subscription_plan_description || "N/A" }}
              </div>
            </div>
          </div>
          <div class="space-y-1.5">
            <label :class="fieldLabelClass">Start Date</label>
            <div class="min-h-[38px]">
              <div :class="fieldValueClass">
                {{ displayCommunity?.subscription_plan_start_date ? formatDateTime(displayCommunity.subscription_plan_start_date) : "N/A" }}
              </div>
            </div>
          </div>
          <div class="space-y-1.5">
            <label :class="fieldLabelClass">End Date</label>
            <div class="min-h-[38px]">
              <div :class="fieldValueClass">
                {{ displayCommunity?.subscription_plan_end_date ? formatDateTime(displayCommunity.subscription_plan_end_date) : "N/A" }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Status -->
      <div>
        <div :class="sectionTitleClass">
          <UIcon :name="ICONS.SETTINGS" class="w-4 h-4 text-primary shrink-0" />
          <h4 :class="sectionHeadingClass">
            Status
          </h4>
        </div>

        <div class="space-y-4">
          <p v-if="!hasInvoiced && !isTrial" class="text-xs text-muted-foreground rounded-lg bg-muted/40 border border-border/50 px-3 py-2.5">
            Status will become <strong>Available</strong> once the first invoice is created for this community. You can change status after that.
          </p>
          <div class="flex items-center gap-3">
            <span :class="fieldLabelClass">Current status</span>
            <base-badge
              :color="statusConfig.color"
              class="text-sm"
            >
              {{ statusConfig.label }}
            </base-badge>
          </div>

          <template v-if="can(PERMISSIONS_COMMUNITIES.VIEW_ACCOUNT_UPDATE)">
            <base-select
              v-model="selectedStatus"
              name="status"
              label="Change status"
              placeholder="Select new status"
              :options="statusOptions"
              :disabled="!hasInvoiced && !isTrial"
            />
            <div class="flex justify-end">
              <base-button
                :loading="updating"
                :disabled="(!hasInvoiced && !isTrial) || !hasStatusChanged"
                @click="handleUpdateStatus"
              >
                Update Status
              </base-button>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
