<script setup lang="ts">
import { computed, ref, watch } from "vue";

import { useNotification } from "~/composables/use-notification";
import { ICONS } from "~/config/icons";
import { useSessionsStore } from "~/stores/sessions";
import { getApiErrorMessage } from "~/utils/error";

const props = defineProps<{
  open: boolean;
  session: any;
}>();

const emit = defineEmits(["close", "success"]);

const { success: showSuccess, error: showError } = useNotification();
const sessionsStore = useSessionsStore();
const sessionAttendance = computed(() => {
  const val = sessionsStore.sessionAttendance;
  return Array.isArray(val) ? val : (val?.data || []);
});
const loading = ref(false);

const presentCount = computed(() => sessionAttendance.value.filter((a: any) => a.status === "attended").length);
const totalCount = computed(() => sessionAttendance.value.length);

async function fetchAttendance() {
  if (!props.session?.id)
    return;
  try {
    loading.value = true;
    await sessionsStore.getAttendance(props.session.id);
  }
  catch (error: unknown) {
    showError({ message: getApiErrorMessage(error, "Failed to load attendance") });
  }
  finally {
    loading.value = false;
  }
}

function toggleStatus(id: number, status: "attended" | "no-show") {
  const item = sessionAttendance.value.find(a => a.id === id);
  if (item) {
    item.status = item.status === status ? "pending" : status;
  }
}

async function handleSaveAttendance() {
  try {
    loading.value = true;
    await sessionsStore.saveAttendance(props.session.id, sessionAttendance.value);
    showSuccess({ message: "Attendance saved successfully" });
    emit("success");
    emit("close");
  }
  catch (error: unknown) {
    showError({ message: getApiErrorMessage(error, "Failed to update admin. Please try again.") });
  }
  finally {
    loading.value = false;
  }
}

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase();
}

watch(() => props.open, (newVal) => {
  if (newVal) {
    fetchAttendance();
  }
});
</script>

<template>
  <base-modal
    :open="open"
    title="Attendance"
    :modal-width="700"
    dismissible
    @close="emit('close')"
  >
    <div v-if="session" class="flex flex-col h-full max-h-[85vh]">
      <div class="sticky top-0 z-100 bg-white">
        <!-- Header Session Info -->
        <div class="p-6 border-b border-stone-100 bg-white ">
          <h3 class="text-lg font-bold text-secondary-900">
            {{ session.name }}
          </h3>
          <div class="flex items-center gap-2 mt-1 text-sm text-secondary-400">
            <span>{{ session.sessionDate }}</span>
            <span class="w-1 h-1 bg-secondary-200 rounded-full" />
            <span>{{ session.startTime }} - {{ session.endTime }}</span>
            <span class="w-1 h-1 bg-secondary-200 rounded-full" />
            <div class="flex items-center gap-1">
              <UIcon :name="ICONS.USER" class="w-4 h-4" />
              <span>{{ session.instructor }}</span>
            </div>
          </div>
        </div>

        <!-- Stats Summary -->
        <div class="px-6 py-4 bg-[#F9F6F2]">
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <UIcon :name="ICONS.USERS" class="w-5 h-5" />
            </div>
            <div class="flex-1">
              <div class="flex items-center justify-between mb-1">
                <span class="text-sm font-semibold text-secondary-700">
                  {{ presentCount }}/{{ totalCount }} Present
                </span>
              </div>
              <base-progress
                :value="presentCount"
                :max="totalCount"
                size="sm"
                color="success"
                class="max-w-2xs"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Attendance List -->
      <div class="flex-1 px-6">
        <div v-if="loading" class="py-10 flex flex-col items-center justify-center gap-2 text-secondary-300">
          <UIcon :name="ICONS.REFRESH_CW" class="w-8 h-8 animate-spin" />
          <span class="text-sm">Loading participants...</span>
        </div>

        <div v-else-if="sessionAttendance.length === 0" class="py-10 flex flex-col items-center justify-center gap-2 text-secondary-300">
          <UIcon :name="ICONS.USERS" class="w-8 h-8" />
          <span class="text-sm">No participants found for this session.</span>
        </div>

        <div v-else>
          <div
            v-for="(item, index) in sessionAttendance"
            :key="item.id"
            class="flex flex-col items-center justify-between group hover:bg-stone-50/30 transition-colors rounded-lg"
          >
            <div class="p-3 w-full flex justify-between">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-secondary-500 font-bold text-sm border border-stone-200">
                  {{ getInitials(item.name) }}
                </div>
                <div class="flex flex-col gap-0.5">
                  <div class="flex items-center gap-2">
                    <span class="text-base font-semibold text-secondary-800">{{ item.name }}</span>
                    <base-badge
                      v-if="item.status === 'attended'"
                      color="success"
                      variant="subtle"
                      size="xs"
                      class="font-medium"
                    >
                      Attended
                    </base-badge>
                    <base-badge
                      v-else-if="item.status === 'no-show'"
                      color="red"
                      variant="subtle"
                      size="xs"
                      class="font-medium"
                    >
                      No Show
                    </base-badge>
                  </div>
                  <span class="text-xs text-secondary-400">{{ item.phone }}</span>
                </div>
              </div>

              <div class="flex items-center gap-3">
                <button
                  type="button"
                  class="w-8 h-8 rounded-lg border flex items-center justify-center transition-all"
                  :class="item.status === 'attended'
                    ? 'bg-emerald-300 text-emerald-700 border-emerald-300 shadow-sm'
                    : 'bg-emerald-50 text-emerald-500 border-emerald-500/30 hover:border-emerald-500'"
                  @click="toggleStatus(item.id, 'attended')"
                >
                  <UIcon :name="ICONS.CHECK" class="w-5 h-5" />
                </button>
                <button
                  type="button"
                  class="w-8 h-8 rounded-lg border flex items-center justify-center transition-all"
                  :class="item.status === 'no-show'
                    ? 'bg-red-300 text-red-700 border-red-300 shadow-sm'
                    : 'bg-red-50 text-red-500 border-red-500/30 hover:border-red-500'"
                  @click="toggleStatus(item.id, 'no-show')"
                >
                  <UIcon :name="ICONS.X" class="w-5 h-5" />
                </button>
              </div>
            </div>
            <USeparator v-if="index !== sessionAttendance.length - 1" />
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="py-6 border-t border-stone-200 bg-white flex justify-end shrink-0">
        <base-button
          variant="solid"
          size="md"
          class="bg-stone-900 hover:bg-stone-800 min-w-40"
          :loading="loading"
          @click="handleSaveAttendance"
        >
          Save Attendance
        </base-button>
      </div>
    </div>
  </base-modal>
</template>
