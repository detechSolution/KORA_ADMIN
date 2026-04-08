<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import * as z from "zod";

import { useNotification } from "~/composables/use-notification";
import { usePaymentMethodsStore } from "~/stores/payment-methods";
import { getApiErrorMessage, isApiError } from "~/utils/error";

type Props = {
  open: boolean;
  method: any;
  categories: any[];
};

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "updated"): void;
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

const state = reactive<{
  name: string;
  category_id: number | null;
  is_active: boolean;
}>({
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
  () => props.method,
  (method) => {
    if (method) {
      state.name = method.name;
      state.category_id = method.category_id;
      state.is_active = method.is_active;
    }
  },
  { immediate: true },
);

async function handleUpdate(): Promise<void> {
  try {
    await formRef.value?.validate();
  }
  catch {
    return;
  }
  try {
    loading.value = true;
    await paymentMethodsStore.updateTransactionPaymentMethod({
      payment_method_id: props.method.id,
      name: state.name,
      category_id: state.category_id!,
      is_active: state.is_active,
    });
    success({ message: "Payment method updated successfully" });
    emit("updated");
  }
  catch (err: unknown) {
    if (isApiError(err) && err.data?.code === "transaction_payment_methods.name.exists") {
      apiError.value = err.data?.message ?? "This name already exists.";
      formRef.value?.validate();
      return;
    }
    showError({ message: getApiErrorMessage(err, "Failed to update payment method. Please try again.") });
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
    title="Edit Payment Method"
    description="Update payment method details."
    :modal-width="500"
    dismissible
    @close="handleClose"
  >
    <div v-if="method" class="flex flex-col gap-4">
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
            @click="handleUpdate"
          >
            Update Method
          </base-button>
        </div>
      </UForm>
    </div>
  </base-modal>
</template>
