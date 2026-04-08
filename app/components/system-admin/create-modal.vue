<script setup lang="ts">
import { reactive, ref } from "vue";
import * as z from "zod";

import { useNotification } from "~/composables/use-notification";
import { useSystemAdminStore } from "~/stores/system-admin";
import { getApiErrorMessage } from "~/utils/error";

type Props = {
  open: boolean;
  roles?: { label: string; value: number }[];
};

const props = withDefaults(defineProps<Props>(), {
  roles: () => [] as { label: string; value: number }[],
});

const emit = defineEmits<{
  (e: "close"): void;
  (e: "created"): void;
}>();

const systemAdminStore = useSystemAdminStore();
const { success, error: showError } = useNotification();

const loading = ref(false);
const formRef = ref<InstanceType<typeof UForm> | null>(null);

const schema = z.object({
  role_id: z.number({ message: "Please select a role" }).nullable(),
  email: z.string().min(1, "Email is required").email("Invalid email").max(255, "Email must be at most 255 characters"),
  password: z.string().min(6, "Password must be at least 6 characters").max(255, "Password must be at most 255 characters"),
  name: z.string().min(1, "Name is required").max(255, "Name must be at most 255 characters"),
  phone: z.string().nullable(),
  is_active: z.boolean({ message: "Status must be enabled or disabled" }),
});

type Schema = z.output<typeof schema>;

const state = reactive<Partial<Schema> & { role_id?: number | null; is_active?: boolean }>({
  role_id: null,
  email: "",
  password: "",
  name: "",
  phone: null,
  is_active: false,
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
    await systemAdminStore.createAdmin({
      role_id: state.role_id ?? null,
      email: state.email!,
      password: state.password!,
      name: state.name!,
      phone: state.phone ?? null,
      is_active: state.is_active ?? false,
    });
    success({ message: "Admin created successfully" });
    clearFormData();
    emit("created");
  }
  catch (error: unknown) {
    showError({ message: getApiErrorMessage(error, "Failed to create admin. Please try again.") });
  }
  finally {
    loading.value = false;
  }
}

function clearFormData(): void {
  state.role_id = null;
  state.email = "";
  state.password = "";
  state.name = "";
  state.phone = null;
  state.is_active = false;
}

function handleClose(): void {
  emit("close");
  clearFormData();
}
</script>

<template>
  <base-modal
    :open="props.open"
    title="Create Admin"
    description="Add a new system administrator."
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
      @submit.prevent="handleCreate"
    >
      <div class="flex flex-col gap-4">
        <base-input
          v-model="state.email"
          name="email"
          label="Email"
          type="email"
          placeholder="admin@example.com"
          required
        />
        <base-input
          v-model="state.password"
          name="password"
          label="Password"
          type="password"
          placeholder="Min 6 characters"
          required
        />
        <base-input
          v-model="state.name"
          name="name"
          label="Name"
          placeholder="Full name"
          required
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
          :options="props.roles"
        />
        <base-switch
          v-model="state.is_active"
          name="is_active"
          label="Status"
          on-label="Active"
          off-label="Inactive"
        />
      </div>

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
          @click.prevent="handleCreate"
        >
          Create Admin
        </base-button>
      </div>
    </UForm>
  </base-modal>
</template>
