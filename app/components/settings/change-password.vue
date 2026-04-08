<script setup lang="ts">
import { nextTick, reactive, ref } from "vue";
import * as z from "zod";

import { useNotification } from "~/composables/use-notification";
import { useAuthStore } from "~/stores/auth";
import { getApiErrorMessage, isApiError } from "~/utils/error";

const authStore = useAuthStore();
const router = useRouter();

const loading = ref(false);
const apiError = ref<string | null>(null);
const formRef = ref<InstanceType<typeof UForm> | null>(null);
const { success, error: showError } = useNotification();
const hasValidated = ref(false);

const schema = z.object({
  oldPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).superRefine((data, ctx) => {
  if (data.newPassword !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["confirmPassword"],
      message: "Passwords do not match",
    });
  }
  if (apiError.value) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["oldPassword"],
      message: apiError.value,
    });
  }
});

type Schema = z.output<typeof schema>;

const state = reactive<Partial<Schema>>({
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
});

function setApiError(error: string): void {
  apiError.value = error;
}

async function clearApiError(): Promise<void> {
  apiError.value = null;
  await nextTick();
  if (hasValidated.value && formRef.value) {
    formRef.value.validate();
  }
}

async function handleChangePassword(): Promise<void> {
  loading.value = true;
  apiError.value = null;
  try {
    await authStore.updatePassword({
      old_password: state.oldPassword || "",
      new_password: state.newPassword || "",
    });
    success({ message: "Password changed successfully. Please login again." });
    state.oldPassword = "";
    state.newPassword = "";
    state.confirmPassword = "";
    await authStore.logout();
    router.push({ name: "login" });
  }
  catch (error: unknown) {
    if (isApiError(error) && error.data?.code === "auth.password.incorrect") {
      setApiError(error.data?.message ?? "Invalid credentials");
      formRef.value?.validate();
      return;
    }
    showError({ message: getApiErrorMessage(error, "Something went wrong. Please try again.") });
  }
  finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-col gap-1 pb-4 border-b border-border">
      <h2 class="flex items-center gap-2 text-xl font-semibold text-foreground">
        <span>Change Password</span>
      </h2>
      <p class="text-xs text-muted-foreground">
        Update your password to keep your account secure
      </p>
    </div>

    <div class="bg-muted/50 border border-border rounded-md p-3">
      <div class="flex items-start gap-2.5">
        <div class="flex flex-col gap-0.5">
          <p class="text-xs font-medium text-foreground">
            Password Requirements
          </p>
          <ul class="text-xs text-muted-foreground space-y-0.5 mt-1">
            <li>• At least 6 characters long</li>
            <li>• Use a combination of letters and numbers</li>
            <li>• Avoid using easily guessable passwords</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="w-full max-w-[450px]">
      <UForm
        ref="formRef"
        :state="state"
        :schema="schema"
        :validate-on="['input', 'change', 'blur']"
        class="flex flex-col gap-4"
        @submit.prevent="handleChangePassword"
      >
        <base-input
          v-model="state.oldPassword"
          name="oldPassword"
          label="Current Password"
          placeholder="Enter your current password"
          type="password"
          @input="clearApiError"
        />

        <base-input
          v-model="state.newPassword"
          name="newPassword"
          label="New Password"
          placeholder="Enter your new password"
          type="password"
          @input="clearApiError"
        />

        <base-input
          v-model="state.confirmPassword"
          name="confirmPassword"
          label="Confirm New Password"
          placeholder="Confirm your new password"
          type="password"
          @input="clearApiError"
        />

        <div class="flex justify-start pt-1">
          <base-button
            type="submit"
            :loading="loading"
          >
            Update Password
          </base-button>
        </div>
      </UForm>
    </div>
  </div>
</template>
