<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import type { PromoCode } from "~/types/promo-code";

import { usePagination } from "~/composables/use-pagination";
import { ICONS } from "~/config/icons";
import { usePromoCodeStore } from "~/stores/promo-code";
import { formatDate } from "~/utils/common";

definePageMeta({
  auth: true,
  layout: "dashboard",
  permission: "promo_codes.view",
});

const statusOptions = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

const columns = [
  {
    id: "code",
    header: "Code",
    accessorKey: "code",
  },
  {
    id: "discountValue",
    header: "Discount",
    accessorKey: "discountValue",
  },
  {
    id: "redemptionLimit",
    header: "Redeem Limit",
    accessorKey: "redemptionLimit",
  },
  {
    id: "redemptionCount",
    header: "Reedemed Count",
    accessorKey: "redemptionCount",
  },
  {
    id: "expiresAt",
    header: "Expires At",
    accessorKey: "expiresAt",
    accessorFn: (row: PromoCode) => formatDate(row.expiresAt),
  },
  {
    id: "isActive",
    header: "Status",
    accessorKey: "isActive",
  },
  {
    id: "actions",
    header: "Actions",
  },

];

type DateRangeFilter = {
  start: string | null;
  end: string | null;
};

const promoCodeStore = usePromoCodeStore();
const { pagination } = usePagination();
const promoCodes = computed(() => promoCodeStore.promoCodes);
const editDrawerOpen = ref(false);
const selectedPromoCode = ref<PromoCode | null>(null);

const state = ref({
  search: "",
  dateRange: { start: null, end: null } as DateRangeFilter,
  status: "" as string | boolean,
});

async function fetchPromoCodes(): Promise<void> {
  try {
    const params = {
      page: pagination.value.page,
      limit: pagination.value.pageSize,
      q: state.value.search || undefined,
      status: state.value.status === "" ? undefined : state.value.status,
      fromDate: state.value.dateRange.start || undefined,
      toDate: state.value.dateRange.end || undefined,
    };
    await promoCodeStore.getPromoCodes(params);
  }
  catch (error) {
    console.error("Failed to fetch promo codes:", error);
  }
}

function handleSearchClick(): void {
  pagination.value.page = 1;
  fetchPromoCodes();
}

function clearFilters(): void {
  state.value.search = "";
  state.value.status = "";
  state.value.dateRange = { start: null, end: null };
  handleSearchClick();
}

function hasActiveFilters(): boolean {
  return !!(
    state.value.search
    || state.value.status !== ""
    || state.value.dateRange.start
    || state.value.dateRange.end
  );
}

function openEditDrawer(promoCode: PromoCode): void {
  selectedPromoCode.value = promoCode;
  editDrawerOpen.value = true;
}

function closeEditDrawer(): void {
  editDrawerOpen.value = false;
  selectedPromoCode.value = null;
}

async function handlePromoCodeUpdated(): Promise<void> {
  await fetchPromoCodes();
}

onMounted(() => {
  fetchPromoCodes();
});
</script>

<template>
  <div class="flex flex-col gap-6">
    <base-page-header>
      <template #title>
        Promo Code
      </template>
      <template #description>
        View and manage promo codes
      </template>

      <template #actions>
        <NuxtLink to="/promo-code/create">
          <base-button
            variant="solid"
            size="md"
            :trailing-icon="ICONS.PLUS"
          >
            Create Promo Code
          </base-button>
        </NuxtLink>
      </template>
    </base-page-header>

    <div class="bg-white rounded-xl flex flex-col gap-4 p-4">
      <div class="">
        <h2 class="text-base font-semibold">
          Promo Code List
        </h2>
      </div>

      <div class="flex flex-col sm:flex-row justify-between gap-4">
        <div class="flex flex-col sm:flex-row gap-4 sm:gap-2 items-start sm:items-end flex-wrap">
          <base-input
            v-model="state.search"
            name="search"
            placeholder="Search"
            class="w-full sm:w-auto sm:flex-1 md:w-64"
            :leading-icon="ICONS.SEARCH"
            @keyup.enter="handleSearchClick"
          />

          <base-date-picker
            v-model="state.dateRange"
            name="dateRange"
            placeholder="Select date range"
            range
            :no-of-months="2"
            class="w-full sm:w-auto sm:flex-1 md:w-64"
          />
          <base-select
            v-model="state.status"
            name="status"
            placeholder="All statuses"
            class="w-full sm:w-auto sm:flex-1 md:w-64"
            :options="statusOptions"
          />
          <div class="flex gap-2 w-full sm:w-auto">
            <base-button
              variant="outline"
              class="flex-1 sm:flex-none"
              :leading-icon="ICONS.SEARCH"
              :loading="promoCodeStore.loading"
              @click="handleSearchClick"
            >
              Search
            </base-button>
            <base-button
              v-if="hasActiveFilters()"
              variant="outline"
              class="flex-1 sm:flex-none"
              @click="clearFilters"
            >
              Clear Filters
            </base-button>
          </div>
        </div>

        <base-button
          variant="outline"
          :leading-icon="ICONS.DOWNLOAD"
        >
          Export
        </base-button>
      </div>

      <base-table
        :data="promoCodes.data"
        :columns="columns"
        :loading="promoCodeStore.loading"
        empty-title="No promo codes found"
        empty-description="It looks like you haven't added any promo codes. Create one to get started."
      >
        <template #isActive-cell="{ row }">
          <base-badge :color="row.original.isActive ? 'emerald' : 'red'">
            {{ row.original.isActive ? "Active" : "Inactive" }}
          </base-badge>
        </template>

        <template #actions-cell="{ row }">
          <div class="text-left">
            <base-dropdown-menu
              :items="[
                {
                  label: 'Edit Promo',
                  onSelect: () => openEditDrawer(row.original),
                  class: 'cursor-pointer',
                },
              ]"
            >
              <base-button
                :icon="ICONS.ELLIPSIS_VERTICAL"
                variant="ghost"
              />
            </base-dropdown-menu>
          </div>
        </template>
      </base-table>
      <base-pagination
        :page="pagination.page"
        :total="promoCodes.meta.total"
        :items-per-page="pagination.pageSize"
        :disabled="promoCodeStore.loading"
        @update:page="(v) => { pagination.page = v; fetchPromoCodes(); }"
      />
    </div>

    <promo-code-edit-drawer
      :open="editDrawerOpen"
      :promo-code="selectedPromoCode"
      title="Edit Promo Code"
      @close="closeEditDrawer"
      @updated="handlePromoCodeUpdated"
    />
  </div>
</template>
