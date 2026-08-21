<script setup lang="ts">
import { computed } from "vue";

import { ICONS } from "~/config/icons";
import { PERMISSIONS_SESSIONS } from "~/config/permissions";
import { getNepalTimestamp } from "~/utils/common";

const props = defineProps<SessionCardProps>();

const emit = defineEmits(["openEditSessionDrawer", "openOverviewModal", "copySession", "openAttendanceModal", "openAddMemberModal"]);

type SessionCardProps = {
  id: number;
  title: string;
  type: string;
  trainer: string;
  date: string;
  time: string;
  location: string;
  price: string;
  capacity: number;
  occupied: number;
  startsAt: string;
  endsAt: string;
  sessionStartTime: string;
  sessionEndTime: string;
  isBookable: boolean;
};

const { can } = usePermission();

const isEnded = computed(() => {
  const endTime = getNepalTimestamp(props.date, props.sessionEndTime);

  if (Number.isNaN(endTime))
    return false;

  return endTime <= Date.now();
});

function handleAttendanceClick() {
  emit("openAttendanceModal", props.id);
}

function handleEditClick() {
  if (isEnded.value || props.occupied > 0)
    return;

  emit("openEditSessionDrawer", props.id);
}
</script>

<template>
  <div class="bg-card rounded-xl box-shadow">
    <div class="p-4 border-b border-stone-100 flex  items-start justify-between">
      <div class="flex flex-col gap-2">
        <h2 class="text-base font-medium">
          {{ title }}
        </h2>
        <p class="text-[10px] text-secondary-500">
          <UIcon :name="ICONS.USER" /> {{ trainer }}
        </p>
      </div>

      <base-badge :status="type">
        {{ type }}
      </base-badge>
    </div>
    <div class="flex p-4 flex-col gap-2 text-xs text-secondary-700">
      <p class="flex items-center gap-2">
        <UIcon :name="ICONS.CALENDAR" class="text-primary" /> {{ date }}
      </p>
      <p class="flex items-center gap-2">
        <UIcon :name="ICONS.LOCATION" class="text-primary" /> {{ location }}
      </p>
      <p class="flex items-center gap-2">
        <UIcon :name="ICONS.CLOCK" class="text-primary" /> {{ formatUtcTime(startsAt) }}
        - {{ formatUtcTime(endsAt) }}
      </p>
    </div>

    <div class="p-4 pt-0">
      <base-progress
        :value="occupied"
        :max="capacity"
        size="sm"
        :color="occupied >= capacity ? 'error' : 'success'"
        label="Occupied"
        show-text
      />
    </div>

    <!-- Footer -->
    <div class="px-4 py-3 border-t border-stone-100 flex items-center justify-between">
      <div class="text-sm font-semibold">
        {{ price }}
      </div>
      <div class="flex items-center gap-3 text-secondary-400">
        <UTooltip v-if="can(PERMISSIONS_SESSIONS.UPDATE)" :text="isEnded ? 'View Attendance (Session has ended)' : 'Attendance'">
          <UIcon
            :name="ICONS.CLIPBOARD_CHECK"
            class="w-4 h-4 cursor-pointer hover:text-primary text-primary transition-colors"
            @click="handleAttendanceClick"
          />
        </UTooltip>
        <UTooltip
          v-if="can(PERMISSIONS_SESSIONS.UPDATE) && !isEnded"
          text="Add Member & Pass Users"
        >
          <UIcon
            :name="ICONS.USER_PLUS"
            class="w-4 h-4 cursor-pointer hover:text-primary transition-colors"
            @click="emit('openAddMemberModal', id)"
          />
        </UTooltip>
        <UTooltip
          v-if="can(PERMISSIONS_SESSIONS.UPDATE) && !isEnded && occupied === 0"
          text="Edit Session"
        >
          <UIcon
            :name="ICONS.EDIT"
            class="w-4 h-4 transition-colors"
            @click="handleEditClick"
          />
        </UTooltip>
        <UTooltip text="Open Overview">
          <UIcon
            :name="ICONS.EYE"
            class="w-4 h-4 cursor-pointer hover:text-primary transition-colors"
            @click="emit('openOverviewModal', id)"
          />
        </UTooltip>
        <UTooltip v-if="can(PERMISSIONS_SESSIONS.CREATE)" text="Copy Session">
          <UIcon
            :name="ICONS.COPY"
            class="w-4 h-4 cursor-pointer hover:text-primary transition-colors"
            @click="emit('copySession', id)"
          />
        </UTooltip>
      </div>
    </div>
  </div>
</template>

<style>
.box-shadow {
  box-shadow: 0px 0px 5px 0px #0000000d;
}
</style>
