<script setup lang="ts">
import { reactive, ref } from "vue";
import * as z from "zod";

import { useNotification } from "~/composables/use-notification";
import { usePaymentMethodsStore } from "~/stores/payment-methods";
import { getApiErrorMessage, isApiError } from "~/utils/error";

type Props = {
  open: boolean;
};

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "created"): void;
}>();

const paymentMethodsStore = usePaymentMethodsStore();
const { success, error: showError } = useNotification();

const loading = ref(false);
const formRef = ref<InstanceType<typeof UForm> | null>(null);

const apiError = ref<string | null>(null);

const schema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name must be at most 255 characters"),
}).superRefine((data, ctx) => {
  if (apiError.value != null) {
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
});

async function handleCreate(): Promise<void> {
  try {
    await formRef.value?.validate();
  }
  catch {
    return;
  }
  try {
    loading.value = true;
    await paymentMethodsStore.createTransactionPaymentCategory({
      name: state.name!,
    });
    success({ message: "Category created successfully" });
    clearFormData();
    emit("created");
  }
  catch (err: unknown) {
    if (isApiError(err) && err.data?.code === "transaction_payment_categories.name.exists") {
      apiError.value = err.data?.message ?? "This name already exists.";
      formRef.value?.validate();
      return;
    }
    showError({ message: getApiErrorMessage(err, "Failed to create category. Please try again.") });
  }
  finally {
    loading.value = false;
  }
}

function clearFormData(): void {
  state.name = "";
}

function handleClose(): void {
  emit("close");
  clearFormData();
}
</script>

<template>
  <base-modal
    :open="props.open"
    title="Add Category"
    description="Create a new payment category."
    :modal-width="500"
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
      <base-input
        v-model="state.name"
        name="name"
        label="Category Name"
        placeholder="e.g. Net Banking"
        required
        @input="apiError = null"
      />

      <div class="flex justify-end gap-2">
        <base-button
          variant="outline"
          @click="handleClose"
        >
          Cancel
        </base-button>
        <base-button
          :loading="loading"
          @click="handleCreate"
        >
          Create Category
        </base-button>
      </div>
    </UForm>
  </base-modal>
</template>
