<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import z from "zod";

import type { Instructor } from "~/types/instructors";

import { useInstructorsStore } from "~/stores/instructors";

type Props = {
  open: boolean;
  instructor: Instructor | null;
};

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "updated"): void;
}>();

const { error: showError } = useNotification();
const instructorStore = useInstructorsStore();
const formRef = ref<InstanceType<typeof UForm> | null>(null);
const loading = ref(false);

const schema = z.object({
  fullName: z.string().min(1, "Instructor name is required"),
  email: z.string().email("Invalid email address").optional(),
  phoneNumber: z.string().optional(),
  bio: z.string().optional(),
  isActive: z.boolean(),
});

type InstructorForm = z.infer<typeof schema>;

const state = reactive<Partial<InstructorForm>>({
  fullName: "",
  email: "",
  phoneNumber: "",
  bio: "",
  isActive: true,
});

function populateForm(instructor: Instructor | null): void {
  state.fullName = instructor.fullName ?? "";
  state.email = instructor.email ?? "";
  state.phoneNumber = instructor.phoneNumber ?? "";
  state.bio = instructor.bio ?? "";
  state.isActive = instructor.isActive ?? true;
}

async function handleUpdate(): Promise<void> {
  try {
    await formRef.value?.validate();
  }
  catch {
    return;
  }

  if (!props.instructor?.id) {
    showError({ message: "Invalid instructor selected." });
    return;
  }
  try {
    loading.value = true;

    const payload = {
      fullName: state.fullName,
      email: state.email,
      phoneNumber: state.phoneNumber,
      bio: state.bio,
      isActive: state.isActive,
    };
    await instructorStore.updateInstructor(props.instructor?.id, payload);

    emit("updated");
    emit("close");
  }
  catch (error: any) {
    console.error("Validation failed:", error);
    showError({ message: error.message || "Failed to update instructor" });
  }
  finally {
    loading.value = false;
  }
}

watch(
  () => [props.open, props.instructor] as const,
  ([open]) => {
    if (open) {
      populateForm(props.instructor);
    }
  },
  { immediate: true },
);
</script>

<template>
  <base-drawer
    :open="open"
    :drawer-width="480"
    title="Edit Instructor"
    @close="emit('close')"
  >
    <UForm
      ref="formRef"
      :state="state"
      :schema="schema"
      :validate-on="['input', 'change', 'blur']"
      class="flex min-h-0 flex-1 flex-col"
    >
      <div class="flex-1 overflow-y-auto p-5">
        <div class="grid gap-5">
          <base-input
            v-model="state.fullName"
            name="fullName"
            label="Instructor Name"
            placeholder="Enter instructor name"
          />
          <base-input
            v-model="state.email"
            name="email"
            label="Email"
            placeholder="Enter email address"
            type="email"
            class="w-full"
          />
          <base-input
            v-model="state.phoneNumber"
            name="phoneNumber"
            label="Phone Number"
            placeholder="Enter phone number"
            class="w-full"
          />

          <div class="w-full overflow-auto">
            <base-text-editor
              v-model="state.bio"
              name="bio"
              label="About the Instructor"
              placeholder="Enter instructor bio"
              class="w-full"
            />
          </div>
          <base-switch
            v-model="state.isActive"
            name="isActive"
            label="Status"
          />
        </div>
      </div>

      <div
        class="flex items-center justify-between border-t border-stone-200 px-4 py-4 mt-6"
      >
        <base-button variant="outline" @click="emit('close')">
          Cancel
        </base-button>

        <base-button
          variant="solid"
          :loading="loading"
          @click="handleUpdate"
        >
          Update
        </base-button>
      </div>
    </UForm>
  </base-drawer>
</template>
