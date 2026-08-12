<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import { usePagination } from "~/composables/use-pagination";
import { ICONS } from "~/config/icons";
import { useAccessControlStore } from "~/stores/access-control";

definePageMeta({ auth: true, layout: "dashboard" });

const typeOptions = [{ label: "Member", value: "member" }, { label: "Non-Member", value: "non_member" }];
const gateOptions = [1, 2, 3, 4].map(doorNumber => ({ label: `Door ${doorNumber}`, value: String(doorNumber) }));
const columns = [
  { id: "client", accessorKey: "clientName", header: "User" },
  { id: "type", accessorKey: "type", header: "Type" },
  { id: "gate", accessorKey: "gate", header: "Gate" },
  { id: "entryMethod", accessorKey: "entryMethod", header: "Entry Method" },
  { id: "entryDateTime", accessorKey: "entryDateTime", header: "Entry Date & Time" },
];
const store = useAccessControlStore();
const { pagination } = usePagination(10);
const state = ref({ search: "", entryDate: null as string | null, type: null as string | null, gate: null as string | null });
const logs = computed(() => store.accessLogs);
const hasActiveFilters = computed(() => Boolean(state.value.search || state.value.entryDate || state.value.type || state.value.gate));

async function fetchLogs(): Promise<void> {
  await store.fetchAccessLogs({ page: pagination.value.page, limit: pagination.value.pageSize, q: state.value.search, entryDate: state.value.entryDate, type: state.value.type, gate: state.value.gate });
}
function search(): void {
  pagination.value.page = 1;
  fetchLogs();
}
function clearFilters(): void {
  state.value = { search: "", entryDate: null, type: null, gate: null };
  search();
}
onMounted(fetchLogs);
</script>

<template>
  <div class="flex flex-col gap-6">
    <base-page-header>
      <template #title>
        Access Logs
      </template>
      <template #description>
        View access logs based on gate entries
      </template>
    </base-page-header>

    <div class="bg-card rounded-xl p-4 sm:p-6 page-content-height flex flex-col gap-4">
      <div class="flex flex-col sm:flex-row gap-2 items-start sm:items-end flex-wrap">
        <base-input
          v-model="state.search"
          name="search"
          placeholder="Search"
          :leading-icon="ICONS.SEARCH"
          class="w-full sm:w-auto md:w-64"
          @keyup.enter="search"
        />
        <base-date-picker
          v-model="state.entryDate"
          name="entryDate"
          placeholder="Filter by entry date"
          :no-of-months="1"
          class="w-full sm:w-auto md:w-64"
        />
        <base-select
          v-model="state.type"
          name="type"
          :options="typeOptions"
          placeholder="Select type"
          class="w-full sm:w-auto md:w-64"
        />
        <base-select
          v-model="state.gate"
          name="gate"
          :options="gateOptions"
          placeholder="Select gate"
          class="w-full sm:w-auto md:w-64"
        />
        <div class="flex gap-2 w-full sm:w-auto">
          <base-button
            variant="outline"
            :leading-icon="ICONS.SEARCH"
            class="flex-1 sm:flex-none"
            @click="search"
          >
            Search
          </base-button>
          <base-button
            v-if="hasActiveFilters"
            variant="outline"
            class="flex-1 sm:flex-none"
            @click="clearFilters"
          >
            Clear Filters
          </base-button>
        </div>
      </div>

      <base-table
        :data="logs.data"
        :columns="columns"
        :loading="store.loading"
        empty-title="No access logs found"
      >
        <template #client-cell="{ row }">
          <div class="flex items-center gap-2">
            <base-avatar :name="row.original.clientName" size="sm" />
            <div>
              <p class="text-sm font-medium text-secondary">
                {{ row.original.clientName }}
              </p>
            </div>
          </div>
        </template>
        <template #type-cell="{ row }">
          <base-badge :status="row.original.type" />
        </template>
        <template #eventName-cell="{ row }">
          <div>
            <p class="text-sm text-secondary">
              {{ row.original.eventName }}
            </p><p class="text-xs text-secondary-400">
              {{ row.original.direction }}{{ row.original.cardNumber ? ` · ${row.original.cardNumber}` : "" }}
            </p>
          </div>
        </template>
        <template #entryDateTime-cell="{ row }">
          <div>
            <p class="text-sm text-secondary">
              {{ formatTime(row.original.entryDateTime) }}
            </p>
            <p class="text-xs text-secondary-500">
              {{ formatDate(row.original.entryDateTime) }}
            </p>
          </div>
        </template>
      </base-table>
      <base-pagination
        :page="pagination.page"
        :total="logs.meta.total"
        :items-per-page="pagination.pageSize"
        :disabled="store.loading"
        @update:page="(page) => { pagination.page = page; fetchLogs(); }"
      />
    </div>
  </div>
</template>
