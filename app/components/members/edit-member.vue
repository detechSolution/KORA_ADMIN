<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import z from "zod";

import type { Member } from "~/types/membership";

import { useNotification } from "~/composables/use-notification";
import { useMembershipStore } from "~/stores/membership";
import { preventInvalidNumberInput } from "~/utils/common";
import { getApiErrorMessage } from "~/utils/error";

type Props = {
  open: boolean;
  plan: Member;
};

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  updated: [];
}>();

const membershipStore = useMembershipStore();
const { success, error: showError } = useNotification();

const loading = ref(false);
const formRef = ref<InstanceType<typeof UForm> | null>(null);

const schema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  phoneNumber: z.coerce.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
  email: z.string().email(),
});

type EditMemberSchema = z.output<typeof schema>;

const state = reactive<Partial<EditMemberSchema>>({
  fullName: "",
  phoneNumber: "",
  email: "",
});

function populateForm(plan: Member | null): void {
  if (!plan)
    return;
  state.fullName = plan.fullName;
  state.phoneNumber = plan.phoneNumber;
  state.email = plan.email;
}

async function handleSubmit(): Promise<void> {
  try {
    await formRef.value?.validate();
    loading.value = true;
    await membershipStore.updateMember(props.plan.id, {
      fullName: state.fullName,
      phoneNumber: state.phoneNumber,
      email: state.email,
    });
    success({ message: "Member updated successfully" });
    emit("updated");
    emit("close");
  }
  catch (error: unknown) {
    showError({ message: getApiErrorMessage(error, "Failed to update member.") });
  }
  finally {
    loading.value = false;
  }
}

watch(
  () => [props.open, props.plan] as const,
  ([open]) => {
    if (open) {
      populateForm(props.plan);
    }
  },
  { immediate: true },
);
</script>

<template>
  <base-drawer
    :open="open"
    :drawer-width="480"
    @close="emit('close')"
  >
    <UForm
      ref="formRef"
      :state="state"
      :schema="schema"
      :validate-on="['input', 'change', 'blur']"
      class="flex min-h-0 justify-between flex-1 flex-col"
    >
      <section class="grid gap-5 p-6">
        <base-input
          v-model="state.fullName"
          label="Member Name"
          name="fullName"
          placeholder="Enter member name"
        />
        <div class="flex flex-col md:flex-row gap-4">
          <base-input
            v-model="state.phoneNumber"
            label="Phone Number"
            name="phoneNumber"
            placeholder="Enter phone number"
            type="tel"
            @keydown="preventInvalidNumberInput"
          />
          <base-input
            v-model="state.email"
            label="Email"
            name="email"
            placeholder="Enter email"
          />
        </div>
      </section>

      <div class="flex items-center justify-end border-t border-stone-200 px-5 py-4">
        <base-button
          variant="solid"
          size="md"
          :loading="loading"
          @click="handleSubmit"
        >
          Update Member
        </base-button>
      </div>
    </UForm>
  </base-drawer>
</template>
