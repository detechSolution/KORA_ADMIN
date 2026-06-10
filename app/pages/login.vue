<script setup lang="ts">
import { reactive, ref } from "vue";
import * as z from "zod";

import { useAuthStore } from "~/stores/auth";
import { getApiErrorMessage } from "~/utils/error";

definePageMeta({
  auth: false,
});

const authStore = useAuthStore();
const { error: showError } = useNotification();
const router = useRouter();
const rememberMe = ref(false);

const loading = ref(false);
const apiError = ref<string | null>(null);
const formRef = ref<InstanceType<typeof UForm> | null>(null);

const schema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email"),
  password: z.string().min(1, "Password is required"),
}).superRefine((data, ctx) => {
  if (apiError.value) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["password"],
      message: apiError.value,
    });
  }
});

type Schema = z.output<typeof schema>;

const state = reactive<Partial<Schema>>({
  email: "",
  password: "",
});

function setApiError(error: string): void {
  apiError.value = error;
}

function clearApiError(): void {
  apiError.value = null;
}

async function handleLogin(): Promise<void> {
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
      email: state.email,
      password: state.password,
    };
    await authStore.login(payload as { email: string; password: string });
    router.push({ name: "index" });
  }
  catch (error: unknown) {
    const errorMessage = getApiErrorMessage(error, "Something went wrong. Please try again.");
    if (errorMessage !== "Something went wrong. Please try again.") {
      setApiError(errorMessage);
      formRef.value?.validate();
      return;
    }
    console.log("error message", errorMessage);
    showError({ message: errorMessage });
  }
  finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="min-h-dvh flex flex-col lg:flex-row overflow-x-hidden relative">
    <!-- Theme switcher: top-right, visible on all breakpoints -->
    <!-- <div
      class="fixed z-20"
      style="top: max(1rem, env(safe-area-inset-top)); right: max(1rem, env(safe-area-inset-right));"
      aria-label="Theme"
    >
      <UColorModeSwitch :ui="{ thumb: 'bg-background', icon: 'bg-foreground' }" />
    </div> -->

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
      <!-- Gradient overlay over the SVG -->
      <div
        class="absolute inset-0 pointer-events-none bg-gradient-to-br from-black/20 via-black/40 to-black/60"
        aria-hidden="true"
      />

      <div class="relative z-10 h-1/2 flex flex-col justify-between">
        <div class="flex items-center gap-2.5">
          <img
            src="/logo/kora_white_logo.svg"
            alt="Baha Connect"
            class="h-16 w-32 shrink-0 object-contain"
          >
        </div>

        <div class="space-y-3">
          <h2 class="text-3xl xl:text-4xl font-bold text-white tracking-tight leading-tight">
            Welcome Back!
          </h2>
          <p class="text-base max-w-2xl text-white leading-relaxed">
            View bookings, create sessions, and manage payments in a seamless environment built for clarity, balance, and control.
          </p>
        </div>
      </div>
    </aside>

    <!-- Right: form panel -->
    <main
      class="flex-1 flex flex-col min-h-dvh lg:min-h-0 lg:flex lg:items-center lg:justify-center relative"
      aria-label="Sign in"
    >
      <div
        class="absolute inset-0 pointer-events-none hidden dark:block bg-background"
        aria-hidden="true"
      />
      <!-- Mobile: brand header (same height as auth navbar, no border) -->
      <div class="lg:hidden relative z-10 flex items-center gap-2.5 px-5 h-[var(--size-navbar-auth)] min-h-[4rem] shrink-0">
        <img
          src="/logo/kora_black_logo.svg"
          alt="Baha Connect"
          class="h-16 w-32 shrink-0 object-contain"
        >
      </div>

      <div
        class="relative z-10  flex-1 flex flex-col justify-center min-h-0 w-full max-w-125 mx-auto px-5 py-8 sm:px-8 sm:py-10 lg:py-12 pb-[max(1.5rem,env(safe-area-inset-bottom))] overflow-y-auto"
      >
        <h1 class="mt-0 lg:mt-4 text-[28px] font-bold text-foreground tracking-tight">
          Welcome Back
        </h1>
        <p class="mt-2 text-sm text-gray-500 leading-relaxed">
          Sign in to access your account and continue your experience.
        </p>

        <UForm
          ref="formRef"
          :state="state"
          :schema="schema"
          :validate-on="['input', 'change', 'blur']"
          class="mt-8 w-full space-y-4"
        >
          <base-input
            v-model="state.email"
            name="email"
            label="Email"
            placeholder="Enter Your Email"
            @input="clearApiError"
          />
          <base-input
            v-model="state.password"
            name="password"
            label="Password"
            placeholder="Enter Your Passsword"
            type="password"
            @input="clearApiError"
          />

          <div class="flex items-center justify-between pt-2 pb-1">
            <UCheckbox
              v-model="rememberMe"
              name="rememberMe"
              label="Remember me"
            />
            <NuxtLink
              to="/forgot-password"
              class="text-sm font-medium text-[#B68A55] hover:text-[#B68A55]/90 shrink-0"
            >
              Forgot Password?
            </NuxtLink>
          </div>
          <base-button
            type="submit"
            class="w-full mt-2"
            :loading="loading"
            @click="handleLogin"
          >
            Log in
          </base-button>
        </UForm>
      </div>
    </main>
  </div>
</template>
