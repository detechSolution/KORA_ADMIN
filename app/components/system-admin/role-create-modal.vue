<script setup lang="ts">
import { reactive, ref } from "vue";
import * as z from "zod";

import { useNotification } from "~/composables/use-notification";
import { useSystemAdminStore } from "~/stores/system-admin";
import { getApiErrorMessage } from "~/utils/error";

type Props = {
  open: boolean;
};

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "created"): void;
}>();

const systemAdminStore = useSystemAdminStore();
const { success, error: showError } = useNotification();

const loading = ref(false);
const formRef = ref<InstanceType<typeof UForm> | null>(null);

const schema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name must be at most 255 characters"),
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
    await systemAdminStore.createRole({
      name: state.name!,
    });
    success({ message: "Role created successfully" });
    clearFormData();
    emit("created");
  }
  catch (error: unknown) {
    showError({ message: getApiErrorMessage(error, "Failed to create role. Please try again.") });
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
    title="Create Role"
    description="Add a new role for system administrators."
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
      <div class="flex flex-col gap-4">
        <base-input
          v-model="state.name"
          name="name"
          label="Role Name"
          placeholder="e.g. Admin, Editor"
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
          Create Role
        </base-button>
      </div>
    </UForm>
  </base-modal>
</template>
