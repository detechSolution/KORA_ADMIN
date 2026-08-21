<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import z from "zod";

import { ICONS } from "~/config/icons";
import { useAdminStore } from "~/stores/admin";
import { preventInvalidNumberInput } from "~/utils/common";
import { getApiErrorMessage } from "~/utils/error";

definePageMeta({
  layout: "dashboard",
  auth: true,
  permission: "administration.admins.create",
});

const adminStore = useAdminStore();
const { error: showError, success } = useNotification();
const router = useRouter();

const loading = ref(false);
const apiError = ref<string | null>(null);
const formRef = ref<InstanceType<typeof UForm> | null>(null);

const schema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  phoneNumber: z.coerce.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
  email: z.string().min(1, "Email is required"),
  adminRoleId: z.string().min(1, "Admin role is required"),
  isActive: z.boolean(),
});

type createRoleSchema = z.output<typeof schema>;

const state = reactive<Partial<createRoleSchema>>({
  fullName: "",
  phoneNumber: "",
  email: "",
  adminRoleId: "",
  isActive: false,
});

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
      fullName: state.fullName,
      phoneNumber: state.phoneNumber,
      email: state.email,
      adminRoleId: state.adminRoleId,
      isActive: state.isActive,
    };
    await adminStore.createAdmin(payload as { fullName: string; phoneNumber: string; email: string; adminRoleId: string; isActive: boolean });
    success({ message: "Admin created successfully" });
    router.push("/administration/admins");
  }
  catch (error: unknown) {
    showError({ message: getApiErrorMessage(error, "Something went wrong. Please try again.") });
  }
  finally {
    loading.value = false;
  }
}

const adminRoles = computed(() => adminStore.roles);

const roleOptions = computed(() => adminRoles?.value.map(role => ({ label: role.name, value: String(role.id) })));

onMounted(() => {
  adminStore.fetchRoles();
});
</script>

<template>
  <div class="flex flex-col gap-6">
    <base-page-header>
      <template #title>
        Create New Admin
      </template>
      <template #description>
        Create and manage admins
      </template>

      <template #actions>
        <NuxtLink to="/administration/admins">
          <base-button
            variant="outline"
            :leading-icon="ICONS.ARROW_LEFT"
          >
            Back to list
          </base-button>
        </NuxtLink>
      </template>
    </base-page-header>

    <div class="flex flex-col gap-6 p-6 bg-white rounded-lg">
      <form-header-card
        label="Basic Info"
        description="Start by entering the admin's personal details."
      />

      <UForm
        ref="formRef"
        :schema="schema"
        :state="state"
        :validate-on="['input', 'change', 'blur']"
      >
        <div class="bg-white flex flex-col gap-5 shadow-md rounded-lg p-4">
          <div class="flex flex-col gap-4 w-full">
            <base-input
              v-model="state.fullName"
              name="fullName"
              label="Admin Name"
              placeholder="Enter admin name"
            />

            <div class="flex flex-col md:flex-row w-full gap-4 justify-between">
              <div class="w-full">
                <base-input
                  v-model="state.phoneNumber"
                  name="phoneNumber"
                  label="Phone Number"
                  placeholder="Enter phone number"
                  type="tel"
                  @keydown="preventInvalidNumberInput"
                />
              </div>
              <div class="w-full">
                <base-input
                  v-model="state.email"
                  name="email"
                  label="Email Address"
                  placeholder="Enter email"
                />
              </div>
            </div>
            <base-select
              v-model="state.adminRoleId"
              name="adminRoleId"
              label="Select Role"
              placeholder="Select a role for the admin"
              :options="roleOptions"
            />
            <base-switch
              v-model="state.isActive"
              name="isActive"
              label="Status"
              on-label="Active"
              off-label="Inactive"
              color="base"
            />
            <div class="flex justify-end">
              <base-button
                variant="solid"
                :loading="loading"
                @click="handleCreateRole"
              >
                Create Admin
              </base-button>
            </div>
          </div>
        </div>
      </UForm>
    </div>
  </div>
</template>

<style>

</style>
