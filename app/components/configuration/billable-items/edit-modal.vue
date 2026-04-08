<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import * as z from "zod";

import { useNotification } from "~/composables/use-notification";
import { useBillableItemsStore } from "~/stores/billable-items";
import { getApiErrorMessage } from "~/utils/error";

type Props = {
  open: boolean;
  item: any;
};

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "updated"): void;
}>();

const billableItemsStore = useBillableItemsStore();
const { success, error: showError } = useNotification();

const loading = ref(false);
const formRef = ref<InstanceType<typeof UForm> | null>(null);

const schema = z.object({
  description: z.string().min(1, "Description is required"),
  is_active: z.boolean({ message: "Status must be enabled or disabled" }),
});

type Schema = z.output<typeof schema>;

const state = reactive<Partial<Schema>>({
  description: "",
  is_active: true,
});

watch(
  () => props.item,
  (newItem) => {
    if (newItem) {
      state.description = newItem.description ?? "";
      state.is_active = typeof newItem.is_active === "boolean" ? newItem.is_active : (newItem.is_active ?? true);
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
  if (!props.item?.id && props.item?.billable_item_id === undefined) {
    showError({ message: "Invalid billable item" });
    return;
  }
  const billableItemId = props.item?.billable_item_id ?? props.item?.id;
  try {
    loading.value = true;
    await billableItemsStore.updateBillableItem({
      billable_item_id: billableItemId,
      description: state.description!,
      is_active: state.is_active ?? true,
    });
    success({ message: "Billable item updated successfully" });
    emit("updated");
  }
  catch (error: unknown) {
    showError({ message: getApiErrorMessage(error, "Failed to update billable item. Please try again.") });
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
    title="Edit Billable Item"
    description="Update billable item details."
    :modal-width="600"
    dismissible
    @close="handleClose"
  >
    <div v-if="item" class="flex flex-col gap-4">
      <div class="bg-muted/30 border border-border rounded-lg p-4 space-y-2">
        <div class="flex justify-between items-center">
          <span class="text-sm font-medium text-muted-foreground">Name</span>
          <span class="text-sm text-foreground">{{ item.name ?? "-" }}</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-sm font-medium text-muted-foreground">Amount</span>
          <span class="text-sm text-foreground">{{ item.amount != null ? `Rs. ${Number(item.amount).toLocaleString()}` : "-" }}</span>
        </div>
      </div>

      <UForm
        ref="formRef"
        :state="state"
        :schema="schema"
        :validate-on="['input', 'change', 'blur']"
        class="flex flex-col gap-4"
      >
        <base-input
          v-model="state.description"
          name="description"
          label="Description"
          placeholder="Enter description"
          required
        />
        <base-switch
          v-model="state.is_active"
          name="is_active"
          label="Status"
          on-label="Active"
          off-label="Inactive"
        />

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
            @click="handleUpdate"
          >
            Update Billable Item
          </base-button>
        </div>
      </UForm>
    </div>
  </base-modal>
</template>
