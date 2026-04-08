<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import * as z from "zod";

import { useNotification } from "~/composables/use-notification";
import { usePaymentMethodsStore } from "~/stores/payment-methods";
import { getApiErrorMessage, isApiError } from "~/utils/error";

type Props = {
  open: boolean;
  categories: any[];
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
  category_id: z.number({ message: "Category is required" }).min(1, "Category is required").nullable().refine(v => v != null, "Category is required"),
  is_active: z.boolean({ message: "Status must be enabled or disabled" }),
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
  category_id: null,
  is_active: true,
});

const categoryOptions = computed(() =>
  props.categories.map((c: any) => ({
    label: c.category_name,
    value: c.id,
  })),
);

watch(
  () => [props.open] as const,
  ([open]) => {
    if (open) {
      state.name = "";
      state.is_active = true;
    }
  },
  { immediate: true },
);

async function handleCreate(): Promise<void> {
  try {
    await formRef.value?.validate();
  }
  catch {
    return;
  }
  try {
    loading.value = true;
    await paymentMethodsStore.createTransactionPaymentMethod({
      name: state.name!,
      category_id: state.category_id!,
      is_active: state.is_active!,
    });
    success({ message: "Payment method created successfully" });
    emit("created");
  }
  catch (err: unknown) {
    if (isApiError(err) && err.data?.code === "transaction_payment_methods.name.exists") {
      apiError.value = err.data?.message ?? "This name already exists.";
      formRef.value?.validate();
      return;
    }
    showError({ message: getApiErrorMessage(err, "Failed to create payment method. Please try again.") });
  }
  finally {
    loading.value = false;
  }
}

function handleClose(): void {
  emit("close");
}
</script>

<template>
  <base-modal
    :open="props.open"
    title="Add Payment Method"
    description="Create a new payment method in the selected category."
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
      <base-select
        v-model="state.category_id"
        name="category_id"
        label="Category"
        placeholder="Select category"
        :options="categoryOptions"
        required
      />
      <base-input
        v-model="state.name"
        name="name"
        label="Method Name"
        placeholder="e.g. Bank"
        required
        @input="apiError = null"
      />
      <base-switch
        v-model="state.is_active"
        name="is_active"
        label="Status"
        on-label="Enabled"
        off-label="Disabled"
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
          Create Method
        </base-button>
      </div>
    </UForm>
  </base-modal>
</template>
