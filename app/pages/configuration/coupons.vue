<script setup lang="ts">
import { h, onMounted, ref, resolveComponent } from "vue";

import { useNotification } from "~/composables/use-notification";
import { usePagination } from "~/composables/use-pagination";
import { usePermission } from "~/composables/use-permission";
import { ICONS } from "~/config/icons";
import { PERMISSIONS_CONFIGURATION } from "~/config/permissions";
import { useCouponsStore } from "~/stores/coupons";
import { formatDateTime } from "~/utils/common";
import { getApiErrorMessage } from "~/utils/error";

definePageMeta({
  auth: true,
  layout: "dashboard",
  permission: "CONFIGURATION.COUPONS",
});

const { can } = usePermission();
const { error: showError } = useNotification();
const couponsStore = useCouponsStore();
const { pagination } = usePagination();

const state = ref<{
  is_active: string;
  code: string;
}>({
  is_active: "",
  code: "",
});

const isActiveOptions = ref([
  { label: "Active", value: "true" },
  { label: "Inactive", value: "false" },
]);

const loading = ref(false);
const isCreateModalOpen = ref(false);
const selectedCoupon = ref<any>(null);
const isViewModalOpen = ref(false);

const columns = ref([
  {
    accessorKey: "code",
    header: "Code",
  },
  {
    accessorKey: "coupon_type",
    header: "Coupon Type",
  },
  {
    accessorKey: "discount_value",
    header: "Discount",
    cell: ({ row }: { row: any }) => {
      const couponType = row.original.coupon_type;
      const value = row.original.discount_value ?? 0;
      return couponType === "AMOUNT" ? value : `${value}%`;
    },
  },
  {
    accessorKey: "redemption_limit",
    header: "Redeem Limit",
    cell: ({ row }: { row: any }) => row.original.redemption_limit,
  },
  {
    accessorKey: "redeemed_count",
    header: "Redeemed Count",
    cell: ({ row }: { row: any }) => row.original.redeemed_count,
  },
  {
    accessorKey: "expires_at",
    header: "Expires At",
    cell: ({ row }: { row: any }) => {
      const expiresAt = row.original.expires_at;
      if (!expiresAt) {
        return "-";
      }
      return formatDateTime(expiresAt);
    },
  },
  {
    accessorKey: "is_active",
    header: "Status",
    cell: ({ row }: { row: any }) => {
      const isActive = row.original.is_active;
      const label = isActive ? "Active" : "Inactive";
      const color: "emerald" | "red" = isActive ? "emerald" : "red";

      return h(
        resolveComponent("base-badge"),
        {
          color,
        },
        () => label,
      );
    },
  },
  {
    accessorKey: "created_at",
    header: "Created At",
    cell: ({ row }: { row: any }) => {
      const createdAt = row.original.created_at;
      if (!createdAt) {
        return "-";
      }
      return formatDateTime(createdAt);
    },
  },
  {
    id: "actions",
    cell: ({ row }: { row: any }) => {
      if (row.original.redeemed_count > 0)
        return null;
      const items = [];
      if (can(PERMISSIONS_CONFIGURATION.COUPONS_VIEW)) {
        items.push({
          label: "View details",
          onSelect: () => {
            selectedCoupon.value = row.original;
            isViewModalOpen.value = true;
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
            content: {
              align: "end",
            },
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

async function getCoupons(): Promise<void> {
  try {
    loading.value = true;
    const isActive = state.value.is_active === "true"
      ? true
      : state.value.is_active === "false"
        ? false
        : undefined;
    await couponsStore.getCoupons({
      page: pagination.value.page,
      limit: pagination.value.pageSize,
      is_active: isActive,
      code: state.value.code || undefined,
    });
  }
  catch (error: unknown) {
    showError({ message: getApiErrorMessage(error, "Failed to get coupons") });
  }
  finally {
    loading.value = false;
  }
}

function handleSearch(): void {
  pagination.value.page = 1;
  getCoupons();
}

function clearFilters(): void {
  state.value.is_active = "";
  state.value.code = "";
}

function handleCouponCreated(): void {
  isCreateModalOpen.value = false;
  getCoupons();
}

function closeViewModal(): void {
  isViewModalOpen.value = false;
  selectedCoupon.value = null;
}

function handleCouponUpdated(): void {
  closeViewModal();
  getCoupons();
}

onMounted(() => {
  getCoupons();
});
</script>

<template>
  <div class="flex flex-col">
    <base-page-header>
      <template #title>
        Coupons
      </template>
      <template #description>
        View and manage discount coupons.
      </template>
      <template #actions>
        <base-button
          v-if="can(PERMISSIONS_CONFIGURATION.COUPONS_ADD)"
          variant="outline"
          size="md"
          :trailing-icon="ICONS.PLUS"
          @click="isCreateModalOpen = true"
        >
          Create Coupon
        </base-button>
      </template>
    </base-page-header>
    <div class="bg-card border-x border-b border-border rounded-b-xl shadow-sm p-6 flex flex-col gap-4 page-content-height">
      <div class="flex flex-col sm:flex-row gap-4 sm:gap-2 items-start sm:items-end">
        <base-input
          v-model="state.code"
          name="code"
          placeholder="Search by coupon code"
          class="w-full sm:w-auto sm:flex-1 sm:max-w-xs"
        />
        <base-select
          v-model="state.is_active"
          name="is_active"
          placeholder="Select status"
          :options="isActiveOptions"
          class="w-full sm:w-auto sm:flex-1 sm:max-w-xs"
        />
        <div class="flex gap-2 w-full sm:w-auto">
          <base-button
            v-if="state.is_active || state.code"
            variant="outline"
            class="flex-1 sm:flex-none"
            @click="clearFilters"
          >
            Clear Filters
          </base-button>
          <base-button
            :loading="loading"
            class="flex-1 sm:flex-none"
            :leading-icon="ICONS.SEARCH"
            @click="handleSearch"
          >
            Search
          </base-button>
        </div>
      </div>
      <base-table
        :data="couponsStore.coupons.data"
        :columns="columns"
        :loading="loading"
        empty-title="No coupons found"
        empty-description="Create a coupon to start offering discounts."
      />
      <base-pagination
        :page="pagination.page"
        :total="Number(couponsStore.coupons.total_count)"
        :items-per-page="pagination.pageSize"
        :disabled="loading"
        @update:page="(v) => { pagination.page = v; getCoupons(); }"
      />
    </div>
    <configuration-coupons-create-modal
      :open="isCreateModalOpen"
      @close="isCreateModalOpen = false"
      @created="handleCouponCreated"
    />
    <configuration-coupons-view-modal
      :open="isViewModalOpen"
      :coupon="selectedCoupon"
      @close="closeViewModal"
      @updated="handleCouponUpdated"
    />
  </div>
</template>
