<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import * as z from "zod";

import type { SystemAdminAdmin } from "~/types/system-admin";

import { useNotification } from "~/composables/use-notification";
import { useSystemAdminStore } from "~/stores/system-admin";
import { getApiErrorMessage } from "~/utils/error";

type Props = {
  open: boolean;
  admin: SystemAdminAdmin | null;
  roles?: { label: string; value: number }[];
};

const props = withDefaults(defineProps<Props>(), {
  roles: () => [] as { label: string; value: number }[],
});

const emit = defineEmits<{
  (e: "close"): void;
  (e: "updated"): void;
}>();

const systemAdminStore = useSystemAdminStore();
const { success, error: showError } = useNotification();

const loading = ref(false);
const formRef = ref<InstanceType<typeof UForm> | null>(null);

const schema = z.object({
  role_id: z.number({ message: "Please select a role" }).nullable(),
  name: z.string().min(1, "Name is required").max(255, "Name must be at most 255 characters"),
  phone: z.string().nullable(),
  is_active: z.boolean({ message: "Status must be enabled or disabled" }),
});

type Schema = z.output<typeof schema>;

const state = reactive<Partial<Schema> & { email?: string }>({
  email: "",
  role_id: null,
  name: "",
  phone: "",
  is_active: false,
});

const roleOptions = computed(() => [
  { label: "No role", value: null },
  ...props.roles,
] as { label: string; value: number | null }[]);

watch(
  () => props.admin,
  (newAdmin) => {
    if (newAdmin) {
      state.email = newAdmin.email ?? "";
      state.role_id = newAdmin.role_id ?? null;
      state.name = newAdmin.name ?? "";
      state.phone = newAdmin.phone ?? null;
      state.is_active = newAdmin.is_active ?? true;
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
  if (!props.admin?.id) {
    showError({ message: "Invalid admin" });
    return;
  }
  try {
    loading.value = true;
    const payload = {
      admin_id: props.admin.id,
      role_id: state.role_id ?? null,
      phone: state.phone ?? null,
      is_active: state.is_active ?? true,
    };
    await systemAdminStore.updateAdmin(payload);
    success({ message: "Admin updated successfully" });
    emit("updated");
  }
  catch (error: unknown) {
    showError({ message: getApiErrorMessage(error, "Failed to update admin. Please try again.") });
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
    title="Update Admin"
    description="Update admin details. Email cannot be changed."
    :modal-width="600"
    dismissible
    @close="handleClose"
  >
    <div v-if="admin" class="flex flex-col gap-4">
      <UForm
        ref="formRef"
        :state="state"
        :schema="schema"
        :validate-on="['input', 'change', 'blur']"
        class="flex flex-col gap-4"
        @submit.prevent="handleUpdate"
      >
        <base-input
          v-model="state.email"
          name="email"
          label="Email"
          type="email"
          placeholder="admin@example.com"
          disabled
        />
        <base-input
          v-model="state.name"
          name="name"
          label="Name"
          placeholder="Full name"
          disabled
        />
        <base-input
          v-model="state.phone"
          name="phone"
          label="Phone"
          type="tel"
          placeholder="Optional"
        />
        <base-select
          v-model="state.role_id"
          name="role_id"
          label="Role"
          placeholder="Select role"
          :options="roleOptions"
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
            type="button"
            variant="outline"
            @click.prevent="handleClose"
          >
            Cancel
          </base-button>
          <base-button
            type="submit"
            :loading="loading"
            @click.prevent="handleUpdate"
          >
            Update Admin
          </base-button>
        </div>
      </UForm>
    </div>
  </base-modal>
</template>
