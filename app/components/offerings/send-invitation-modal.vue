<script setup lang="ts">
import { getLocalTimeZone, today } from "@internationalized/date";
import { nextTick, reactive, ref, watch } from "vue";
import * as z from "zod";

const props = defineProps<{
  open: boolean;
  pass: any;
  loading?: boolean;
}>();

const emit = defineEmits<{
  (event: "close"): void;
  (event: "send", payload: { passId: number; emails: string[]; fromDate: string; toDate: string }): void;
}>();

const formRef = ref<any>(null);
const minimumInvitationDate = today(getLocalTimeZone()).toString();
const emailError = ref("");

const emailSchema = z.string().trim().email("Enter a valid email address");

const schema = z.object({
  emails: z.array(emailSchema).min(1, "Enter at least one email address"),
  dateRange: z.object({
    start: z.string().nullable(),
    end: z.string().nullable(),
  }).refine(({ start, end }) => Boolean(start && end), "Select a start and end date").refine(({ start }) => !start || start >= minimumInvitationDate, "Start date cannot be in the past").refine(({ start, end }) => !start || !end || end >= start, "End date cannot be before the start date"),
});

const form = reactive<z.output<typeof schema>>({
  emails: [],
  dateRange: {
    start: null,
    end: null,
  },
});

function resetForm() {
  form.emails = [];
  form.dateRange = { start: null, end: null };
  emailError.value = "";
}

async function handleEmailAdd(email: string) {
  if (emailSchema.safeParse(email).success) {
    emailError.value = "";
    return;
  }

  await nextTick();
  form.emails = form.emails.filter(item => item !== email);
  emailError.value = `${email} is not a valid email address`;
}

async function handleSendInvitation() {
  try {
    await formRef.value?.validate();
  }
  catch {
    return;
  }

  if (!props.pass?.id)
    return;

  emit("send", {
    passId: props.pass.id,
    emails: form.emails,
    fromDate: form.dateRange.start as string,
    toDate: form.dateRange.end as string,
  });
}

watch(() => props.open, (open) => {
  if (open)
    resetForm();
});
</script>

<template>
  <base-modal
    :open="open"
    title="Send Invitation"
    :modal-width="600"
    dismissible
    @close="emit('close')"
  >
    <UForm
      ref="formRef"
      :state="form"
      :schema="schema"
      class="flex flex-col gap-6 p-6"
      @submit="handleSendInvitation"
    >
      <UFormField
        name="emails"
        label="Enter Email Addresses"
        :error="emailError || undefined"
        :ui="{
          error: 'mt-1 text-red-500 text-xs',
          label: 'text-sm font-medium text-stone-900',
        }"
      >
        <UInputTags
          v-model="form.emails"
          placeholder="Enter Email addresses.."
          class="w-full"
          size="lg"
          :ui="{
            base: 'min-h-16 ring-stone-300 placeholder:text-stone-400',
          }"
          @add-tag="handleEmailAdd"
        />
      </UFormField>

      <base-date-picker
        v-model="form.dateRange"
        name="dateRange"
        label="Select Invitation Date"
        placeholder="Select date range"
        range
        :min-date="minimumInvitationDate"
        :no-of-months="1"
      />

      <div class="flex justify-end gap-2 pt-1">
        <base-button
          variant="outline"
          size="md"
          :disabled="props.loading"
          @click="emit('close')"
        >
          Cancel
        </base-button>
        <base-button
          type="submit"
          variant="solid"
          size="md"
          class="bg-stone-900 hover:bg-stone-800"
          :loading="props.loading"
          :disabled="props.loading"
        >
          Send Invitation
        </base-button>
      </div>
    </UForm>
  </base-modal>
</template>
