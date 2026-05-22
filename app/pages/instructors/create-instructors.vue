<script setup lang="ts">
import { reactive, ref } from "vue";
import z from "zod";

import { ICONS } from "~/config/icons";
import { useInstructorsStore } from "~/stores/instructors";
import { getApiErrorMessage } from "~/utils/error";

definePageMeta({
  layout: "dashboard",
  auth: true,
  permission: "administration.roles.create",
});

const instructorStore = useInstructorsStore();
const { success, error: showError } = useNotification();
const router = useRouter();

const loading = ref(false);
const apiError = ref<string | null>(null);
const formRef = ref<InstanceType<typeof UForm> | null>(null);

const schema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(10, "Phone number is required"),
  bio: z.string().min(10, "Bio is required"),
  isActive: z.boolean().default(true),
});

type createInstructorSchema = z.output<typeof schema>;

const state = reactive<Partial<createInstructorSchema>>({
  fullName: "",
  email: "",
  phoneNumber: "",
  bio: "",
  isActive: true,
});

// function setApiError(error: string): void {
//   apiError.value = error;
// }

function clearApiError(): void {
  apiError.value = null;
}

async function handleCreateInstructor() {
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
      email: state.email,
      phoneNumber: state.phoneNumber,
      bio: state.bio,
      isActive: true,
    };
    await instructorStore.createInstructor(payload as { fullName: string; email: string; phoneNumber: string; bio: string; isActive: boolean });
    success({ message: "Instructor created successfully" });
    router.push("/instructors/instructors-list");
  }
  catch (error: unknown) {
    showError({ message: getApiErrorMessage(error, "Failed to create instructor") });
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
        Create New Instructor
      </template>
      <template #description>
        Create and manage instructor details
      </template>

      <template #actions>
        <NuxtLink to="/instructors/instructors-list">
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
        description="Start by entering the instructor personal details and a short description."
      />

      <UForm
        ref="formRef"
        :schema="schema"
        :state="state"
        :validate-on="['input', 'change', 'blur']"
      >
        <div class="bg-white flex flex-col gap-5 shadow-md rounded-lg p-4">
          <div class="flex flex-col md:flex-row gap-4 w-full">
            <base-input
              v-model="state.fullName"
              name="fullName"
              label="Instructor Name*"
              placeholder="Enter instructor name"
              class="w-full"
            />
            <base-input
              v-model="state.phoneNumber"
              name="phoneNumber"
              label="Phone Number*"
              placeholder="Enter phone number"
              class="w-full"
            />
          </div>

          <base-input
            v-model="state.email"
            name="email"
            label="Email Address*"
            placeholder="Enter email address"
            class="w-full"
          />

          <div>
            <base-text-editor
              v-model="state.bio"
              name="bio"
              label="About the Instructor*"
              placeholder="“Know your instructor” description for website..."
              class="w-full min-h-30 max-h-60 overflow-y-auto"
            />
          </div>

          <div class="flex justify-end">
            <base-button
              variant="solid"
              :loading="loading"
              @click="handleCreateInstructor"
            >
              Create Instructor
            </base-button>
          </div>
        </div>
      </UForm>
    </div>
  </div>
</template>
