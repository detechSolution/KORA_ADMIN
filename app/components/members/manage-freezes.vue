<script setup lang="ts">
import { computed, ref } from "vue";

import { getHttp } from "~/composables/use-api";
import { getApiErrorMessage } from "~/utils/error";

type Freeze = { id: number; startsOn: string; endsOn: string; status: string };
const props = defineProps<{ member: { membershipFreezes?: Freeze[] } | null }>();
const emit = defineEmits<{ updated: [] }>();
const { can } = usePermission();
const { success, error: showError } = useNotification();
const busy = ref(false);
const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kathmandu", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const freezes = computed(() => (props.member?.membershipFreezes ?? []).filter(freeze => freeze.status === "approved" && freeze.endsOn >= today));

async function processFreeze(id: number, action: "end" | "cancel") {
  if (busy.value || !can("members.update"))
    return;
  busy.value = true;
  try {
    await getHttp().post(`/api/v1/members/membership-freezes/${id}/process`, { action });
    success({ message: "Freeze updated. The membership end date was recalculated." });
    emit("updated");
  }
  catch (error: unknown) {
    showError({ message: getApiErrorMessage(error, "Unable to update the membership freeze.") });
  }
  finally {
    busy.value = false;
  }
}
</script>

<template>
  <div v-if="can('members.update') && freezes.length" class="space-y-3">
    <div
      v-for="freeze in freezes"
      :key="freeze.id"
      class="flex flex-wrap items-center justify-between gap-3 border border-stone-200 rounded-md p-3"
    >
      <span class="text-sm">Freeze: {{ freeze.startsOn }} – {{ freeze.endsOn }}</span>
      <base-button
        :loading="busy"
        :disabled="busy"
        @click="processFreeze(freeze.id, freeze.startsOn > today ? 'cancel' : 'end')"
      >
        {{ freeze.startsOn > today ? 'Cancel freeze' : 'End freeze now' }}
      </base-button>
    </div>
    <p class="text-xs text-secondary-500">
      Ending or cancelling the remaining freeze recalculates the membership end date and emails the member.
    </p>
  </div>
</template>
