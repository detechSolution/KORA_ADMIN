<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import * as z from "zod";

import type { SpaCategory } from "~/types/spa";

import { useNotification } from "~/composables/use-notification";
import { useSpaStore } from "~/stores/spa";
import { getApiErrorMessage } from "~/utils/error";

type Props = {
  open: boolean;
  category: SpaCategory | null;
};

const props = defineProps<Props>();
const emit = defineEmits<{ (e: "close"): void; (e: "updated"): void }>();
const spaStore = useSpaStore();
const { success, error: showError } = useNotification();
const loading = ref(false);
const formRef = ref<InstanceType<typeof UForm> | null>(null);
const schema = z.object({
  name: z.string().trim().min(2, "Category name must be at least 2 characters").max(120, "Category name must be at most 120 characters"),
});
const state = reactive({ name: "" });

watch(() => [props.open, props.category] as const, ([open, category]) => {
  if (open && category) {
    state.name = category.name;
  }
}, { immediate: true });

async function handleUpdate(): Promise<void> {
  try {
    await formRef.value?.validate();
  }
  catch {
    return;
  }

  if (!props.category) return;

  try {
    loading.value = true;
    await spaStore.updateSpaCategory(props.category.id, { name: state.name.trim() });
    success({ message: "Category updated successfully" });
    emit("updated");
    emit("close");
  }
  catch (error: unknown) {
    showError({ message: getApiErrorMessage(error, "Failed to update category. Please try again.") });
  }
  finally {
    loading.value = false;
  }
}
</script>

<template>
  <base-modal
    :open="open"
    title="Edit Category"
    :modal-width="500"
    dismissible
    @close="emit('close')"
  >
    <UForm
      ref="formRef"
      :state="state"
      :schema="schema"
      :validate-on="['input', 'change', 'blur']"
      class="flex flex-col gap-4 p-4"
      @submit.prevent="handleUpdate"
    >
      <base-input
        v-model="state.name"
        name="name"
        label="Category Name"
        placeholder="Enter category name"
      />

      <div class="flex justify-end gap-2">
        <base-button variant="outline" :disabled="loading" @click="emit('close')">
          Cancel
        </base-button>
        <base-button :loading="loading" :disabled="loading" @click="handleUpdate">
          Save Changes
        </base-button>
      </div>
    </UForm>
  </base-modal>
</template>
