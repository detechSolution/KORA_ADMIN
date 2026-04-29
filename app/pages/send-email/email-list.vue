<script setup lang="ts">
import { computed, h, onMounted, ref, resolveComponent } from "vue";

import { usePagination } from "~/composables/use-pagination";
import { ICONS } from "~/config/icons";
import { useMailStore } from "~/stores/mail";
import { formatDateTime } from "~/utils/common";
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

const state = ref({
  search: "",
  status: "",
  dateRange: { start: null, end: null } as DateRangeFilter,
});

const statusOptions = [
  { label: "Draft", value: "draft" },
  { label: "Sent", value: "sent" },
  { label: "Failed", value: "failed" },
];

const columns = ref([
  {
    accessorKey: "title",
    header: "Email",
    cell: ({ row }: { row: any }) => {
      const title = row.original.title ?? row.original.subject ?? "-";
      const subject = row.original.subject ?? row.original.title;
      return h("div", { class: "flex flex-col gap-0.5" }, [
        h("span", { class: "font-medium text-secondary" }, title),
        h("span", { class: "text-xs text-muted-foreground" }, subject || "-"),
      ]);
    },
  },
  {
    accessorKey: "recipients",
    header: "Recipients",
    cell: ({ row }: { row: any }) => {
      const recipients = row.original.recipientsEmails ?? row.original.recipient_emails ?? [];
      if (Array.isArray(recipients) && recipients.length > 0) {
        const first = recipients[0];
        const more = recipients.length - 1;
        return more > 0 ? `${first} +${more} more` : first;
      }
      const recipientCount = row.original.recipient_count;
      return recipientCount ? `${recipientCount} recipients` : "-";
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }: { row: any }) => {
      const rawStatus = String(row.original.status ?? "").toLowerCase();
      const config = rawStatus === "sent"
        ? { label: "Sent", color: "success" }
        : rawStatus === "failed"
          ? { label: "Failed", color: "red" }
          : { label: "Draft", color: "amber" };

      return h(
        resolveComponent("base-badge"),
        { color: config.color },
        () => config.label,
      );
    },
  },
  {
    accessorKey: "created_at",
    header: "Created At",
    cell: ({ row }: { row: any }) => {
      const createdAt = row.original.created_at ?? row.original.sent_at ?? row.original.updated_at ?? null;
      return createdAt ? formatDateTime(createdAt) : "-";
    },
  },
]);

const mails = computed(() => mailStore.mails);

async function fetchMails(): Promise<void> {
  try {
    await mailStore.fetchMails({
      pagination: {
        page: pagination.value.page,
        limit: pagination.value.pageSize,
      },
      search: state.value.search,
      status: state.value.status,
      dateRange: state.value.dateRange,
    });
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
            class="w-full sm:w-auto sm:flex-1 sm:max-w-xs"
            :leading-icon="ICONS.SEARCH"
            @keyup.enter="handleSearchClick"
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
              v-if="hasActiveFilters()"
              variant="outline"
              class="flex-1 sm:flex-none"
              @click="clearFilters"
            >
              Clear Filters
            </base-button>
            <base-button
              variant="outline"
              class="flex-1 sm:flex-none"
              :leading-icon="ICONS.SEARCH"
              :loading="mailStore.loading"
              @click="handleSearchClick"
            >
              Search
            </base-button>
          </div>
        </div>
      </div>

      <base-table
        :data="mails.data"
        :columns="columns"
        :loading="mailStore.loading"
        empty-title="No emails found"
        empty-description="Sent emails will appear here once available."
      />

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
