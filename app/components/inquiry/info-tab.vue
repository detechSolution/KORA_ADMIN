<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import * as z from "zod";

import { useNotification } from "~/composables/use-notification";
import { ICONS } from "~/config/icons";
import { useInquiriesStore } from "~/stores/inquiries";
import { getApiErrorMessage } from "~/utils/error";

type Props = {
  inquiry: any;
};

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "updated"): void;
}>();

const inquiriesStore = useInquiriesStore();
const { success, error: showError } = useNotification();

const sourceOptions = computed(() =>
  inquiriesStore.inquirySources.map(item => ({
    label: item.name,
    value: item.id,
  })),
);

const schema = z.object({
  company_name: z.string().min(1, "Community name is required"),
  contact_name: z.string().min(1, "Contact person is required"),
  email: z.string().min(1, "Email is required").email("Invalid email"),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .regex(/^\d+$/, "Phone must contain only numbers")
    .min(10, "Phone must be at least 10 digits")
    .max(10, "Phone cannot exceed 10 characters"),
  number_of_units: z
    .number()
    .positive("Units must be a valid positive number")
    .nullable()
    .optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  inquiry_source_id: z.number().nullable().optional(),
  notes: z.string().optional(),
});

type Schema = z.output<typeof schema>;

const saving = ref(false);
const formRef = ref<InstanceType<typeof UForm> | null>(null);

const state = reactive<Partial<Schema>>({
  company_name: "",
  contact_name: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  number_of_units: null,
  inquiry_source_id: null,
  notes: "",
});

function syncFromInquiry(inq: any): void {
  if (!inq) {
    return;
  }
  state.company_name = inq.company_name ?? "";
  state.contact_name = inq.contact_name ?? "";
  state.email = inq.email ?? "";
  state.phone = inq.phone ?? "";
  state.address = inq.address ?? "";
  state.city = inq.city ?? "";
  state.state = inq.state ?? "";
  state.number_of_units = inq.number_of_units ?? null;
  state.inquiry_source_id = inq.inquiry_source_id ?? null;
  state.notes = inq.notes ?? "";
}

watch(
  () => props.inquiry,
  inq => syncFromInquiry(inq),
  { immediate: true },
);

async function handleSave(): Promise<void> {
  if (!props.inquiry?.id) {
    return;
  }
  try {
    await formRef.value?.validate();
  }
  catch {
    return;
  }

  try {
    saving.value = true;
    const payload = {
      inquiry_id: props.inquiry.id,
      company_name: state.company_name?.trim() ?? null,
      contact_name: state.contact_name?.trim() ?? null,
      email: state.email?.trim() ?? null,
      phone: state.phone?.trim() ?? null,
      address: state.address?.trim() ?? null,
      city: state.city?.trim() ?? null,
      state: state.state?.trim() ?? null,
      number_of_units: state.number_of_units ?? null,
      inquiry_source_id: state.inquiry_source_id ?? null,
      notes: state.notes?.trim() ?? null,
    };
    await inquiriesStore.updateInquiry(payload);
    success({ message: "Inquiry updated" });
    emit("updated");
  }
  catch (err: unknown) {
    showError({ message: getApiErrorMessage(err, "Failed to update inquiry") });
  }
  finally {
    saving.value = false;
  }
}
</script>

<template>
  <div v-if="!inquiry" class="rounded-xl border border-border bg-card p-6">
    <p class="text-center text-sm text-muted-foreground">
      No inquiry selected
    </p>
  </div>

  <div v-else class="rounded-xl border border-border bg-card p-6">
    <div class="mb-6 flex items-center gap-3 border-b border-border pb-4">
      <div class="rounded-lg bg-primary/10 p-2">
        <UIcon :name="ICONS.EYE" class="h-5 w-5 text-primary" />
      </div>
      <div>
        <h3 class="text-lg font-semibold text-foreground">
          Inquiry details
        </h3>
        <p class="mt-0.5 text-xs text-muted-foreground">
          View and edit inquiry information
        </p>
      </div>
    </div>

    <UForm
      ref="formRef"
      :state="state"
      :schema="schema"
      :validate-on="['input', 'change', 'blur']"
      class="flex flex-col gap-5"
    >
      <div class="grid gap-4 sm:grid-cols-2">
        <base-input
          v-model="state.company_name"
          name="company_name"
          label="Company name"
          placeholder="Company or society name"
          required
        />
        <base-input
          v-model="state.contact_name"
          name="contact_name"
          label="Contact person"
          placeholder="Primary contact name"
          required
        />
        <base-input
          v-model="state.email"
          name="email"
          label="Email"
          type="email"
          placeholder="email@example.com"
          required
        />
        <base-input
          v-model="state.phone"
          name="phone"
          label="Phone"
          type="tel"
          placeholder="e.g. 03001234567"
          required
        />
        <base-input
          v-model="state.address"
          name="address"
          label="Address"
          placeholder="Street address"
        />
        <base-input
          v-model="state.city"
          name="city"
          label="City"
          placeholder="City"
        />
        <base-input
          v-model="state.state"
          name="state"
          label="State"
          placeholder="State / Province"
        />
        <base-input
          v-model="state.number_of_units"
          name="number_of_units"
          label="Number of units"
          type="number"
          placeholder="e.g. 120"
        />
        <base-select
          v-model="state.inquiry_source_id"
          name="inquiry_source_id"
          label="Source"
          placeholder="How did they hear about us?"
          :options="sourceOptions"
        />
      </div>

      <base-input
        v-model="state.notes"
        name="notes"
        label="Notes"
        type="textarea"
        placeholder="Notes about this inquiry..."
      />

      <div class="flex justify-end">
        <base-button
          :loading="saving"
          @click="handleSave"
        >
          Save changes
        </base-button>
      </div>
    </UForm>
  </div>
</template>
