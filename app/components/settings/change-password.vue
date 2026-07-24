<script setup lang="ts">
import { reactive, ref } from "vue";
import z from "zod";

import { ICONS } from "~/config/icons";
import { useAuthStore } from "~/stores/auth";
import { getApiErrorMessage } from "~/utils/error";

const authStore = useAuthStore();
const { success, error: showError } = useNotification();

const loading = ref(false);
const formRef = ref<InstanceType<typeof UForm> | null>(null);

const schema = z.object({
  currentPassword: z.string().min(6, "Current password must be at least 6 characters"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm password must be at least 6 characters"),
});

type ProfileForm = z.output<typeof schema>;

const state = reactive<ProfileForm>({
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
});

async function handleUpdateProfile(): Promise<void> {
  try {
    await formRef.value?.validate();
  }
  catch {
    return;
  }
  try {
    loading.value = true;

    if (state.newPassword !== state.confirmPassword) {
      showError({ message: "New password and confirm password do not match" });
      return;
    }
    const payload = {
      currentPassword: state.currentPassword,
      newPassword: state.newPassword,
    };

    await authStore.updatePassword(payload);
    success({ message: "Password updated successfully" });
    state.currentPassword = "";
    state.newPassword = "";
    state.confirmPassword = "";
  }
  catch (error) {
    showError({ message: getApiErrorMessage(error, "Failed to update password") });
  }
  finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="bg-stone-50 rounded-lg p-4 flex flex-col gap-2">
      <div class="flex items-center gap-2">
        <UIcon :name="ICONS.INFO" class="text-primary" />
        <h3 class="text-sm text-secondary font-medium">
          Update Password
        </h3>
      </div>
      <p class="text-secondary-500 text-xs">
        update your password by entering your current password
      </p>
    </div>

    <UForm
      ref="formRef"
      :schema="schema"
      :state="state"
      :validate-on="['input', 'change', 'blur']"
      class="flex min-h-0 flex-1 flex-col"
    >
      <div class="flex flex-col gap-4">
        <!-- Profile Information -->
        <div class="flex bg-white shadow-md rounded-md flex-col gap-4 p-4">
          <div class="flex flex-col gap-4">
            <base-input
              v-model="state.currentPassword"
              name="currentPassword"
              label="Current Password"
              placeholder="Enter current password"
              type="password"
            />

            <base-input
              v-model="state.newPassword"
              name="newPassword"
              label="New Password"
              placeholder="Enter new password"
              type="password"
            />

            <base-input
              v-model="state.confirmPassword"
              name="confirmPassword"
              label="Confirm Password"
              placeholder="Confirm new password"
              type="password"
            />
          </div>
        </div>

        <div class="flex justify-end">
          <base-button
            type="submit"
            color="primary"
            :loading="loading"
            @click="handleUpdateProfile"
          >
            Update Password
          </base-button>
        </div>
      </div>
    </UForm>
  </div>
</template>
