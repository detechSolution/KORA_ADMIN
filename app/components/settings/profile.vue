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
  email: z.string().email("Invalid email address"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
});

type ProfileForm = z.output<typeof schema>;

const state = reactive<ProfileForm>({
  email: authStore.user.email,
  name: authStore.user.name,
  phone: authStore.user.phone,
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
    const payload = {
      fullName: state.name,
      phoneNumber: state.phone,
    };
    await authStore.updateProfile(payload);
    success({ message: "Profile updated successfully" });
  }
  catch (error) {
    showError({ message: getApiErrorMessage(error, "Failed to update profile") });
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
          Mail details
        </h3>
      </div>
      <p class="text-secondary-500 text-xs">
        Enter the subject, title and contents of the mail
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
              v-model="state.name"
              name="name"
              label="Name*"
              placeholder="Enter your name"
            />

            <div class="w-full">
              <base-input
                v-model="state.phone"
                name="phone"
                label="Phone Number*"
                placeholder="Enter your phone number"
              />
            </div>
          </div>
        </div>

        <div class="flex justify-end">
          <base-button
            type="submit"
            color="primary"
            :loading="loading"
            @click="handleUpdateProfile"
          >
            Update Profile
          </base-button>
        </div>
      </div>
    </UForm>
  </div>
</template>
