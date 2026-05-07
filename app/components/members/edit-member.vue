<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import z from "zod";

import type { MembershipPlan, UpdateMembershipPlanPayload } from "~/types/membership";

import { useNotification } from "~/composables/use-notification";
import { ICONS } from "~/config/icons";
import { useMembershipStore } from "~/stores/membership";
import { getApiErrorMessage } from "~/utils/error";

type Props = {
  open: boolean;
  plan: MembershipPlan | null;
};

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  updated: [];
}>();

const options = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
  { label: "Blacklisted", value: "blacklisted" },
  { label: "Paused", value: "paused" },
];

const membershipStore = useMembershipStore();
const { success, error: showError } = useNotification();

const loading = ref(false);
const formRef = ref<InstanceType<typeof UForm> | null>(null);

const schema = z.object({
  fullName: z.string().min(1, "Plan name is required"),
  phoneNumber: z.string().min(1, "Description is required"),
  email: z.string().email(),
  status: z.enum(options.map(option => option.value)),
});

type EditPlanSchema = z.output<typeof schema>;

const state = reactive<Partial<EditPlanSchema>>({
  fullName: "",
  phoneNumber: "",
  email: "",
  status: "active",
});

// function populateForm(plan: MembershipPlan | null): void {

// }

function closeDrawer(): void {
  emit("close");
}

async function handleSubmit(): Promise<void> {
  try {
    await formRef.value?.validate();
  }
  catch {
    return;
  }

  if (!props.plan?.id) {
    showError({ message: "Invalid plan selected." });
    return;
  }

  try {
    loading.value = true;

    const payload: UpdateMembershipPlanPayload = {
      name: state.name!,
      description: state.description!,
      isActive: state.isActive!,
      options: (state.options ?? []).map(opt => ({
        frequency: opt.frequency,
        ...(opt.frequency === "custom" && { customDays: opt.customDays }),
        price: opt.price,
        memberBenefit: opt.memberBenefit,
        isVisible: opt.isVisible,
      })),
    };

    await membershipStore.updatePlan(Number(props.plan.id), payload);
    success({ message: "Plan updated successfully" });
    emit("updated");
    closeDrawer();
  }
  catch (error: unknown) {
    showError({
      message: getApiErrorMessage(error, "Failed to update plan."),
    });
  }
  finally {
    loading.value = false;
  }
}

watch(
  () => [props.open, props.plan] as const,
  ([open]) => {
    if (open) {
      // populateForm(props.plan);
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
      class="flex min-h-0 flex-1 flex-col"
    >
      <div class="flex items-center justify-between border-b border-stone-200 px-5 py-4">
        <h2 class="text-lg font-semibold text-secondary">
          Edit Plan
        </h2>

        <button
          type="button"
          class="rounded-md p-1 text-secondary-400 transition hover:bg-stone-100 hover:text-secondary"
          @click="closeDrawer"
        >
          <UIcon :name="ICONS.X" class="h-4 w-4" />
        </button>
      </div>

      <div class="flex-1 overflow-y-auto px-5 py-5">
        <div class="grid gap-5">
          <base-input
            v-model="state.name"
            label="Member Name"
            name="name"
            placeholder="Enter member name"
          />
          <div class="flex flex-col md:flex-row gap-4">
            <base-input
              v-model="state.phoneNumber"
              label="Phone Number"
              name="phoneNumber"
              placeholder="Enter phone number"
            />
            <base-input
              v-model="state.email"
              label="Email"
              name="email"
              placeholder="Enter email"
            />
          </div>
          <base-select
            :options="options"
            label="Status"
            name="status"
            placeholder="Select status"
          />
        </div>
      </div>

      <div class="p-6 flex flex-col gap-4">
        <h2 class="text-stone-900 text-base font-semibold">
          Membership Plans
        </h2>

        <div class="flex border justify-between items-center p-3 border-stone-200 rounded-sm">
          <div class="flex flex-col gap-1">
            <h2 class="font-medium text-xs">
              Kora Premium
            </h2>
            <p class="text-secondary-400 text-xs">
              date
            </p>
            <base-badge class="w-fit">
              Monthly
            </base-badge>
          </div>
          <p class="text-stone-500 text-xs font-semibold">
            Rs. 10,000/month
          </p>
        </div>
      </div>

      <div class="flex items-center justify-between border-t border-stone-200 px-5 py-4">
        <base-button
          variant="outline"
          size="md"
          @click="closeDrawer"
        >
          Cancel
        </base-button>

        <base-button
          variant="solid"
          size="md"
          :loading="loading"
          @click="handleSubmit"
        >
          Update Plan
        </base-button>
      </div>
    </UForm>
  </base-drawer>
</template>
