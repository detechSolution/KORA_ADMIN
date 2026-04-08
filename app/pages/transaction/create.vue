<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import SubscriptionForm from "~/components/transaction/forms/subscription-form.vue";
import NewTransactionForm from "~/components/transaction/forms/transaction-form.vue";
import { useNotification } from "~/composables/use-notification";
import { ICONS } from "~/config/icons";
import { useBillableItemsStore } from "~/stores/billable-items";
import { useCommunitiesStore } from "~/stores/communities";
import { getApiErrorMessage } from "~/utils/error";

definePageMeta({
  auth: true,
  layout: "dashboard",
  permission: "TRANSACTIONS.CREATE",
});

type InvoiceType = "new" | "subscription" | null;

const activeType = ref<InvoiceType>(null);
const billableItemsStore = useBillableItemsStore();
const communitiesStore = useCommunitiesStore();
const { error: showError } = useNotification();

const communityOptions = computed(() => {
  return communitiesStore.communities.data
    .map((community: any) => {
      const name = community.community_name || "N/A";
      const code = community.community_code || "";
      const label = code ? `${name} - ${code}` : name;
      return {
        label,
        value: community.id,
      };
    })
    .filter((option: { label: string; value: string }) => option.value !== "");
});

const billableOptions = computed(() => {
  return billableItemsStore.billableItems.data
    .map((item: any) => ({
      label: item.name || "Unnamed Item",
      value: item.id ?? "",
      billableData: item,
    }))
    .filter((option: { label: string; value: string }) => option.value !== "");
});

async function loadCommunities(): Promise<void> {
  try {
    await communitiesStore.getCommunities({
      pagination: { page: 1, limit: 100 },
      search: "",
      start_date: null,
      end_date: null,
    });
  }
  catch (error: unknown) {
    showError({ message: getApiErrorMessage(error, "Failed to load communities") });
  }
}

async function loadBillableItems(): Promise<void> {
  try {
    await billableItemsStore.getBillableItems({
      pagination: { page: 1, limit: 100 },
      is_active: true,
    });
  }
  catch (error: unknown) {
    showError({ message: getApiErrorMessage(error, "Failed to load billable items") });
  }
}

function setNewTransactionType(type: InvoiceType): void {
  activeType.value = type;
}

function handleCancel(): void {
  activeType.value = null;
}

onMounted(() => {
  loadCommunities();
  loadBillableItems();
});
</script>

<template>
  <div class="flex flex-col">
    <base-page-header v-if="!activeType">
      <template #title>
        Transaction
      </template>
      <template #description>
        Create and manage transactions for your communities
      </template>
    </base-page-header>

    <div v-if="!activeType" class="bg-card border-x border-b border-border rounded-b-xl shadow-sm p-6 page-content-height flex flex-col">
      <p class="text-base font-medium text-muted-foreground mb-5">
        Choose a transaction type to get started
      </p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl">
        <button
          type="button"
          class="group flex flex-col items-start gap-5 p-6 rounded-xl border border-border bg-muted/20 hover:border-primary/40 hover:bg-primary/5 hover:shadow-md transition-all duration-200 text-left hover:cursor-pointer"
          @click="setNewTransactionType('subscription')"
        >
          <div class="flex flex-col gap-3 flex-1 min-w-0">
            <h3 class="text-base font-semibold text-foreground">
              Subscription Transaction
            </h3>
            <p class="text-sm text-muted-foreground leading-relaxed">
              Bill communities based on their active subscription plans.
            </p>
            <ul class="flex flex-col gap-2 text-sm text-muted-foreground">
              <li class="flex items-center gap-2">
                <UIcon :name="ICONS.CHECK" class="w-4 h-4 text-primary shrink-0" />
                <span>Bill subscriptions plans</span>
              </li>
              <li class="flex items-center gap-2">
                <UIcon :name="ICONS.CHECK" class="w-4 h-4 text-primary shrink-0" />
                <span>Charge by plan (e.g. Basic, Premium)</span>
              </li>
              <li class="flex items-center gap-2">
                <UIcon :name="ICONS.CHECK" class="w-4 h-4 text-primary shrink-0" />
                <span>Add coupon code to apply discounts</span>
              </li>
            </ul>
          </div>
          <base-button :trailing-icon="ICONS.PLUS" class="w-full sm:w-auto">
            Create Subscription Transaction
          </base-button>
        </button>
        <button
          type="button"
          class="group flex flex-col items-start gap-5 p-6 rounded-xl border border-border bg-muted/20 hover:border-primary/40 hover:bg-primary/5 hover:shadow-md transition-all duration-200 text-left hover:cursor-pointer"
          @click="setNewTransactionType('new')"
        >
          <div class="flex flex-col gap-3 flex-1 min-w-0">
            <h3 class="text-base font-semibold text-foreground">
              New Transaction
            </h3>
            <p class="text-sm text-muted-foreground leading-relaxed">
              Create new bill with line items from your billable items list.
            </p>
            <ul class="flex flex-col gap-2 text-sm text-muted-foreground">
              <li class="flex items-center gap-2">
                <UIcon :name="ICONS.CHECK" class="w-4 h-4 text-primary shrink-0" />
                <span>Create new bill for billable items</span>
              </li>
              <li class="flex items-center gap-2">
                <UIcon :name="ICONS.CHECK" class="w-4 h-4 text-primary shrink-0" />
                <span>Billed by billable items</span>
              </li>
              <li class="flex items-center gap-2">
                <UIcon :name="ICONS.CHECK" class="w-4 h-4 text-primary shrink-0" />
                <span>Add multiple line items and adjust quantities per invoice</span>
              </li>
            </ul>
          </div>
          <base-button
            variant="outline"
            :trailing-icon="ICONS.PLUS"
            class="w-full sm:w-auto"
          >
            Create New Transaction
          </base-button>
        </button>
      </div>
    </div>

    <SubscriptionForm
      v-else-if="activeType === 'subscription'"
      :community-options="communityOptions"
      @cancel="handleCancel"
    />
    <NewTransactionForm
      v-else-if="activeType === 'new'"
      :billable-options="billableOptions"
      :community-options="communityOptions"
      @cancel="handleCancel"
    />
  </div>
</template>
