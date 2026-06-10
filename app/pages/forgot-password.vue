<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { z } from "zod";

import { useAuthStore } from "~/stores/auth";
import { getApiErrorMessage } from "~/utils/error";

definePageMeta({
  auth: false,
});

const authStore = useAuthStore();
const toast = useNotification();
const router = useRouter();

const { error: showError, success } = useNotification();
const loading = ref(false);
const step = ref<1 | 2 | 3>(1);

// Step 1: Email
const emailFormRef = ref<InstanceType<typeof UForm> | null>(null);
const emailSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email"),
});
const emailState = reactive({ email: "" });

// Step 2: OTP
const otpFormRef = ref<InstanceType<typeof UForm> | null>(null);
const otpSchema = z.object({
  otp: z.string().min(1, "OTP Code is required").length(6, "OTP must be 6 digits"),
});
const otpState = reactive({ otp: "" });

// Step 3: New Password
const passwordFormRef = ref<InstanceType<typeof UForm> | null>(null);
const passwordSchema = z.object({
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/\d/, "Password must contain at least one number"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});
const passwordState = reactive({ password: "", confirmPassword: "" });

// Computed property for current step title
const currentStepTitle = computed(() => {
  switch (step.value) {
    case 1: return "Forgot Password";
    case 2: return "Verify OTP";
    case 3: return "Create New Password";
    default: return "Forgot Password";
  }
});

const currentStepDescription = computed(() => {
  switch (step.value) {
    case 1: return "Enter your email to receive a reset link.";
    case 2: return "Enter the OTP code sent to your email.";
    case 3: return "Create a strong password for your account.";
    default: return "Enter your email to receive a reset link.";
  }
});

// Generic form submission handler
async function handleFormSubmit(
  formRef: typeof emailFormRef | typeof otpFormRef | typeof passwordFormRef,
  submitFn: () => Promise<void>,
): Promise<void> {
  try {
    await formRef.value?.validate();
  }
  catch {
    return;
  }

  loading.value = true;
  try {
    await submitFn();
  }
  finally {
    loading.value = false;
  }
}

async function handleEmailSubmit(): Promise<void> {
  await handleFormSubmit(emailFormRef, async () => {
    try {
      await authStore.forgotPassword({ email: emailState.email });
      success({ message: "OTP sent to your email." });
      step.value = 2;
    }
    catch (error: unknown) {
      showError({ message: getApiErrorMessage(error, "Something went wrong. Please try again.") });
    }
  });
}

async function handleOtpSubmit(): Promise<void> {
  await handleFormSubmit(otpFormRef, async () => {
    try {
      await authStore.verifyResetOtp({ email: emailState.email, code: otpState.otp });
      step.value = 3;
    }
    catch (error: unknown) {
      showError({ message: getApiErrorMessage(error, "Invalid OTP. Please try again.") });
    }
  });
}

async function handlePasswordSubmit(): Promise<void> {
  await handleFormSubmit(passwordFormRef, async () => {
    try {
      await authStore.resetPassword({
        code: otpState.otp,
        newPassword: passwordState.password,
      });
      toast.success({ message: "Password changed successfully." });
      await router.push({ path: "/login" });
    }
    catch (error: unknown) {
      showError({ message: getApiErrorMessage(error, "Something went wrong. Please try again.") });
    }
  });
}
</script>

<template>
  <div class="min-h-dvh flex flex-col lg:flex-row overflow-x-hidden relative">
    <!-- Left: hero panel (desktop only) -->
    <aside
      class="hidden lg:flex lg:flex-1 lg:min-w-0 flex-col justify-between relative overflow-hidden px-10 py-12 xl:px-16 xl:py-20"
      aria-hidden="true"
    >
      <div
        class="absolute inset-0 pointer-events-none bg-cover"
        :style="{ backgroundImage: 'url(/image/login-bg.svg)' }"
        aria-hidden="true"
      />
      <div
        class="absolute inset-0 pointer-events-none bg-gradient-to-br from-black/20 via-black/40 to-black/60"
        aria-hidden="true"
      />

      <div class="relative z-10 h-1/2 flex flex-col justify-between">
        <div class="flex items-center gap-2.5">
          <img
            src="/logo/kora_white_logo.svg"
            alt="Kora"
            class="h-16 w-32 shrink-0 object-contain"
          >
        </div>

        <div class="space-y-3">
          <h2 class="text-3xl xl:text-4xl font-bold text-white tracking-tight leading-tight">
            Reset Your Password
          </h2>
          <p class="text-base max-w-2xl text-white leading-relaxed">
            Regain access by setting a new password and continue managing your bookings and sessions without interruption.
          </p>
        </div>
      </div>
    </aside>

    <!-- Right: form panel -->
    <main
      class="flex-1 flex flex-col min-h-dvh lg:min-h-0 lg:flex lg:items-center lg:justify-center relative"
      :aria-label="currentStepTitle"
    >
      <div
        class="absolute inset-0 pointer-events-none hidden dark:block bg-background"
        aria-hidden="true"
      />
      <!-- Mobile: brand header -->
      <div class="lg:hidden relative z-10 flex items-center gap-2.5 px-5 shrink-0">
        <img
          src="/logo/kora_black_logo.svg"
          alt="Kora"
          class="h-16 w-32 shrink-0 object-contain"
        >
      </div>

      <div
        class="relative z-10 max-w-125 flex-1 flex flex-col justify-center min-h-0 w-full mx-auto px-5 py-8 sm:px-8 sm:py-10 lg:py-12 overflow-y-auto"
      >
        <h1 class="mt-0 lg:mt-4 text-[28px] font-bold text-foreground tracking-tight">
          {{ currentStepTitle }}
        </h1>
        <p class="mt-2 text-sm text-gray-500 leading-relaxed">
          {{ currentStepDescription }}
        </p>

        <!-- Step 1: Email -->
        <UForm
          v-if="step === 1"
          ref="emailFormRef"
          :state="emailState"
          :schema="emailSchema"
          :validate-on="['input', 'change', 'blur']"
          class="mt-8 w-full space-y-4"
          @submit.prevent="handleEmailSubmit"
        >
          <base-input
            v-model="emailState.email"
            name="email"
            label="Email"
            placeholder="Enter Your Email"
            autocomplete="email"
          />
          <base-button
            type="submit"
            class="w-full mt-2"
            :loading="loading"
          >
            Submit
          </base-button>
        </UForm>

        <!-- Step 2: OTP -->
        <UForm
          v-if="step === 2"
          ref="otpFormRef"
          :state="otpState"
          :schema="otpSchema"
          :validate-on="['input', 'change', 'blur']"
          class="mt-8 w-full space-y-4"
          @submit.prevent="handleOtpSubmit"
        >
          <base-input
            v-model="otpState.otp"
            name="otp"
            label="OTP Code"
            placeholder="Enter OTP Code"
            autocomplete="one-time-code"
            inputmode="numeric"
          />
          <base-button
            type="submit"
            class="w-full mt-2"
            :loading="loading"
          >
            Next
          </base-button>
        </UForm>

        <!-- Step 3: New Password -->
        <UForm
          v-if="step === 3"
          ref="passwordFormRef"
          :state="passwordState"
          :schema="passwordSchema"
          :validate-on="['input', 'change', 'blur']"
          class="mt-8 w-full space-y-4"
          @submit.prevent="handlePasswordSubmit"
        >
          <base-input
            v-model="passwordState.password"
            name="password"
            label="Create New Password"
            placeholder="Create a new password"
            type="password"
            autocomplete="new-password"
          />
          <base-input
            v-model="passwordState.confirmPassword"
            name="confirmPassword"
            label="Confirm Password"
            placeholder="Re-enter the password"
            type="password"
            autocomplete="new-password"
          />
          <base-button
            type="submit"
            class="w-full mt-2"
            :loading="loading"
          >
            Change Password
          </base-button>
        </UForm>
      </div>
    </main>
  </div>
</template>
