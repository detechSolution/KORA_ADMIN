<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";

import { computed, ref, watch } from "vue";

import type { KoraPass, PassInvitee } from "~/types/kora-passes";

import { useNotification } from "~/composables/use-notification";
import { ICONS } from "~/config/icons";
import { PERMISSIONS_KORA_PASSES } from "~/config/permissions";
import { useKoraPassesStore } from "~/stores/kora-passes";
import { getApiErrorMessage } from "~/utils/error";
import { invitationToday, inviteeStatus } from "~/utils/pass-invitations";

const props = defineProps<{ open: boolean; pass: KoraPass | null }>();
const emit = defineEmits<{ close: [] }>();
const store = useKoraPassesStore();
const { can } = usePermission();
const { success, error: showError } = useNotification();
const invitees = ref<PassInvitee[]>([]);
const total = ref(0);
const page = ref(1);
const loading = ref(false);
const savingId = ref<number | null>(null);
const loadError = ref("");
const search = ref("");
const statusFilter = ref("all");
const dateRange = ref<{ start: string | null; end?: string | null }>({
  start: null,
  end: null,
});
const appliedFilters = ref({
  q: "",
  inviteeStatus: "",
  dateFrom: "",
  dateTo: "",
});
const cancelTarget = ref<PassInvitee | null>(null);
const cancelDialogOpen = computed({
  get: () => cancelTarget.value !== null,
  set: (open: boolean) => {
    if (!open && savingId.value === null)
      cancelTarget.value = null;
  },
});
const emailGuest = ref(true);
const internalReason = ref("");
const cancelError = ref("");
const pageSize = 20;
const tableSkeletonRows = computed(() =>
  Math.max(5, Math.min(pageSize, invitees.value.length || total.value || 5)),
);
const totalPages = computed(() =>
  Math.max(1, Math.ceil(total.value / pageSize)),
);
const statusOptions = [
  { label: "All statuses", value: "all" },
  { label: "Upcoming", value: "upcoming" },
  { label: "Active", value: "active" },
  { label: "Expired", value: "expired" },
  { label: "Cancelled", value: "cancelled" },
];
const columns: TableColumn<PassInvitee>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "email", header: "Email" },
  { accessorKey: "startsOn", header: "Start date" },
  { accessorKey: "endsOn", header: "End date" },
  { accessorKey: "status", header: "Status" },
  { accessorKey: "cancellationReason", header: "Internal reason" },
  { accessorKey: "actions", header: "Actions" },
];
let requestId = 0;
const hasActiveFilters = computed(() =>
  Boolean(
    search.value.trim()
    || statusFilter.value !== "all"
    || dateRange.value.start
    || appliedFilters.value.q
    || appliedFilters.value.inviteeStatus
    || appliedFilters.value.dateFrom,
  ),
);

async function loadInvitees() {
  if (!props.pass || !props.open)
    return;
  const passId = props.pass.id;
  const request = ++requestId;
  loading.value = true;
  loadError.value = "";
  try {
    const result = await store.getInvitees(
      passId,
      page.value,
      pageSize,
      appliedFilters.value,
    );
    if (request !== requestId)
      return;
    total.value = result.meta.total;
    const resultPages = Math.max(1, Math.ceil(result.meta.total / pageSize));
    if (page.value > resultPages) {
      page.value = resultPages;
      await loadInvitees();
      return;
    }
    invitees.value = result.data;
  }
  catch (error: unknown) {
    if (request === requestId) {
      loadError.value = getApiErrorMessage(
        error,
        "Unable to load invitees. Please try again.",
      );
    }
  }
  finally {
    if (request === requestId)
      loading.value = false;
  }
}

watch(
  () => [props.open, props.pass?.id],
  () => {
    ++requestId;
    invitees.value = [];
    total.value = 0;
    page.value = 1;
    search.value = "";
    statusFilter.value = "all";
    dateRange.value = { start: null, end: null };
    appliedFilters.value = {
      q: "",
      inviteeStatus: "",
      dateFrom: "",
      dateTo: "",
    };
    cancelTarget.value = null;
    if (props.open)
      void loadInvitees();
  },
  { immediate: true },
);

function handleSearch() {
  const dateFrom = dateRange.value.start ?? "";
  appliedFilters.value = {
    q: search.value.trim(),
    inviteeStatus:
      statusFilter.value === "all" ? "" : statusFilter.value,
    dateFrom,
    dateTo: dateRange.value.end ?? dateFrom,
  };
  page.value = 1;
  void loadInvitees();
}

function clearFilters() {
  search.value = "";
  statusFilter.value = "all";
  dateRange.value = { start: null, end: null };
  handleSearch();
}

function changePage(nextPage: number) {
  page.value = nextPage;
  void loadInvitees();
}

async function confirmCancellation() {
  if (
    !cancelTarget.value
    || savingId.value
    || !can(PERMISSIONS_KORA_PASSES.UPDATE)
  ) {
    return;
  }
  savingId.value = cancelTarget.value.id;
  cancelError.value = "";
  try {
    const result = await store.updateInvitee(cancelTarget.value.id, {
      status: "cancelled",
      emailGuest: emailGuest.value,
      notes: internalReason.value.trim() || undefined,
    });
    cancelTarget.value = null;
    internalReason.value = "";
    if (emailGuest.value && !result.sentEmail) {
      showError({
        title: "Cancelled; email not sent",
        message:
          "Pass access and discounts ended. Contact the guest directly; existing bookings are unchanged.",
      });
    }
    else {
      success({
        message:
          "Invitation cancelled. Access and discounts ended; existing bookings are unchanged.",
      });
    }
    await loadInvitees();
  }
  catch (error: unknown) {
    cancelError.value = getApiErrorMessage(
      error,
      "Unable to cancel the invitation. Please try again.",
    );
  }
  finally {
    savingId.value = null;
  }
}
</script>

<template>
  <UModal
    :open="open"
    :dismissible="savingId === null"
    :ui="{
      content: 'w-[calc(100vw-2rem)] max-w-6xl max-h-[90vh] overflow-hidden',
      header: 'justify-between',
      body: 'p-4 sm:p-6',
    }"
  >
    <template #title>
      Invitees: {{ pass?.name ?? "" }}
    </template>
    // send thuis to end
    <template #close>
      <UButton
        color="neutral"
        variant="ghost"
        icon="i-lucide-x"
        aria-label="Close invitees"
        @click="emit('close')"
      />
    </template>
    <template #body>
      <div class="space-y-4">
        <p class="text-sm text-stone-600">
          Review everyone invited to this pass. Use search, status and dates to
          narrow the list.
        </p>

        <div class="flex flex-col 2xl:flex-row 2xl:items-end gap-3">
          <div class="min-w-0 flex flex-1 flex-col sm:flex-row flex-wrap items-stretch sm:items-end gap-3">
            <base-input
              v-model="search"
              name="inviteeSearch"
              label="Search"
              placeholder="Name or email"
              class="w-full sm:w-64 sm:flex-none"
              :leading-icon="ICONS.SEARCH"
              @keyup.enter="handleSearch"
            />
            <base-select
              v-model="statusFilter"
              :options="statusOptions"
              name="inviteeStatus"
              label="Status"
              placeholder="All statuses"
              class="w-full sm:w-44 sm:flex-none"
            />
            <base-date-picker
              v-model="dateRange"
              name="inviteeDateRange"
              label="Pass date range"
              placeholder="Filter by pass dates"
              range
              :no-of-months="1"
              class="w-full sm:w-72 sm:flex-none"
            />
            <div class="flex flex-wrap gap-2 w-full sm:w-auto">
              <base-button
                :loading="loading"
                variant="outline"
                class="flex-1 sm:flex-none"
                :leading-icon="ICONS.SEARCH"
                @click="handleSearch"
              >
                Search
              </base-button>
              <base-button
                v-if="hasActiveFilters"
                variant="outline"
                class="flex-1 sm:flex-none"
                @click="clearFilters"
              >
                Clear filters
              </base-button>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between text-sm text-stone-600">
          <span>{{ total }} invitees</span>
        </div>

        <p v-if="loading" role="status" class="sr-only">
          Loading invitees...
        </p>
        <div
          v-if="loadError"
          role="alert"
          class="flex flex-wrap items-center gap-3"
        >
          <p class="text-sm text-red-700">
            {{ loadError }}
          </p>
          <base-button
            variant="outline"
            size="sm"
            @click="loadInvitees"
          >
            Try again
          </base-button>
        </div>
        <base-table
          v-else
          :columns="columns"
          :data="invitees"
          :loading="loading"
          :skeleton-rows="tableSkeletonRows"
          empty-title="No invitees match these filters"
          empty-description="Try another name, email, status or date range."
        >
          <template #name-cell="{ row }">
            <span class="font-medium text-stone-900">{{
              row.original.user.fullName || "Name not provided"
            }}</span>
          </template>
          <template #email-cell="{ row }">
            <span class="break-all">{{ row.original.user.email }}</span>
          </template>
          <template #startsOn-cell="{ row }">
            {{ row.original.startsOn }}
          </template>
          <template #endsOn-cell="{ row }">
            {{ row.original.endsOn }}
          </template>
          <template #status-cell="{ row }">
            <base-badge
              :status="inviteeStatus(
                row.original.status,
                row.original.startsOn,
                row.original.endsOn,
              ).toLowerCase()"
            />
          </template>
          <template #cancellationReason-cell="{ row }">
            <UTooltip
              v-if="row.original.cancellationReason"
              :delay-duration="0"
              arrow
              :text="`Cancellation reason: ${row.original.cancellationReason}`"
              :ui="{ content: 'max-w-xs whitespace-normal break-words' }"
            >
              <button
                type="button"
                class="inline-flex h-8 w-8 items-center justify-center rounded-md text-stone-500 hover:bg-stone-100 hover:text-stone-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                :aria-label="`Show cancellation reason: ${row.original.cancellationReason}`"
              >
                <UIcon :name="ICONS.INFO" class="h-4 w-4" />
              </button>
            </UTooltip>
            <span v-else class="text-stone-400">—</span>
          </template>
          <template #actions-cell="{ row }">
            <base-button
              v-if="
                can(PERMISSIONS_KORA_PASSES.UPDATE)
                  && row.original.status === 'active'
                  && row.original.startsOn > invitationToday()
              "
              size="sm"
              variant="outline"
              :loading="savingId === row.original.id"
              :disabled="savingId !== null"
              @click="
                cancelTarget = row.original;
                emailGuest = true;
                internalReason = '';
                cancelError = '';
              "
            >
              Cancel invitation
            </base-button>
            <span v-else class="text-sm text-stone-400">—</span>
          </template>
        </base-table>

        <nav
          v-if="totalPages > 1"
          aria-label="Invitees pagination"
          class="flex items-center justify-between gap-3"
        >
          <base-button
            size="sm"
            variant="outline"
            :disabled="page === 1 || loading"
            @click="changePage(page - 1)"
          >
            Previous
          </base-button>
          <span class="text-sm text-stone-600">Page {{ page }} of {{ totalPages }}</span>
          <base-button
            size="sm"
            variant="outline"
            :disabled="page >= totalPages || loading"
            @click="changePage(page + 1)"
          >
            Next
          </base-button>
        </nav>
      </div>
    </template>
  </UModal>

  <UModal
    v-model:open="cancelDialogOpen"
    :dismissible="savingId === null"
    :ui="{ content: 'w-[calc(100vw-2rem)] max-w-lg' }"
  >
    <template #title>
      Cancel invitation
    </template>
    <template #body>
      <div class="space-y-4">
        <p class="text-sm text-stone-600">
          {{ cancelTarget?.user.fullName }}’s pass will end immediately.
          Existing bookings stay as they are.
        </p>
        <UCheckbox v-model="emailGuest" label="Email the guest" />
        <UFormField
          label="Internal reason (optional)"
          help="For staff only. This reason is not included in the guest email."
        >
          <UTextarea
            v-model="internalReason"
            class="w-full"
            placeholder="Why is this invitation being cancelled?"
          />
        </UFormField>
        <p
          v-if="cancelError"
          role="alert"
          class="text-sm text-red-700"
        >
          {{ cancelError }}
        </p>
        <div class="flex justify-end gap-2">
          <base-button
            variant="outline"
            :disabled="savingId !== null"
            @click="cancelTarget = null"
          >
            Keep invitation
          </base-button>
          <base-button
            :loading="savingId === cancelTarget?.id"
            :disabled="savingId !== null"
            @click="confirmCancellation"
          >
            Confirm cancellation
          </base-button>
        </div>
      </div>
    </template>
  </UModal>
</template>
