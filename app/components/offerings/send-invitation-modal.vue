<script setup lang="ts">
import type { Form } from "@nuxt/ui";

import { reactive, ref, watch } from "vue";

import type {
  InvitationRequest,
  InvitationResult,
  KoraPass,
} from "~/types/kora-passes";

import { invitationSchema, invitationToday } from "~/utils/pass-invitations";

const props = defineProps<{
  open: boolean;
  pass: KoraPass | null;
  loading?: boolean;
  result: InvitationResult | null;
}>();
const emit = defineEmits<{ close: []; send: [payload: InvitationRequest] }>();
const formRef = ref<Form<typeof invitationSchema> | null>(null);
const minimumInvitationDate = invitationToday();
const form = reactive({ guests: [{ fullName: "", email: "" }], fromDate: "" });

watch(
  () => props.open,
  (open) => {
    if (open) {
      form.guests = [{ fullName: "", email: "" }];
      form.fromDate = "";
    }
  },
);
watch(
  () => props.result,
  (result) => {
    if (result) {
      const granted = new Set(
        result.granted.map(guest => guest.email.toLowerCase()),
      );
      form.guests = form.guests.filter(
        guest => !granted.has(guest.email.trim().toLowerCase()),
      );
    }
  },
);
async function handleSendInvitation() {
  if (props.loading || !props.pass)
    return;
  const result = invitationSchema.safeParse(form);
  if (!result.success) {
    await formRef.value?.validate().catch(() => undefined);
    return;
  }
  emit("send", { passId: props.pass.id, ...result.data });
}
</script>

<template>
  <base-modal
    :open="open"
    title="Send invitation"
    :modal-width="700"
    :dismissible="!loading"
    @close="!loading && emit('close')"
  >
    <UForm
      ref="formRef"
      :state="form"
      :schema="invitationSchema"
      class="flex flex-col gap-4 p-5 sm:p-6"
      @submit="handleSendInvitation"
    >
      <p class="text-sm text-stone-600">
        Invite guests to {{ pass?.name }}. Each guest receives full entry on
        their pass dates; classes, spa and events still need a booking.
      </p>
      <div
        v-if="result"
        role="status"
        class="space-y-2 text-sm"
      >
        <p
          v-for="guest in result.granted"
          :key="guest.email"
          :class="guest.sentEmail ? 'text-green-800' : 'text-amber-800'"
        >
          {{ guest.email }}:
          {{
            guest.sentEmail
              ? "Pass granted and email sent."
              : "Pass granted, but the email was not sent. Contact the guest directly; do not invite them again."
          }}
        </p>
        <p
          v-for="guest in result.skipped"
          :key="guest.email"
          class="text-red-700"
        >
          {{ guest.email }}: {{ guest.reason }}
        </p>
      </div>
      <UFormField
        name="guests"
        label="Guests"
        required
      >
        <div class="space-y-4">
          <div
            v-for="(guest, index) in form.guests"
            :key="index"
            class="grid grid-cols-1 sm:grid-cols-2 gap-3 border-b border-stone-200 pb-4"
          >
            <base-input
              v-model="guest.fullName"
              :name="`guests.${index}.fullName`"
              :label="`Guest ${index + 1} name`"
              required
              :disabled="loading"
              placeholder="Full name"
            />
            <base-input
              v-model="guest.email"
              :name="`guests.${index}.email`"
              label="Email"
              type="email"
              required
              :disabled="loading"
              placeholder="guest@example.com"
            />
            <base-button
              v-if="form.guests.length > 1"
              variant="link"
              size="sm"
              class="sm:col-span-2 justify-self-end"
              :disabled="loading"
              :aria-label="`Remove guest ${index + 1}`"
              @click="form.guests.splice(index, 1)"
            >
              Remove guest
            </base-button>
          </div>
          <base-button
            variant="outline"
            size="sm"
            :disabled="loading"
            @click="form.guests.push({ fullName: '', email: '' })"
          >
            Add another guest
          </base-button>
        </div>
      </UFormField>
      <base-date-picker
        :model-value="form.fromDate"
        name="fromDate"
        label="Start date"
        required
        :min-date="minimumInvitationDate"
        :no-of-months="1"
        :disabled="loading"
        @update:model-value="
          (value) => (form.fromDate = typeof value === 'string' ? value : '')
        "
      />
      <p class="text-sm text-stone-600">
        This pass is valid for {{ pass?.numberOfDays }} days. Its end date is
        calculated automatically from the start date.
      </p>
      <div class="flex flex-wrap justify-end gap-2">
        <base-button
          variant="outline"
          size="md"
          :disabled="loading"
          @click="emit('close')"
        >
          Close
        </base-button>
        <base-button
          type="submit"
          size="md"
          :loading="loading"
          :disabled="loading || !form.guests.length"
        >
          Send invitation
        </base-button>
      </div>
    </UForm>
  </base-modal>
</template>
