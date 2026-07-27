<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import type { Mail } from "~/types/mail";

import { usePagination } from "~/composables/use-pagination";
import { ICONS } from "~/config/icons";
import { PERMISSIONS_MAILS } from "~/config/permissions";
import { useMailStore } from "~/stores/mail";
import { formatDate } from "~/utils/common";
import { getApiErrorMessage } from "~/utils/error";

definePageMeta({
  auth: true,
  layout: "dashboard",
  permission: "mails.view",
});

type DateRangeFilter = {
  start: string | null;
  end: string | null;
};

const mailStore = useMailStore();
const { pagination } = usePagination();
const { error: showError } = useNotification();
const { can } = usePermission();
const state = ref({
  search: "",
  status: "",
  dateRange: { start: null, end: null } as DateRangeFilter,
});

const statusOptions = [
  { label: "Sent", value: "sent" },
  { label: "Failed", value: "failed" },
];

const columns = ref([
  {
    id: "subject",
    header: "Subject",
    accessorKey: "subject",
  },
  {
    id: "title",
    header: "Title",
    accessorKey: "title",
  },
  {
    id: "sentAt",
    header: "Sent Date",
    accessorKey: "sentAt",
    accessorFn: (row: Mail) => row.sentAt ? formatDate(row.sentAt) : "N/A",
  },
  {
    id: "status",
    header: "Status",
    accessorKey: "status",
  },
]);

const mails = computed(() => mailStore.mails);

async function fetchMails(): Promise<void> {
  try {
    const params = {
      page: pagination.value.page,
      limit: pagination.value.pageSize,
      q: state.value.search,
      status: state.value.status,
      fromDate: state.value.dateRange.start,
      toDate: state.value.dateRange.end,
    };
    await mailStore.fetchMails(params);
  }
  catch (error: unknown) {
    showError({ message: getApiErrorMessage(error, "Failed to load emails") });
  }
}

function handleSearchClick(): void {
  pagination.value.page = 1;
  fetchMails();
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
    || state.value.status
    || state.value.dateRange.start
    || state.value.dateRange.end
  );
}

onMounted(() => {
  fetchMails();
});
</script>

<template>
  <div class="flex flex-col gap-6">
    <base-page-header>
      <template #title>
        Send Email
      </template>
      <template #description>
        View and manage sent emails
      </template>

      <template #actions>
        <Nuxt-Link
          v-if="can(PERMISSIONS_MAILS.CREATE)"
          to="/send-email/create-email"
          class="flex items-center gap-2"
        >
          <base-button
            variant="solid"
            :leading-icon="ICONS.PLUS"
          >
            Create Mail
          </base-button>
        </Nuxt-Link>
      </template>
    </base-page-header>

    <div class="bg-white rounded-xl flex flex-col gap-4 p-4">
      <div class="">
        <h2 class="text-base font-semibold">
          Sent Emails List
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
            class="w-full sm:w-auto sm:flex-1"
          />
          <base-select
            v-model="state.status"
            name="status"
            placeholder="Status"
            :options="statusOptions"
            class="w-full sm:w-auto sm:flex-1 md:w-64"
          />
          <div class="flex gap-2 w-full sm:w-auto">
            <base-button
              variant="outline"
              class="flex-1 sm:flex-none"
              :leading-icon="ICONS.SEARCH"
              :loading="mailStore.loading"
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
      </div>

      <base-table
        :data="mails.data"
        :columns="columns"
        :loading="mailStore.loading"
        empty-title="No emails found"
      >
        <template #status-cell="{ row }">
          <base-badge :color="row.original.status === 'sent' ? 'emerald' : 'red'">
            {{ row.original.status === "sent" ? "Sent" : "Failed" }}
          </base-badge>
        </template>
      </base-table>

      <base-pagination
        :page="pagination.page"
        :total="mails.total"
        :items-per-page="pagination.pageSize"
        :disabled="mailStore.loading"
        @update:page="(v) => { pagination.page = v; fetchMails(); }"
      />
    </div>
  </div>
</template>
