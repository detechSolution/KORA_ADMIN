<script setup lang="ts">
import { computed, h, onMounted, ref, resolveComponent } from "vue";

import { useNotification } from "~/composables/use-notification";
import { usePermission } from "~/composables/use-permission";
import { ICONS } from "~/config/icons";
import { PERMISSIONS_CONFIGURATION } from "~/config/permissions";
import { usePaymentMethodsStore } from "~/stores/payment-methods";
import { getApiErrorMessage } from "~/utils/error";

definePageMeta({
  auth: true,
  layout: "dashboard",
  permission: "CONFIGURATION.PAYMENT_METHODS",
});

const paymentMethodsStore = usePaymentMethodsStore();
const { can } = usePermission();

const loading = ref(false);
const loadingMethods = ref(false);
const selectedCategoryId = ref<number | null>(null);
const { error: showError } = useNotification();

const isAddCategoryModalOpen = ref(false);
const isAddMethodModalOpen = ref(false);
const isEditMethodModalOpen = ref(false);
const selectedMethodToEdit = ref<any>(null);

const categories = ref<any[]>([]);
const methods = ref<any[]>([]);

const columns = computed(() => [
  {
    header: "S.No.",
    cell: ({ row }: { row: any }) => row.index + 1,
  },
  {
    accessorKey: "name",
    header: "Payment Method",
    cell: ({ row }: { row: any }) => row.original.name ?? "-",
  },
  {
    accessorKey: "is_active",
    header: "Status",
    cell: ({ row }: { row: any }) =>
      h(
        resolveComponent("base-badge"),
        {
          color: row.original.is_active ? "success" : "muted",
        },
        () => (row.original.is_active ? "Enabled" : "Disabled"),
      ),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }: { row: any }) => {
      const method = row.original;
      const items = [];
      if (can(PERMISSIONS_CONFIGURATION.PAYMENT_METHODS)) {
        items.push({
          label: "Update details",
          onSelect: () => {
            selectedMethodToEdit.value = method;
            isEditMethodModalOpen.value = true;
          },
        });
      }
      if (items.length === 0)
        return null;
      return h(
        "div",
        { class: "text-right" },
        h(
          resolveComponent("UDropdownMenu"),
          {
            content: { align: "end" },
            ui: { content: "min-w-[150px]", itemLeadingIcon: "hidden" },
            items,
          },
          () =>
            h(resolveComponent("UButton"), {
              icon: ICONS.ELLIPSIS_VERTICAL,
              color: "neutral",
              variant: "ghost",
              class: "ml-auto",
            }),
        ),
      );
    },
  },
]);

async function fetchCategories(): Promise<void> {
  try {
    loading.value = true;
    const result = await paymentMethodsStore.getTransactionPaymentCategories() as any;
    categories.value = result ?? [];
  }
  catch (err: unknown) {
    showError({ message: getApiErrorMessage(err, "Failed to load categories") });
  }
  finally {
    loading.value = false;
  }
}

async function fetchMethods(): Promise<void> {
  try {
    const payload: Record<string, any> = {};
    if (selectedCategoryId.value !== null) {
      payload.category_id = selectedCategoryId.value;
    }
    loadingMethods.value = true;
    const result = await paymentMethodsStore.getTransactionPaymentMethods(payload) as any;
    methods.value = result ?? [];
  }
  catch (err: unknown) {
    showError({ message: getApiErrorMessage(err, "Failed to load payment methods") });
  }
  finally {
    loadingMethods.value = false;
  }
}

function handleAddCategory(): void {
  isAddCategoryModalOpen.value = true;
}

function handleAddMethod(): void {
  isAddMethodModalOpen.value = true;
}

function handleCategoryCreated(): void {
  isAddCategoryModalOpen.value = false;
  fetchCategories();
}

function handleMethodCreated(): void {
  isAddMethodModalOpen.value = false;
  fetchMethods();
}

function handleSelectCategory(id: number): void {
  selectedCategoryId.value = id;
  fetchMethods();
}

function handleMethodUpdated(): void {
  isEditMethodModalOpen.value = false;
  selectedMethodToEdit.value = null;
  fetchMethods();
}

function closeEditMethodModal(): void {
  isEditMethodModalOpen.value = false;
  selectedMethodToEdit.value = null;
}

onMounted(() => {
  fetchCategories();
});
</script>

<template>
  <div class="flex flex-col">
    <base-page-header>
      <template #title>
        Payment Methods
      </template>
      <template #description>
        Manage transaction payment categories and methods.
      </template>
      <template #actions>
        <base-button
          v-if="can(PERMISSIONS_CONFIGURATION.PAYMENT_METHODS_ADD_CATEGORY)"
          variant="outline"
          size="md"
          :trailing-icon="ICONS.PLUS"
          @click="handleAddCategory"
        >
          Add Category
        </base-button>
      </template>
    </base-page-header>

    <div class="bg-card border-x border-b border-border rounded-b-xl shadow-sm p-4 sm:p-6 flex flex-col gap-4 page-content-height">
      <div class="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 flex-1 min-h-0">
        <div class="flex flex-col rounded-lg border border-border bg-muted/30 overflow-hidden min-h-0">
          <div class="px-4 py-3 border-b border-border bg-muted/50 flex items-center h-11">
            <h2 class="text-sm font-semibold text-foreground">
              Categories
            </h2>
          </div>
          <div class="flex-1 overflow-y-auto p-2">
            <template v-if="loading">
              <div class="flex items-center justify-center py-8">
                <UIcon :name="ICONS.REFRESH_CW" class="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            </template>
            <template v-else-if="categories.length === 0">
              <p class="text-sm text-muted-foreground text-center py-6">
                No categories yet. Add a category to get started.
              </p>
            </template>
            <template v-else>
              <button
                v-for="item in categories"
                :key="item.id"
                type="button"
                class="w-full text-left px-3 py-2.5 rounded-md text-sm font-medium transition-colors flex items-center justify-between gap-2"
                :class="[
                  selectedCategoryId === item.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-muted',
                ]"
                @click="handleSelectCategory(item.id)"
              >
                <span>{{ item.category_name ?? item.name ?? "Category" }}</span>
                <UIcon
                  v-if="selectedCategoryId === item.id"
                  :name="ICONS.CHECK"
                  class="w-4 h-4 shrink-0"
                />
              </button>
            </template>
          </div>
        </div>

        <div class="flex flex-col rounded-lg border border-border bg-muted/30 overflow-hidden min-h-0 min-w-0">
          <div class="px-4 py-3 border-b border-border bg-muted/50 flex items-center justify-between gap-2 min-h-11 h-11">
            <div class="flex items-center gap-2 min-w-0">
              <h2 class="text-sm font-semibold text-foreground shrink-0">
                Payment Methods
              </h2>
            </div>
            <div class="flex justify-end items-center">
              <base-button
                v-if="can(PERMISSIONS_CONFIGURATION.PAYMENT_METHODS_ADD_METHOD)"
                variant="outline"
                size="sm"
                @click="handleAddMethod"
              >
                Add Method
              </base-button>
            </div>
          </div>
          <div class="flex-1 overflow-y-auto p-4">
            <div class="rounded-lg border border-border overflow-hidden bg-card">
              <base-table
                :data="methods"
                :columns="columns"
                :loading="loadingMethods"
                :skeleton-rows="5"
                :empty-title="selectedCategoryId ? 'No payment methods' : 'View payment methods'"
                :empty-description="selectedCategoryId ? 'Add a payment method to get started.' : 'Select a category to view payment methods'"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <configuration-payment-methods-add-category-modal
      :open="isAddCategoryModalOpen"
      @close="isAddCategoryModalOpen = false"
      @created="handleCategoryCreated"
    />
    <configuration-payment-methods-add-method-modal
      :open="isAddMethodModalOpen"
      :categories="categories"
      @close="isAddMethodModalOpen = false"
      @created="handleMethodCreated"
    />
    <configuration-payment-methods-edit-method-modal
      :open="isEditMethodModalOpen"
      :method="selectedMethodToEdit"
      :categories="categories"
      @close="closeEditMethodModal"
      @updated="handleMethodUpdated"
    />
  </div>
</template>
