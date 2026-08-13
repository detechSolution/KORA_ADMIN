<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";

import { usePagination } from "~/composables/use-pagination";
import { ICONS } from "~/config/icons";
import { useAccessControlStore } from "~/stores/access-control";
import { formatDate } from "~/utils/common";

definePageMeta({ auth: true, layout: "dashboard" });

const validityOptions = [{ label: "Valid", value: "valid" }, { label: "Invalid", value: "invalid" }];
const doorOptions = [
  { label: "Main Gate", value: "1" },
  { label: "Recovery Space", value: "2" },
  { label: "Restaurant", value: "3" },
];
const columns = [
  { id: "client", accessorKey: "fullName", header: "Client" },
  { id: "cardNumber", accessorKey: "cardNumber", header: "Card Number", accessorFn: (row: any) => Number.parseInt(row.cardNumber, 16).toString().padStart(10, "0") },
  { id: "expiryDate", accessorKey: "expiryDate", header: "Expiry Date", accessorFn: (row: any) => formatDate(row.expiryDate) },
  { id: "doorAccess", accessorKey: "doorAccess", header: "Door Access" },
  { id: "validity", accessorKey: "validity", header: "Validity" },
  { id: "actions", accessorKey: "actions", header: "Actions" },
];
const store = useAccessControlStore();
const router = useRouter();
const { pagination } = usePagination(10);
const state = ref({ search: "", expiryDate: null as string | null, validity: null as string | null, doorNumber: null as string | null });
const pendingDeleteId = ref<number | null>(null);
const pendingDeleteName = ref("");
const cards = computed(() => store.accessCards);
const hasActiveFilters = computed(() => Boolean(state.value.search || state.value.expiryDate || state.value.validity || state.value.doorNumber));

function getDoorLabel(door: number | string | undefined): string {
  if (door === undefined)
    return "No Door Access";

  const doorNumber = Number.parseInt(String(door).replace(/\D/g, ""), 10);
  return doorOptions.find(option => Number(option.value) === doorNumber)?.label || String(door);
}

function getAdditionalDoorLabels(doors: Array<number | string>): string {
  return doors.slice(1).map(door => getDoorLabel(door)).join(", ");
}

function editAccessCard(id: number): void {
  router.push(`/access-control/edit-access-card/${id}`);
}

function openDeleteConfirmation(id: number, name: string): void {
  pendingDeleteId.value = id;
  pendingDeleteName.value = name;
}

function closeDeleteConfirmation(): void {
  pendingDeleteId.value = null;
  pendingDeleteName.value = "";
}

async function removeAccessCard(): Promise<void> {
  if (pendingDeleteId.value === null)
    return;
  await store.deleteAccessCard(pendingDeleteId.value);
  closeDeleteConfirmation();
  await fetchCards();
}

async function fetchCards(): Promise<void> {
  const query = {
    page: pagination.value.page,
    limit: pagination.value.pageSize,
    q: state.value.search,
    expiryDate: state.value.expiryDate,
    validity: state.value.validity,
    doorNumber: state.value.doorNumber,
  };
  await store.fetchAccessCards(query);
}
function search(): void {
  pagination.value.page = 1;
  fetchCards();
}
function clearFilters(): void {
  state.value = { search: "", expiryDate: null, validity: null, doorNumber: null };
  search();
}
onMounted(fetchCards);
</script>

<template>
  <div class="flex flex-col gap-6">
    <base-page-header>
      <template #title>
        Access Cards
      </template>
      <template #description>
        View, search, and manage user access cards
      </template>
      <template #actions>
        <NuxtLink to="/access-control/create-access-card">
          <base-button
            variant="solid"
            size="lg"
            :leading-icon="ICONS.PLUS"
          >
            Create Access Card
          </base-button>
        </NuxtLink>
      </template>
    </base-page-header>

    <div class="bg-card rounded-xl p-4 sm:p-6 flex flex-col gap-4">
      <h2 class="text-base font-semibold text-foreground">
        Access Card list
      </h2>
      <div class="flex flex-col sm:flex-row gap-2 items-start sm:items-end flex-wrap">
        <base-input
          v-model="state.search"
          name="search"
          placeholder="Search user or card number"
          :leading-icon="ICONS.SEARCH"
          class="w-full sm:w-auto md:w-64"
          @keyup.enter="search"
        />
        <base-date-picker
          v-model="state.expiryDate"
          name="expiryDate"
          placeholder="Filter by expiry date"
          :no-of-months="2"
          class="w-full sm:w-auto md:w-64"
        />
        <base-select
          v-model="state.validity"
          name="validity"
          :options="validityOptions"
          placeholder="Select validity"
          class="w-full sm:w-auto md:w-64"
        />
        <!-- <base-select
          v-model="state.doorNumber"
          name="doorNumber"
          :options="doorOptions"
          placeholder="Select door access"
          class="w-full sm:w-auto md:w-64"
        /> -->
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
            Clear
          </base-button>
        </div>
      </div>

      <base-table
        :data="cards.data"
        :columns="columns"
        :loading="store.loading"
        empty-title="No access cards found"
      >
        <template #client-cell="{ row }">
          <div class="flex items-center gap-2">
            <base-avatar :name="row.original.fullName" size="sm" />
            <div>
              <p class="text-sm font-medium text-secondary">
                {{ row.original.fullName }}
              </p>
              <p class="text-xs text-secondary-400">
                {{ row.original.phoneNumber }}
              </p>
            </div>
          </div>
        </template>
        <template #doorAccess-cell="{ row }">
          <div class="flex items-center gap-2 whitespace-nowrap">
            <span>{{ getDoorLabel(row.original.doorNumbers?.[0] ?? row.original.doorAccess?.[0]) }}</span><span
              v-if="(row.original.doorNumbers?.length ?? row.original.doorAccess?.length ?? 0) > 1"
            >
              <UTooltip
                arrow
                :text="getAdditionalDoorLabels(row.original.doorNumbers?.length ? row.original.doorNumbers : row.original.doorAccess)"
              >
                <span class="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-secondary-500">
                  +{{ (row.original.doorNumbers?.length ?? row.original.doorAccess?.length ?? 0) - 1 }}
                </span>
              </UTooltip>
            </span>
          </div>
        </template>
        <template #validity-cell="{ row }">
          <base-badge :status="row.original.validity" />
        </template>
        <template #actions-cell="{ row }">
          <base-dropdown-menu :items="[{ label: 'Remove Card Access', class: 'cursor-pointer', onSelect: () => openDeleteConfirmation(row.original.id, row.original.fullName) }, { label: 'Edit Access', class: 'cursor-pointer', onSelect: () => editAccessCard(row.original.id) }]">
            <base-button :icon="ICONS.ELLIPSIS_VERTICAL" variant="ghost" />
          </base-dropdown-menu>
        </template>
      </base-table>
      <base-pagination
        :page="pagination.page"
        :total="cards.meta.total"
        :items-per-page="pagination.pageSize"
        :disabled="store.loading"
        @update:page="(page) => { pagination.page = page; fetchCards(); }"
      />
    </div>

    <base-modal
      :open="pendingDeleteId !== null"
      title="Remove Card Access?"
      :modal-width="420"
      dismissible
      @close="closeDeleteConfirmation"
    >
      <div class="flex flex-col gap-5 p-6">
        <p class="text-sm text-secondary-500">
          Are you sure you want to remove access for {{ pendingDeleteName }}?
        </p>
        <div class="flex justify-end gap-2">
          <base-button variant="outline" @click="closeDeleteConfirmation">
            Cancel
          </base-button>
          <UButton
            color="error"
            variant="solid"
            :loading="store.loading"
            :disabled="store.loading"
            @click="removeAccessCard"
          >
            Remove Access
          </UButton>
        </div>
      </div>
    </base-modal>
  </div>
</template>
