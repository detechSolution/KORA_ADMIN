<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import { useNotification } from "~/composables/use-notification";
import { usePagination } from "~/composables/use-pagination";
import { SESSION_TYPE } from "~/config/constants";
import { ICONS } from "~/config/icons";
import { useSessionsStore } from "~/stores/sessions";
import { getApiErrorMessage } from "~/utils/error";

definePageMeta({
  auth: true,
  layout: "dashboard",
  permission: "offerings.sessions.view",
});

const { error: showError } = useNotification();
const sessionsStore = useSessionsStore();
const sessions = computed(() => sessionsStore.sessions);
const { pagination } = usePagination(8);

const state = ref({
  search: "",
  status: "",
  referenceNumber: "",
  selectedSessionType: "",
  referenceDateRange: { start: null, end: null },
  dueDateRange: { start: null, end: null },
});

const sessionTypeOptions = [
  { label: "Class", value: SESSION_TYPE.CLASS },
  { label: "Event", value: SESSION_TYPE.EVENT },
  { label: "Workshop", value: SESSION_TYPE.WORKSHOP },
];

async function loadSessions(): Promise<void> {
  try {
    const params = {
      page: pagination.value.page,
      limit: pagination.value.pageSize,
      q: state.value.search || undefined,
      status: state.value.status === "" ? undefined : state.value.status,
      startDate: state.value.referenceDateRange.start || undefined,
      endDate: state.value.referenceDateRange.end || undefined,
    };
    await sessionsStore.getSessions(params);
  }
  catch (error: unknown) {
    showError({ message: getApiErrorMessage(error, "Failed to load sessions") });
  }
}

onMounted(() => {
  loadSessions();
});
</script>

<template>
  <div class="w-full gap-6 flex flex-col">
    <base-page-header>
      <template #title>
        Sessions
      </template>
      <template #description>
        Manage classes, events and workshops
      </template>
      <template #actions>
        <NuxtLink
          to="/offerings/create-sessions"
        >
          <base-button
            variant="solid"
            size="md"
            :leading-icon="ICONS.PLUS"
          >
            Create Session
          </base-button>
        </NuxtLink>
      </template>
    </base-page-header>

    <div class=" rounded-b-xl flex flex-col gap-4 ">
      <div class="flex flex-col sm:flex-row gap-4 sm:gap-2 items-start sm:items-end flex-wrap">
        <base-input
          v-model="state.referenceNumber"
          :leading-icon="ICONS.SEARCH"
          name="referenceNumber"
          placeholder="Search by reference number"
          class="w-full sm:w-auto sm:flex-1 sm:max-w-xs"
        />
        <base-input
          v-model="state.referenceNumber"
          type="date"
          name="referenceNumber"
          placeholder="Search by reference number"
          class="w-full sm:w-auto sm:flex-1 sm:max-w-xs"
        />
        <base-select
          v-model="state.selectedSessionType"
          name="selectedSessionType"
          placeholder="Select session type"
          class="w-full sm:w-auto sm:flex-1 sm:max-w-xs"
          :options="sessionTypeOptions"
        />

        <base-button
          variant="outline"
          size="md"
          :leading-icon="ICONS.SEARCH"
        >
          Search
        </base-button>
      </div>
    </div>

    <div class=" rounded-b-xl  grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4  gap-4 ">
      <session-card
        v-for="(session, index) in sessions.data"
        :key="index"
        :title="session.name"
        :type="`${session.type[0].toUpperCase()}${session.type.slice(1)}`"
        :trainer="session.instructor"
        :date="session.sessionDate"
        :time="`${session.startTime} - ${session.endTime}`"
        :location="session.venue"
        :price="`Rs. ${session.price}`"
        :capacity="session.capacity"
        :registered="session.registered"
      />
    </div>
    <base-pagination
      :page="pagination.page"
      :total="sessions.meta.total"
      :items-per-page="pagination.pageSize"
      :disabled="sessionsStore.loading"
      @update:page="(v) => { pagination.page = v; loadSessions(); }"
    />
  </div>
</template>
