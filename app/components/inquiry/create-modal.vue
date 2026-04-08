<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import * as z from "zod";

import { useNotification } from "~/composables/use-notification";
import { useInquiriesStore } from "~/stores/inquiries";
import { getApiErrorMessage } from "~/utils/error";

type Props = {
  open: boolean;
};

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "created"): void;
}>();

const inquiriesStore = useInquiriesStore();
const { success, error: showError } = useNotification();

const loading = ref(false);
const formRef = ref<InstanceType<typeof UForm> | null>(null);

const inquirySourceOptions = computed(() =>
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

const state = reactive<Partial<Schema>>({
  company_name: "",
  contact_name: "",
  email: "",
  phone: "",
  number_of_units: null,
  address: "",
  city: "",
  state: "",
  inquiry_source_id: null,
  notes: "",
});

async function handleCreateInquiry(): Promise<void> {
  try {
    await formRef.value?.validate();
  }
  catch {
    return;
  }
  try {
    loading.value = true;
    const payload = {
      company_name: state.company_name!,
      contact_name: state.contact_name!,
      email: state.email!,
      phone: state.phone!,
      address: state.address || "",
      city: state.city || "",
      state: state.state || "",
      number_of_units: state.number_of_units ?? null,
      inquiry_source_id: state.inquiry_source_id ?? null,
      notes: state.notes ?? "",
    };

    await inquiriesStore.createInquiry(payload);
    success({ message: "Inquiry created successfully" });
    clearFormData();
    emit("created");
  }
  catch (error: unknown) {
    showError({ message: getApiErrorMessage(error, "Failed to create inquiry. Please try again.") });
  }
  finally {
    loading.value = false;
  }
}

function clearFormData(): void {
  state.company_name = "";
  state.contact_name = "";
  state.email = "";
  state.phone = "";
  state.number_of_units = null;
  state.address = "";
  state.city = "";
  state.state = "";
  state.inquiry_source_id = null;
  state.notes = "";
}

function handleClose(): void {
  emit("close");
  clearFormData();
}
</script>

<template>
  <base-modal
    :open="props.open"
    title="Create inquiry"
    description="Capture a new community inquiry to track in the funnel."
    :modal-width="800"
    dismissible
    @close="handleClose"
  >
    <UForm
      :key="`inquiry-form-${props.open}`"
      ref="formRef"
      :state="state"
      :schema="schema"
      class="flex flex-col gap-4"
      :validate-on="['input', 'change', 'blur']"
    >
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <base-input
          v-model="state.company_name"
          name="company_name"
          label="Community Name"
          placeholder="Enter community or society name"
          required
        />
        <base-input
          v-model="state.contact_name"
          name="contact_name"
          label="Contact Person"
          placeholder="Primary contact name"
          required
        />
        <base-input
          v-model="state.phone"
          name="phone"
          label="Phone"
          placeholder="Contact phone number"
          type="tel"
          required
        />
        <base-input
          v-model="state.email"
          name="email"
          label="Email"
          placeholder="contact@example.com"
          type="email"
          required
        />
        <base-input
          v-model="state.number_of_units"
          type="number"
          name="number_of_units"
          label="Declared Units"
          placeholder="e.g. 120"
        />
        <base-input
          v-model="state.address"
          name="address"
          label="Address"
          placeholder="Street address (optional)"
        />
        <base-input
          v-model="state.city"
          name="city"
          label="City"
          placeholder="City (optional)"
        />
        <base-input
          v-model="state.state"
          name="state"
          label="State"
          placeholder="State (optional)"
        />
        <base-select
          v-model="state.inquiry_source_id"
          name="inquiry_source_id"
          label="Inquiry Source"
          placeholder="How did they hear about Baha?"
          :options="inquirySourceOptions"
        />
        <div class="md:col-span-2">
          <base-input
            v-model="state.notes"
            name="notes"
            label="Notes"
            placeholder="Add any notes about this inquiry..."
            type="textarea"
          />
        </div>
      </div>

      <div class="flex justify-end gap-2 border-t border-border pt-4">
        <base-button variant="outline" @click="handleClose">
          Cancel
        </base-button>
        <base-button
          :loading="loading"
          @click="handleCreateInquiry"
        >
          Create inquiry
        </base-button>
      </div>
    </UForm>
  </base-modal>
</template>
