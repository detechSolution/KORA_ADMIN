<script setup lang="ts">
import { reactive, ref } from "vue";
import * as z from "zod";

import { useAuthStore } from "~/stores/auth";
import { getApiErrorMessage } from "~/utils/error";

definePageMeta({
  auth: false,
});

const authStore = useAuthStore();
const toast = useNotification();
const router = useRouter();

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

const heroGradientLight = `
  linear-gradient(160deg,
    color-mix(in oklch, var(--color-background) 30%, var(--color-primary)) 0%,
    color-mix(in oklch, var(--color-background) 18%, var(--color-primary)) 50%,
    color-mix(in oklch, var(--color-background) 28%, var(--color-muted)) 100%
  )
`;

const formPanelGradientLight = `
  linear-gradient(to right,
    color-mix(in oklch, var(--color-card) 88%, var(--color-primary)) 0%,
    color-mix(in oklch, var(--color-card) 96%, var(--color-primary)) 12%,
    var(--color-card) 100%
  )
`;

const linePatternImage = `
  repeating-linear-gradient(45deg, transparent, transparent 24px, currentColor 24px, currentColor 25px),
  repeating-linear-gradient(-45deg, transparent, transparent 24px, currentColor 24px, currentColor 25px),
  repeating-linear-gradient(90deg, transparent, transparent 48px, currentColor 48px, currentColor 49px)
`;

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
};
</script>

<template>
  <div class="min-h-dvh flex flex-col lg:flex-row overflow-x-hidden relative">
    <!-- Theme switcher: top-right, visible on all breakpoints -->
    <div
      class="fixed z-20"
      style="top: max(1rem, env(safe-area-inset-top)); right: max(1rem, env(safe-area-inset-right));"
      aria-label="Theme"
    >
      <UColorModeSwitch :ui="{ thumb: 'bg-background', icon: 'bg-foreground' }" />
    </div>

    <!-- Left: hero panel (desktop only) -->
    <aside
      class="hidden lg:flex lg:flex-1 lg:min-w-0 flex-col justify-between relative overflow-hidden px-10 py-12 xl:px-16 xl:py-20"
      aria-hidden="true"
    >
      <div
        class="absolute inset-0 pointer-events-none"
        :style="{ background: heroGradientLight }"
      />
      <div
        class="absolute inset-0 pointer-events-none hidden dark:block bg-background"
        aria-hidden="true"
      />
      <div
        class="absolute inset-0 pointer-events-none opacity-[0.1] text-white/50 dark:text-muted-foreground dark:opacity-[0.05]"
        :style="{ backgroundImage: linePatternImage }"
        aria-hidden="true"
      />
      <div class="relative z-10">
        <div class="flex items-center gap-2.5">
          <img
            src="/logo.png"
            alt="Baha Connect"
            class="h-9 w-9 shrink-0 object-contain brightness-0 invert"
          >
          <span class="text-xl font-semibold text-white tracking-tight">Baha Connect</span>
        </div>
        <h2 class="mt-14 text-3xl xl:text-4xl font-bold text-white tracking-tight leading-tight">
          Hello Baha Administrator!
          <span class="inline-block ml-1" aria-hidden="true">👋</span>
        </h2>
        <p class="mt-6 max-w-sm text-base text-white leading-relaxed">
          Manage communities, subscriptions, and inquiries in one place. Get more done with less effort.
        </p>
      </div>
      <p class="relative z-10 text-sm text-white/80">
        © {{ new Date().getFullYear() }} Baha Connect. All rights reserved.
      </p>
    </aside>

    <!-- Right: form panel -->
    <main
      class="flex-1 flex flex-col min-h-dvh lg:min-h-0 lg:flex lg:items-center lg:justify-center relative"
      aria-label="Sign in"
      :style="{ background: formPanelGradientLight }"
    >
      <div
        class="absolute inset-0 pointer-events-none hidden dark:block bg-background"
        aria-hidden="true"
      />
      <!-- Mobile: brand header (same height as auth navbar, no border) -->
      <div class="lg:hidden relative z-10 flex items-center gap-2.5 px-5 h-[var(--size-navbar-auth)] min-h-[4rem] shrink-0">
        <img
          src="/logo.png"
          alt="Baha Connect"
          class="h-8 w-8 shrink-0 object-contain"
        >
        <span class="text-lg font-semibold text-foreground tracking-tight">Baha Connect</span>
      </div>

      <div
        class="relative z-10 flex-1 flex flex-col justify-center min-h-0 w-full max-w-[480px] mx-auto px-5 py-8 sm:px-8 sm:py-10 lg:py-12 pb-[max(1.5rem,env(safe-area-inset-bottom))] overflow-y-auto"
      >
        <h1 class="mt-0 lg:mt-4 text-xl sm:text-2xl font-bold text-foreground tracking-tight">
          Welcome Back!
        </h1>
        <p class="mt-2 text-sm text-muted-foreground leading-relaxed">
          Enter your credentials to access your account.
        </p>

        <UForm
          ref="formRef"
          :state="state"
          :schema="schema"
          :validate-on="['input', 'change', 'blur']"
          class="mt-8 w-full space-y-5"
        >
          <base-input
            v-model="state.email"
            name="email"
            label="Email"
            placeholder="name@example.com"
          />
          <base-input
            v-model="state.password"
            name="password"
            label="Password"
            placeholder="Enter your password"
            type="password"
            @input="clearApiError"
          />
          <base-button
            type="submit"
            class="w-full"
            :loading="loading"
            @click="handleLogin"
          >
            Log in
          </base-button>
        </UForm>

        <p class="mt-6 pt-5 text-xs text-muted-foreground leading-relaxed border-t border-border/80 max-w-[36rem]">
          By signing in, you agree to our terms of use, community guidelines, and privacy policy.
        </p>
      </div>
    </main>
  </div>
</template>
