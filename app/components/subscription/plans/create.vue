<script setup lang="ts">
import { nextTick, reactive, ref } from "vue";
import * as z from "zod";

import { useNotification } from "~/composables/use-notification";
import { useSubscriptionsStore } from "~/stores/subscriptions";
import { getApiErrorMessage } from "~/utils/error";

type Props = {
  open: boolean;
};

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "created"): void;
}>();

const subscriptionsStore = useSubscriptionsStore();
const { success, error: showError } = useNotification();

const loading = ref(false);
const apiError = ref<string | null>(null);
const formRef = ref<InstanceType<typeof UForm> | null>(null);
const hasValidated = ref(false);

const intervalOptions = [
  { label: "Monthly", value: "MONTHLY" },
  { label: "Yearly", value: "YEARLY" },
  { label: "Quarterly", value: "QUARTERLY" },
  { label: "Custom", value: "CUSTOM" },
];

const schema = z.object({
  name: z.string().min(1, "Plan name is required"),
  description: z.string().min(1, "Description is required"),
  price: z.string()
    .min(1, "Price is required")
    .refine((value) => {
      const numeric = Number(value);
      return !Number.isNaN(numeric) && numeric >= 0;
    }, "Price must be a valid non-negative number"),
  interval: z.string().min(1, "Frequency is required"),
  is_active: z.boolean({ message: "Status must be enabled or disabled" }),
}).superRefine((data, ctx) => {
  if (apiError.value) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["name"],
      message: apiError.value,
    });
  }
});

type Schema = z.output<typeof schema>;

const state = reactive<Partial<Schema>>({
  name: "",
  description: "",
  price: "",
  interval: "MONTHLY",
  is_active: true,
});

function setApiError(error: string): void {
  apiError.value = error;
}

async function clearApiError(): Promise<void> {
  apiError.value = null;
  await nextTick();
  if (hasValidated.value && formRef.value) {
    formRef.value.validate();
  }
}

async function handleCreateSubscription(): Promise<void> {
  try {
    await formRef.value?.validate();
  }
  catch {
    return;
  }

  try {
    loading.value = true;
    clearApiError();

    const payload = {
      name: state.name || "",
      description: state.description || "",
      price: state.price ? Number(state.price) : 0,
      interval: state.interval || "",
      is_active: state.is_active,
    };

    await subscriptionsStore.createSubscriptionPlan(payload);
    success({ message: "Subscription created successfully" });

    // Reset form
    state.name = "";
    state.description = "";
    state.price = "";
    state.interval = "MONTHLY";
    state.is_active = true;
    apiError.value = null;
    hasValidated.value = false;

    emit("created");
  }
  catch (error: unknown) {
    const message = getApiErrorMessage(error, "Failed to create subscription. Please try again.");
    if (message !== "Failed to create subscription. Please try again.") {
      setApiError(message);
      formRef.value?.validate();
      return;
    }
    showError({ message });
  }
  finally {
    loading.value = false;
  }
}

function handleClose(): void {
  emit("close");
  state.name = "";
  state.description = "";
  state.price = "";
  state.interval = "MONTHLY";
  state.is_active = true;
  apiError.value = null;
  hasValidated.value = false;
}
</script>

<template>
  <base-modal
    :open="props.open"
    title="Create Subscription"
    description="Fill in the details to create a new subscription plan"
    :modal-width="700"
    dismissible
    @close="handleClose"
  >
    <UForm
      ref="formRef"
      :state="state"
      :schema="schema"
      :validate-on="['input', 'change', 'blur']"
      class="flex flex-col gap-4"
    >
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <base-input
          v-model="state.name"
          name="name"
          label="Plan Name"
          placeholder="Enter plan name"
          required
          @input="clearApiError"
        />
        <base-select
          v-model="state.interval"
          name="interval"
          label="Frequency"
          placeholder="Select frequency"
          :options="intervalOptions"
          required
        />
        <base-input
          v-model="state.price"
          name="price"
          label="Price"
          placeholder="Enter price"
          type="text"
          required
          @input="clearApiError"
        />
        <base-switch
          v-model="state.is_active"
          name="is_active"
          label="Status"
          on-label="Active"
          off-label="Disabled"
        />
        <div class="md:col-span-2">
          <base-input
            v-model="state.description"
            name="description"
            label="Description"
            placeholder="Describe this plan"
            type="textarea"
            required
            @input="clearApiError"
          />
        </div>
      </div>

      <div class="flex justify-end gap-2">
        <base-button
          variant="outline"
          @click="handleClose"
        >
          Cancel
        </base-button>
        <base-button
          type="submit"
          :loading="loading"
          @click="handleCreateSubscription"
        >
          Create Subscription
        </base-button>
      </div>
    </UForm>
  </base-modal>
</template>
