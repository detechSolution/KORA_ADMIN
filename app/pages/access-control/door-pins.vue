<script setup lang="ts">
import { onMounted, ref } from "vue";

import { getHttp } from "~/composables/use-api";
import { API_ENDPOINTS } from "~/config/constants";
import { ICONS } from "~/config/icons";
import { PERMISSIONS_MEMBERS } from "~/config/permissions";

definePageMeta({ auth: true, layout: "dashboard", permission: PERMISSIONS_MEMBERS.UPDATE });

type DoorStatus = "unknown" | "queued" | "delivered" | "succeeded" | "failed";
type Door = {
  doorNumber: number;
  name: string;
  status: DoorStatus;
  requestedAt: string | null;
  acknowledgedAt: string | null;
};
const http = getHttp();
const doors = ref<Door[]>([]);
const loading = ref(true);
const loadError = ref("");
const selected = ref<Door | null>(null);
const pin = ref("");
const confirmation = ref("");
const showPin = ref(false);
const saving = ref(false);
const formError = ref("");
const notice = ref("");
const labels: Record<DoorStatus, string> = {
  unknown: "No recorded PIN change",
  queued: "Pending controller",
  delivered: "Awaiting confirmation",
  succeeded: "PIN applied",
  failed: "Change failed",
};

async function refresh() {
  loading.value = true;
  loadError.value = "";
  try {
    const response = await http.get<{ data: Door[] }>(API_ENDPOINTS.ACCESS_CONTROL.GET_DOOR_PINS);
    doors.value = response.data;
  }
  catch {
    loadError.value = "Unable to load door PIN status. Try again.";
  }
  finally {
    loading.value = false;
  }
}
function openEditor(door: Door) {
  selected.value = door;
  pin.value = "";
  confirmation.value = "";
  formError.value = "";
  showPin.value = false;
}
function closeEditor() {
  if (saving.value)
    return;
  selected.value = null;
  pin.value = "";
  confirmation.value = "";
  showPin.value = false;
}
async function save() {
  if (!selected.value || saving.value)
    return;
  formError.value = "";
  if (!/^\d{4,8}$/.test(pin.value)) {
    formError.value = "Enter a PIN containing 4 to 8 digits.";
    return;
  }
  if (pin.value !== confirmation.value) {
    formError.value = "The PINs do not match.";
    return;
  }
  saving.value = true;
  try {
    await http.post(API_ENDPOINTS.ACCESS_CONTROL.SET_DOOR_PIN(selected.value.doorNumber), { pin: pin.value });
    notice.value = `PIN change queued for ${selected.value.name}. It takes effect after the controller confirms it.`;
    saving.value = false;
    closeEditor();
    await refresh();
  }
  catch {
    formError.value = "Unable to confirm the PIN request. Close this dialog and refresh the status before trying again.";
  }
  finally {
    saving.value = false;
  }
}
function dateLabel(date: string) {
  return new Date(date).toLocaleString();
}
onMounted(refresh);
</script>

<template>
  <div class="flex flex-col gap-6">
    <base-page-header>
      <template #title>
        Door PINs
      </template>
      <template #description>
        Set and manage keypad PINs for all four doors
      </template>
      <template #actions>
        <base-button
          variant="outline"
          :leading-icon="ICONS.REFRESH_CW"
          :loading="loading"
          :disabled="loading"
          @click="refresh"
        >
          Refresh status
        </base-button>
      </template>
    </base-page-header>

    <p
      v-if="notice"
      role="status"
      class="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800"
    >
      {{ notice }}
    </p>
    <div class="bg-card rounded-xl p-4 sm:p-6 flex flex-col gap-5">
      <div>
        <h2 class="text-base font-semibold text-foreground">
          Door keypad access
        </h2>
        <p class="mt-1 text-sm text-secondary-500">
          Use a 4 to 8 digit PIN. Saved PINs are kept private; enter a new PIN to replace one.
        </p>
      </div>
      <div
        v-if="loadError"
        role="alert"
        class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 p-4 text-sm text-red-700"
      >
        {{ loadError }}
        <base-button variant="outline" @click="refresh">
          Try again
        </base-button>
      </div>
      <p
        v-else-if="loading"
        role="status"
        class="py-8 text-sm text-secondary-500"
      >
        Loading door status�
      </p>
      <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <article
          v-for="door in doors"
          :key="door.doorNumber"
          class="rounded-lg border border-stone-200 p-5 flex flex-col gap-5"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="flex items-center gap-3">
              <UIcon :name="ICONS.DOOR_LOCK" class="size-5 text-primary shrink-0" />
              <div>
                <h3 class="font-semibold text-foreground">
                  {{ door.name }}
                </h3>
                <p class="text-xs text-secondary-500">
                  Door {{ door.doorNumber }}
                </p>
              </div>
            </div>
            <span class="rounded-md px-2 py-1 text-xs font-medium" :class="door.status === 'succeeded' ? 'bg-green-50 text-green-700' : door.status === 'failed' ? 'bg-red-50 text-red-700' : 'bg-stone-100 text-stone-600'">{{ labels[door.status] }}</span>
          </div>
          <div class="text-sm text-secondary-500 min-h-10">
            <p v-if="door.acknowledgedAt">
              Applied {{ dateLabel(door.acknowledgedAt) }}
            </p>
            <p v-else-if="door.requestedAt">
              Last requested {{ dateLabel(door.requestedAt) }}
            </p>
            <p v-else>
              No PIN assignment has been recorded by this system.
            </p>
            <p v-if="door.status === 'failed'" class="mt-1">
              The controller did not apply the latest change. Try setting the PIN again.
            </p>
          </div>
          <base-button
            variant="outline"
            class="self-start"
            @click="openEditor(door)"
          >
            Set / replace PIN
          </base-button>
        </article>
      </div>
    </div>

    <base-modal
      :open="selected !== null"
      :title="`Set PIN � ${selected?.name ?? ''}`"
      :modal-width="480"
      :dismissible="!saving"
      @close="closeEditor"
    >
      <form class="flex flex-col gap-5 p-6" @submit.prevent="save">
        <p class="text-sm text-secondary-500">
          This replaces the door�s emergency keypad PIN once confirmed by the controller.
        </p>
        <label class="flex flex-col gap-2 text-sm font-medium">
          New PIN
          <UInput
            v-model="pin"
            :type="showPin ? 'text' : 'password'"
            inputmode="numeric"
            autocomplete="new-password"
            :maxlength="8"
            :disabled="saving"
            required
            placeholder="4 to 8 digits"
            class="w-full"
          />
        </label>
        <label class="flex flex-col gap-2 text-sm font-medium">
          Confirm PIN
          <UInput
            v-model="confirmation"
            :type="showPin ? 'text' : 'password'"
            inputmode="numeric"
            autocomplete="new-password"
            :maxlength="8"
            :disabled="saving"
            required
            placeholder="Re-enter the new PIN"
            class="w-full"
          />
        </label>
        <label class="flex items-center gap-2 text-sm"><input
          v-model="showPin"
          type="checkbox"
          :disabled="saving"
        >Show entered PINs</label>
        <p
          v-if="formError"
          role="alert"
          class="text-sm text-red-700"
        >
          {{ formError }}
        </p>
        <div class="flex justify-end gap-2">
          <base-button
            variant="outline"
            :disabled="saving"
            @click="closeEditor"
          >
            Cancel
          </base-button>
          <base-button
            type="submit"
            :loading="saving"
            :disabled="saving"
          >
            Save PIN
          </base-button>
        </div>
      </form>
    </base-modal>
  </div>
</template>
