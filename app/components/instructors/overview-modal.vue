<script setup lang="ts">
import { computed, ref, watch } from "vue";

import { useNotification } from "~/composables/use-notification";
import { ICONS } from "~/config/icons";
import { useInstructorsStore } from "~/stores/instructors";
import { formatDate } from "~/utils/common";
import { getApiErrorMessage } from "~/utils/error";

type Props = {
  open?: boolean;
  id: number;
};

const props = withDefaults(defineProps<Props>(), {
  open: false,
});

const emit = defineEmits<{
  (e: "close"): void;
  (e: "edit"): void;
}>();

const { error: showError } = useNotification();
const instructorStore = useInstructorsStore();
const selectedTab = ref("existing");
const loading = ref(false);

const items = [
  { label: "Profile", value: "existing" },
  { label: "Assigned Sessions", value: "assigned" },
  { label: "Upcoming Sessions", value: "upcoming" },
];

const assignedSessions = computed(() => instructorStore.assignedSessions);
const upcomingSessions = computed(() => instructorStore.upComingSessions);
const InstructorDetails = computed(() => instructorStore.InstructorDetails);

const profileInfo = computed(() => {
  if (!InstructorDetails.value)
    return [];

  return [
    { label: "Name", value: InstructorDetails.value?.fullName },
    { label: "Email", value: InstructorDetails.value?.email },
    { label: "Phone", value: InstructorDetails.value?.phoneNumber },
  ];
});

const profileEditInfo = computed(() => {
  if (!InstructorDetails.value)
    return [];

  return [
    { label: "Created By", value: formatDate(InstructorDetails.value?.createdAt as string), avatar: true, icon: ICONS.USER_PLUS },
    { label: "Last Edited By", value: InstructorDetails.value?.updatedBy?.fullName as string, avatar: true, icon: ICONS.USER_PLUS },
    { label: "Last Edit Date", value: formatDate(InstructorDetails.value?.updatedAt as string), avatar: false, icon: ICONS.CALENDAR },
  ];
});

async function fetchInstructorDetails(): Promise<void> {
  try {
    loading.value = true;
    await instructorStore.fetchInstructorsDetails(props.id);
    await instructorStore.fetchAssignedSessions(props.id);
    await instructorStore.fetchUpcomingInstructors(props.id);
  }
  catch (error: unknown) {
    showError({ message: getApiErrorMessage(error, "Failed to load instructor details") });
  }
  finally {
    loading.value = false;
  }
}

watch(
  () => props.open,
  (open: boolean) => {
    if (open && props.id) {
      fetchInstructorDetails();
    }
  },
  { immediate: true },
);

watch(
  () => props.id,
  () => {
    if (props.open && props.id) {
      fetchInstructorDetails();
    }
  },
);
</script>

<template>
  <base-modal
    :open="open"
    title="Instructor Profile"
    :modal-width="800"
    dismissible
    @close="emit('close')"
  >
    <!-- Loading state need to change later -->
    <div v-if="loading" class="p-6 flex items-center justify-center min-h-60">
      <div class="flex flex-col items-center gap-2">
        <UIcon name="i-heroicons-arrow-path" class="animate-spin w-6 h-6" />
        <p class="text-sm text-muted-foreground">
          Loading...
        </p>
      </div>
    </div>

    <base-tabs
      v-else
      v-model="selectedTab"
      :items="items"
      variant="solid"
      class="p-6"
      color="secondary"
    >
      <!-- Profile Tab -->
      <div v-if="selectedTab === 'existing'" class="p-2 flex flex-col gap-4">
        <div class="flex justify-between">
          <div
            v-for="profile in profileInfo"
            :key="profile.label"
          >
            <div class="flex flex-col gap-2">
              <p class="text-xs text-secondary-400 font-normal">
                {{ profile.label }}
              </p>
              <p class="text-sm font-medium">
                {{ profile.value }}
              </p>
            </div>
          </div>
        </div>

        <USeparator />

        <div class="flex justify-between gap-4">
          <div
            v-for="profile in profileEditInfo"
            :key="profile.label"
            class="flex flex-col w-full gap-2 p-3 border border-stone-200 bg-stone-50 rounded-md"
          >
            <div class="text-secondary-400 text-xs flex gap-2 items-center">
              <UIcon :name="profile.icon" class="w-4 h-4" />
              <span>{{ profile.label }}</span>
            </div>
            <div class="flex items-center gap-3">
              <div
                v-if="profile.avatar"
                class="w-5 h-5 rounded-full bg-stone-200 overflow-hidden text-[8px] flex items-center justify-center font-bold text-secondary-500"
              >
                JD
              </div>
              <span class="text-sm font-medium text-secondary-700">{{ profile.value }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Assigned Sessions Tab -->
      <div v-else-if="selectedTab === 'assigned'" class="p-6">
        <div v-if="assignedSessions?.length" class="space-y-2">
          <div
            v-for="session in assignedSessions"
            :key="session.id"
            class="p-3 border border-stone-200 rounded-md flex justify-between items-center"
          >
            <p class="font-medium text-sm text-secondary">
              {{ session.name }}
            </p>
            <p class="text-xs font-normal text-secondary-500">
              {{ formatDate(session.startsAt) }}
            </p>
          </div>
        </div>
        <div v-else class="text-muted-foreground">
          No assigned sessions
        </div>
      </div>

      <!-- Upcoming Sessions Tab -->
      <div v-else-if="selectedTab === 'upcoming'" class="p-6">
        <h3 class="font-semibold mb-4">
          Upcoming Sessions
        </h3>
        <div v-if="upcomingSessions?.length" class="space-y-2">
          <div
            v-for="session in upcomingSessions"
            :key="session.id"
            class="p-3 border border-stone-200 rounded-md flex justify-between items-center"
          >
            <p class="font-medium text-sm text-secondary">
              {{ session.name }}
            </p>
            <p class="text-xs font-normal text-secondary-500">
              {{ formatDate(session.startsAt) }}
            </p>
          </div>
        </div>
        <div v-else class="text-muted-foreground">
          No upcoming sessions
        </div>
      </div>
    </base-tabs>
  </base-modal>
</template>
