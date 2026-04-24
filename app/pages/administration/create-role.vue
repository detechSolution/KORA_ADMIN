<script setup lang="ts">
import { reactive, ref } from "vue";
import z from "zod";

import { ICONS } from "~/config/icons";
import { useAdminStore } from "~/stores/admin";
import { getApiErrorMessage } from "~/utils/error";

definePageMeta({
  layout: "dashboard",
  auth: true,
  permission: "administration.roles.create",
});

const adminStore = useAdminStore();
const toast = useNotification();
const router = useRouter();

const loading = ref(false);
const apiError = ref<string | null>(null);
const formRef = ref<InstanceType<typeof UForm> | null>(null);

const schema = z.object({
  name: z.string().min(1, "Role name is required"),
  description: z.string().min(1, "Role description is required"),
});

type createRoleSchema = z.output<typeof schema>;

const state = reactive<Partial<createRoleSchema>>({
  name: "",
  description: "",
});

function setApiError(error: string): void {
  apiError.value = error;
}

function clearApiError(): void {
  apiError.value = null;
}

async function handleCreateRole() {
  try {
    await formRef.value?.validate();
  }
  catch {
    return;
  }
  try {
    loading.value = true;
    clearApiError();
    const payload = {
      name: state.name,
      description: state.description,
      permissions: [],
    };
    await adminStore.createRole(payload as { name: string; description: string; permissions: string[] });
    toast.success({ message: "Role created successfully" });
    router.push({ name: "administration/roles" });
  }
  catch (error: unknown) {
    const message = getApiErrorMessage(error, "Something went wrong. Please try again.");
    if (message !== "Something went wrong. Please try again.") {
      setApiError(message);
      formRef.value?.validate();
      return;
    }
    toast.error({ message });
  }
  finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <base-page-header>
      <template #title>
        Admins
      </template>
      <template #description>
        Create and manage admins
      </template>
    </base-page-header>

    <div class="flex flex-col gap-6 p-6 bg-white rounded-lg">
      <div class="bg-stone-50 rounded-lg p-4 flex flex-col gap-2">
        <div class="flex items-center gap-2">
          <UIcon :name="ICONS.INFO" class="text-primary" />
          <h3 class="text-sm text-secondary font-medium">
            Role Information
          </h3>
        </div>
        <p class="text-secondary-500 text-xs">
          Enter the role name and a description for the role
        </p>
      </div>

      <UForm
        ref="formRef"
        :schema="schema"
        :state="state"
        :validate-on="['input', 'change', 'blur']"
      >
        <div class="bg-white flex flex-col gap-5 shadow-md rounded-lg p-4">
          <div class="flex flex-col gap-4">
            <base-input
              v-model="state.name"
              name="name"
              label="Role Name"
              placeholder="Enter role name"
            />
            <base-input
              v-model="state.description"
              name="description"
              label="Description"
              type="textarea"
              placeholder="Enter role description"
            />
          </div>
          <div class="flex justify-end">
            <base-button
              variant="solid"
              @click="handleCreateRole"
            >
              Create Role
            </base-button>
          </div>
        </div>
      </UForm>
    </div>
  </div>
</template>

<style>

</style>
