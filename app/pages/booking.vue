<script setup lang="ts">
import { computed, h, onMounted, ref, resolveComponent } from "vue";

import { useNotification } from "~/composables/use-notification";
import { usePagination } from "~/composables/use-pagination";
import { usePermission } from "~/composables/use-permission";
import { ICONS } from "~/config/icons";
import { getInquiryStatusColor } from "~/config/inquiry-status";
import { PERMISSIONS_INQUIRIES } from "~/config/permissions";
import { useInquiriesStore } from "~/stores/inquiries";
import { formatDateTime } from "~/utils/common";
import { getApiErrorMessage } from "~/utils/error";

definePageMeta({
  auth: true,
  layout: "dashboard",
  permission: "INQUIRIES",
});

const { can } = usePermission();
const { error: showError } = useNotification();
const inquiriesStore = useInquiriesStore();
const { pagination } = usePagination();

const loading = ref(false);
const statusLoading = ref(false);

const state = ref({
  search: "",
  status: null as number | null,
  dateRange: { start: null, end: null },
});

const statusOptions = computed(() => {
  return inquiriesStore.inquiryStatuses.map(item => ({
    label: `${item.name} - ${item.description}`,
    value: item.id,
  }));
});

const selectedInquiry = ref<any>(null);
const isModalOpen = ref(false);
const isCreateModalOpen = ref(false);

const columns = ref([
  {
    accessorKey: "company_name",
    header: "Booking ID",
  },
  {
    accessorKey: "contact_name",
    header: "Client",
  },
  {
    accessorKey: "email",
    header: "Session/Service",
  },
  {
    accessorKey: "phone",
    header: "Type",
  },
  {
    accessorKey: "phone",
    header: "Booked Date",
  },
  {
    accessorKey: "status_name",
    header: "Status",
    cell: ({ row }: { row: any }) => {
      const statusId = Number(row.original.status_id ?? 0);
      const label = String(row.original.status_name ?? "").trim() || "N/A";
      const color = getInquiryStatusColor(statusId);
      return h(
        resolveComponent("base-badge"),
        { color },
        () => label,
      );
    },
  },
  {
    accessorKey: "created_at",
    header: "Created At",
    cell: ({ row }: { row: any }) => formatDateTime(row.original.created_at),
  },
  {
    id: "actions",
    cell: ({ row }: { row: any }) => {
      const items = [];
      if (can(PERMISSIONS_INQUIRIES.VIEW) || can(PERMISSIONS_INQUIRIES.VIEW_INFO)) {
        items.push({
          label: "View details",
          onSelect: () => {
            selectedInquiry.value = row.original;
            isModalOpen.value = true;
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

async function getInquiries(): Promise<void> {
  try {
    loading.value = true;
    const payload = {
      page: pagination.value.page,
      limit: pagination.value.pageSize,
      search: state.value.search || undefined,
      status_id: state.value.status ? Number(state.value.status) : undefined,
      start_date: state.value.dateRange.start || undefined,
      end_date: state.value.dateRange.end || undefined,
    };
    await inquiriesStore.getInquiries(payload);
  }
  catch (error: unknown) {
    showError({ message: getApiErrorMessage(error, "Failed to get inquiries") });
  }
  finally {
    loading.value = false;
  }
}

function handleSearch(): void {
  pagination.value.page = 1;
  getInquiries();
}

function clearFilters(): void {
  state.value.search = "";
  state.value.status = null;
  state.value.dateRange = { start: null, end: null };
}

function closeModal(): void {
  isModalOpen.value = false;
  selectedInquiry.value = null;
}

async function updateInquiry(): Promise<void> {
  // Refresh the inquiries list to get updated data
  await getInquiries();

  // Update the selected inquiry with fresh data from the list
  if (selectedInquiry.value?.id) {
    const updatedInquiry = inquiriesStore.inquiries.data.find(
      (inquiry: any) => inquiry.id === selectedInquiry.value.id,
    );
    if (updatedInquiry) {
      selectedInquiry.value = updatedInquiry;
    }
  }

  // Keep the modal open - don't call closeModal()
}

async function getInquiryStatuses(): Promise<void> {
  try {
    statusLoading.value = true;
    await inquiriesStore.getInquiryStatuses();
  }
  catch (error: unknown) {
    showError({ message: getApiErrorMessage(error, "Failed to load inquiry statuses") });
  }
  finally {
    statusLoading.value = false;
  }
}

async function getInquirySources(): Promise<void> {
  try {
    await inquiriesStore.getInquirySources();
  }
  catch (error: unknown) {
    showError({ message: getApiErrorMessage(error, "Failed to load inquiry sources") });
  }
}

function handleInquiryCreated(): void {
  isCreateModalOpen.value = false;
  getInquiries();
}

onMounted(() => {
  Promise.all([
    getInquiryStatuses(),
    getInquirySources(),
    getInquiries(),
  ]);
});
</script>

<template>
  <div class="flex flex-col gap-6">
    <base-page-header>
      <template #title>
        Bookings
      </template>
      <template #description>
        View bookings, their status, & method, and create manual bookings
      </template>
      <template #actions>
        <base-button
          v-if="can(PERMISSIONS_INQUIRIES.CREATE)"
          variant="solid"
          size="md"
          :leading-icon="ICONS.PLUS"
          @click="isCreateModalOpen = true"
        >
          Manual Booking
        </base-button>
      </template>
    </base-page-header>

    <div class="bg-white rounded-xl shadow-sm p-6 flex flex-col gap-4 page-content-height">
      <h2 class="text-base font-semibold">
        Bookings List
      </h2>
      <div class="flex flex-col sm:flex-row justify-between gap-4">
        <div class="flex flex-col sm:flex-row gap-4 sm:gap-2 items-start sm:items-end flex-wrap">
          <base-input
            v-model="state.search"
            name="search"
            placeholder="Search"
            class="w-full sm:w-auto sm:flex-1 sm:max-w-xs"
          />

          <base-date-picker
            v-model="state.dateRange"
            name="dateRange"
            placeholder="Select date range"
            range
            :no-of-months="2"
            class="w-full sm:w-auto sm:flex-1 sm:max-w-xs"
          />
          <base-select
            v-model="state.status"
            name="status"
            placeholder="All statuses"
            :options="statusOptions"
            class="w-full sm:w-auto sm:flex-1 sm:max-w-xs"
          />
          <div class="flex gap-2 w-full sm:w-auto">
            <base-button
              v-if="state.search || state.status || state.dateRange?.start || state.dateRange?.end"
              variant="outline"
              class="flex-1 sm:flex-none"
              @click="clearFilters"
            >
              Clear Filters
            </base-button>
            <base-button
              v-if="can(PERMISSIONS_INQUIRIES.SEARCH)"
              :loading="loading"
              variant="outline"
              class="flex-1 sm:flex-none"
              :leading-icon="ICONS.SEARCH"
              @click="handleSearch"
            >
              Search
            </base-button>
          </div>
        </div>

        <base-button
          variant="ghost"
          :leading-icon="ICONS.DOWNLOAD"
        >
          Export
        </base-button>
      </div>
      <base-table
        :data="inquiriesStore.inquiries.data"
        :columns="columns"
        :loading="loading"
        empty-title="No inquiries found"
        empty-description="New inquiries will appear here once created."
      />
      <base-pagination
        :page="pagination.page"
        :total="Number(inquiriesStore.inquiries.total)"
        :items-per-page="pagination.pageSize"
        :disabled="loading"
        @update:page="(v) => { pagination.page = v; getInquiries(); }"
      />
    </div>
    <inquiry-view-modal
      :open="isModalOpen"
      :inquiry="selectedInquiry"
      @close="closeModal"
      @updated="updateInquiry"
    />
    <inquiry-create-modal
      :open="isCreateModalOpen"
      @close="isCreateModalOpen = false"
      @created="handleInquiryCreated"
    />
  </div>
</template>
