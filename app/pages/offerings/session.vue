<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";

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

const router = useRouter();
const loading = ref(false);
const { error: showError } = useNotification();
const sessionsStore = useSessionsStore();
const sessions = computed(() => sessionsStore.sessions);
const { pagination } = usePagination(8);
const isSessionEditDrawerOpen = ref(false);
const isSessionOverviewModalOpen = ref(false);
const isAttendanceModalOpen = ref(false);
const isAddMemberModalOpen = ref(false);
const selectedSession = ref(null);

const state = ref({
  search: "",
  status: "",
  referenceNumber: "",
  selectedSessionType: "",
  referenceDateRange: { start: null, end: null },
});

const sessionTypeOptions = [
  { label: "Class", value: SESSION_TYPE.CLASS },
  { label: "Event", value: SESSION_TYPE.EVENT },
  { label: "Workshop", value: SESSION_TYPE.WORKSHOP },
];

async function loadSessions(): Promise<void> {
  try {
    loading.value = true;
    const params = {
      page: pagination.value.page,
      limit: pagination.value.pageSize,
      q: state.value.search || undefined,
      status: state.value.status === "" ? undefined : state.value.status,
      startDate: state.value.referenceDateRange.start || undefined,
      endDate: state.value.referenceDateRange.end || undefined,
      type: state.value.selectedSessionType || undefined,
    };
    await sessionsStore.getSessions(params);
  }
  catch (error: unknown) {
    showError({ message: getApiErrorMessage(error, "Failed to load sessions") });
  }
  finally {
    loading.value = false;
  }
}

function handleSearch() {
  pagination.value.page = 1;
  loadSessions();
}

function handleOpenEditSessionDrawer(id: number) {
  isSessionEditDrawerOpen.value = true;
  const session = sessions.value.data.find((s: any) => s.id === id);
  selectedSession.value = session;
}

function handleOpenOverviewModal(id: number) {
  const session = sessions.value.data.find((s: any) => s.id === id);
  selectedSession.value = session;
  isSessionOverviewModalOpen.value = true;
}

function handleEditFromOverview(id: number) {
  isSessionOverviewModalOpen.value = false;
  handleOpenEditSessionDrawer(id);
}

function handleCopySession(id: number) {
  const session = sessions.value.data.find((s: any) => s.id === id);
  sessionsStore.sessionToCopy = session;
  router.push("/offerings/create-sessions");
}

function handleOpenAttendanceModal(id: number) {
  const session = sessions.value.data.find((s: any) => s.id === id);
  selectedSession.value = session;
  isAttendanceModalOpen.value = true;
}

function handleOpenAddMemberModal(id: number) {
  const session = sessions.value.data.find((s: any) => s.id === id);
  selectedSession.value = session;
  isAddMemberModalOpen.value = true;
}

function clearFilters(): void {
  state.value.search = "";
  state.value.status = "";
  state.value.referenceDateRange = { start: null, end: null };
  state.value.selectedSessionType = "";
  pagination.value.page = 1;
  loadSessions();
}

function hasActiveFilters(): boolean {
  return !!(state.value.search || state.value.status || state.value.referenceDateRange.start || state.value.referenceDateRange.end || state.value.selectedSessionType);
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
          v-model="state.search"
          :leading-icon="ICONS.SEARCH"
          name="search"
          placeholder="Search by session"
          class="w-full sm:w-auto sm:flex-1 sm:max-w-xs"
          @keyup.enter="handleSearch"
        />
        <base-date-picker
          v-model="state.referenceDateRange"
          name="referenceDateRange"
          placeholder="Filter by date"
          range
          :no-of-months="2"
          class="w-full sm:w-auto sm:flex-1 sm:max-w-xs"
        />
        <base-select
          v-model="state.selectedSessionType"
          name="selectedSessionType"
          placeholder="Select session type"
          class="w-full sm:w-auto sm:flex-1 sm:max-w-xs"
          :options="sessionTypeOptions"
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
            :loading="loading"
            class="flex-1 sm:flex-none"
            :leading-icon="ICONS.SEARCH"
            @click="handleSearch"
          >
            Search
          </base-button>
        </div>
      </div>
    </div>

    <div class=" rounded-b-xl  grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4  gap-4 ">
      <!-- Skeleton Loading -->
      <session-card-skeleton
        v-if="loading"
        :count="pagination.pageSize"
      />

      <!-- Session Cards -->
      <session-card
        v-for="(session, index) in sessions.data"
        v-else
        :id="session.id"
        :key="index"
        :title="session.name"
        :type="`${session.type[0].toUpperCase()}${session.type.slice(1)}`"
        :trainer="session.instructor"
        :date="session.sessionDate"
        :time="`${session.startTime} - ${session.endTime}`"
        :location="session.venue"
        :price="`Rs. ${session.price}`"
        :capacity="session.capacity"
        :occupied="session.occupied"
        @open-edit-session-drawer="handleOpenEditSessionDrawer"
        @open-overview-modal="handleOpenOverviewModal"
        @copy-session="handleCopySession"
        @open-attendance-modal="handleOpenAttendanceModal"
        @open-add-member-modal="handleOpenAddMemberModal"
      />
    </div>
    <base-pagination
      :page="pagination.page"
      :total="sessions.meta.total"
      :items-per-page="pagination.pageSize"
      :disabled="sessionsStore.loading"
      @update:page="(v) => { pagination.page = v; loadSessions(); }"
    />

    <OfferingsSessionsEdit
      :open="isSessionEditDrawerOpen"
      :session="selectedSession"
      @close-session-drawer="isSessionEditDrawerOpen = false"
      @update-session-list="loadSessions()"
    />

    <SessionOverviewModal
      :open="isSessionOverviewModalOpen"
      :session="selectedSession"
      @close="isSessionOverviewModalOpen = false"
      @edit="handleEditFromOverview"
    />

    <SessionAttendanceModal
      :open="isAttendanceModalOpen"
      :session="selectedSession"
      @close="isAttendanceModalOpen = false"
    />

    <SessionAddMemberModal
      :open="isAddMemberModalOpen"
      :session="selectedSession"
      @close="isAddMemberModalOpen = false"
    />
  </div>
</template>
