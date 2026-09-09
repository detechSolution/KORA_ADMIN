<script setup lang="ts">
import { reactive, ref } from "vue";
import * as z from "zod";

import type { SpaCategory } from "~/types/spa";

import { useNotification } from "~/composables/use-notification";
import { useSpaStore } from "~/stores/spa";
import { getApiErrorMessage } from "~/utils/error";

type Props = {
  open: boolean;
};

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "created", category: SpaCategory): void;
}>();

const spaStore = useSpaStore();
const { success, error: showError } = useNotification();
const loading = ref(false);
const formRef = ref<InstanceType<typeof UForm> | null>(null);

const schema = z.object({
  name: z.string().trim().min(1, "Category name is required").max(255, "Category name must be at most 255 characters"),
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

  const name = state.name?.trim() ?? "";
  if (!name) {
    return;
  }

  try {
    loading.value = true;
    const category = await spaStore.createSpaCategory({ name });
    success({ message: "Category created successfully" });
    emit("created", category);
    handleClose();
  }
  catch (error: unknown) {
    showError({ message: getApiErrorMessage(error, "Failed to create category. Please try again.") });
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
    :modal-width="500"
    dismissible
    @close="handleClose"
  >
    <UForm
      ref="formRef"
      :state="state"
      :schema="schema"
      :validate-on="['input', 'change', 'blur']"
      class="flex flex-col gap-4 p-4"
    >
      <base-input
        v-model="state.name"
        name="name"
        label="Category Name"
        placeholder="Enter a new category"
        required
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
          Add Category
        </base-button>
      </div>
    </UForm>
  </base-modal>
</template>
