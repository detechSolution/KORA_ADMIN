<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import z from "zod";

import type { SystemAdmin } from "~/types/system-admin";

import { useNotification } from "~/composables/use-notification";
import { ICONS } from "~/config/icons";
import { useAdminStore } from "~/stores/admin";
import { getApiErrorMessage } from "~/utils/error";

type Props = {
  open: boolean;
  admin: SystemAdmin | null;
};

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "updated"): void;
}>();

const adminStore = useAdminStore();
const { success, error: showError } = useNotification();

const loading = ref(false);
const formRef = ref<InstanceType<typeof UForm> | null>(null);

const schema = z.object({
  fullName: z.string().min(1, "Admin name is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  email: z.email("Email address is required"),
  adminRoleId: z.string().min(1, "Role is required"),
  isActive: z.boolean(),
});

type EditAdminForm = z.output<typeof schema>;

const state = reactive<EditAdminForm>({
  fullName: "",
  phoneNumber: "",
  email: "",
  adminRoleId: "",
  isActive: false,
});

const roleOptions = computed(() =>
  adminStore.roles.map(role => ({
    label: role.name,
    value: String(role.id),
  })),
);

function getAdminName(admin: SystemAdmin): string {
  return admin.fullName || admin.name || "";
}

function getAdminPhone(admin: SystemAdmin): string {
  return admin.phoneNumber || admin.phone || "";
}

function fillForm(admin: SystemAdmin | null): void {
  state.fullName = admin ? getAdminName(admin) : "";
  state.phoneNumber = admin ? getAdminPhone(admin) : "";
  state.email = admin?.email ?? "";
  state.adminRoleId = admin?.adminRoleId ? String(admin.adminRoleId) : "";
  state.isActive = admin?.isActive ?? false;
}

async function handleSubmit(): Promise<void> {
  if (!props.admin) {
    return;
  }

  try {
    await formRef.value?.validate();
  }
  catch {
    return;
  }

  try {
    loading.value = true;
    await adminStore.updateAdmin({
      admin_id: props.admin.id,
      fullName: state.fullName.trim(),
      phoneNumber: state.phoneNumber.trim(),
      email: state.email.trim(),
      adminRoleId: state.adminRoleId ? Number(state.adminRoleId) : null,
      isActive: state.isActive,
    });
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

watch(
  () => props.open,
  async (isOpen) => {
    if (!isOpen) {
      return;
    }

    fillForm(props.admin);

    if (!adminStore.roles.length) {
      await adminStore.fetchRoles();
    }
  },
  { immediate: true },
);

watch(
  () => props.admin,
  (admin) => {
    fillForm(admin);
  },
  { immediate: true },
);
</script>

<template>
  <base-drawer
    :open="open"
    :drawer-width="480"
    @close="emit('close')"
  >
    <div class="flex items-center justify-between border-b border-stone-200 px-4 py-4">
      <h2 class="text-lg font-semibold text-secondary">
        Edit Admin
      </h2>

      <button
        type="button"
        class="rounded-md p-1 text-secondary-400 transition hover:bg-stone-100 hover:text-secondary"
        @click="emit('close')"
      >
        <UIcon :name="ICONS.X" class="h-4 w-4" />
      </button>
    </div>

    <UForm
      v-if="admin"
      ref="formRef"
      :schema="schema"
      :state="state"
      :validate-on="['input', 'change', 'blur']"
      class="flex min-h-0 flex-1 flex-col"
    >
      <div class="flex-1 overflow-y-auto px-4 py-6">
        <div class="flex flex-col gap-5">
          <base-input
            v-model="state.fullName"
            name="fullName"
            label="Admin Name*"
            placeholder="Enter admin name"
          />

          <div class="grid gap-4 sm:grid-cols-2">
            <base-input
              v-model="state.phoneNumber"
              name="phoneNumber"
              label="Phone Number*"
              placeholder="Enter phone number"
            />

            <base-input
              v-model="state.email"
              name="email"
              label="Email Address*"
              placeholder="Enter email address"
            />
          </div>

          <base-select
            v-model="state.adminRoleId"
            name="adminRoleId"
            label="Select Role*"
            placeholder="Select role"
            :options="roleOptions"
          />

          <base-switch
            v-model="state.isActive"
            name="isActive"
            label="Status"
            on-label="Active"
            off-label="Inactive"
          />
        </div>
      </div>

      <div class="flex items-center justify-between border-t border-stone-200 px-4 py-4">
        <base-button
          variant="outline"
          @click="emit('close')"
        >
          Cancel
        </base-button>

        <base-button
          variant="solid"
          :loading="loading"
          @click="handleSubmit"
        >
          Update
        </base-button>
      </div>
    </UForm>
  </base-drawer>
</template>
