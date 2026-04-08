<script setup lang="ts">
import { reactive, ref } from "vue";
import * as z from "zod";

import { useNotification } from "~/composables/use-notification";
import { useBillableItemsStore } from "~/stores/billable-items";
import { getApiErrorMessage } from "~/utils/error";

type Props = {
  open: boolean;
};

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "created"): void;
}>();

const billableItemsStore = useBillableItemsStore();
const { success, error: showError } = useNotification();

const loading = ref(false);
const formRef = ref<InstanceType<typeof UForm> | null>(null);

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  amount: z.number({ message: "Amount is required" }).min(0, "Amount must be zero or greater"),
});

type Schema = z.output<typeof schema>;

const state = reactive<Partial<Schema>>({
  name: "",
  description: "",
  amount: undefined,
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
    await billableItemsStore.createBillableItem({
      name: state.name!,
      description: state.description!,
      amount: state.amount!,
    });
    success({ message: "Billable item created successfully" });
    clearFormData();
    emit("created");
  }
  catch (error: unknown) {
    showError({ message: getApiErrorMessage(error, "Failed to create billable item. Please try again.") });
  }
  finally {
    loading.value = false;
  }
}

function clearFormData(): void {
  state.name = "";
  state.description = "";
  state.amount = undefined;
}

function handleClose(): void {
  emit("close");
  clearFormData();
}
</script>

<template>
  <base-modal
    :open="props.open"
    title="Create Billable Item"
    description="Add a new billable item for transactions."
    :modal-width="600"
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
      <div class="flex flex-col gap-4">
        <base-input
          v-model="state.name"
          name="name"
          label="Name"
          placeholder="e.g. Monthly Service Fee"
          required
        />
        <base-input
          v-model="state.description"
          name="description"
          label="Description"
          placeholder="Enter description"
          required
        />
        <base-input
          v-model.number="state.amount"
          name="amount"
          label="Amount"
          placeholder="e.g. 1000"
          type="number"
          min="0"
          step="0.01"
          required
        />
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
          @click="handleCreate"
        >
          Create Billable Item
        </base-button>
      </div>
    </UForm>
  </base-modal>
</template>
