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

const membershipStore = useMembershipStore();
const { success, error: showError } = useNotification();

const loading = ref(false);
const formRef = ref<InstanceType<typeof UForm> | null>(null);

const frequencyOptions = [
  { label: "Monthly", value: "monthly" },
  { label: "Quarterly", value: "quarterly" },
  { label: "Yearly", value: "yearly" },
  { label: "Custom", value: "custom" },
];

const optionSchema = z.object({
  frequency: z.string().min(1, "Frequency is required"),
  customDays: z.number().nullable(),
  price: z.number().min(0, "Price must be a positive number"),
  memberBenefit: z.number().min(0, "Member benefit must be a positive number"),
  isVisible: z.boolean(),
}).refine(
  (data) => {
    if (data.frequency === "custom") {
      return data.customDays !== null && data.customDays >= 1;
    }
    return true;
  },
  {
    message: "Custom days must be at least 1",
    path: ["customDays"],
  },
);

const schema = z.object({
  name: z.string().min(1, "Plan name is required"),
  description: z.string().min(1, "Description is required"),
  isActive: z.boolean(),
  options: z.array(optionSchema).min(1, "At least one frequency option is required"),
});

type EditPlanSchema = z.output<typeof schema>;

const state = reactive<Partial<EditPlanSchema>>({
  name: "",
  description: "",
  isActive: true,
  options: [],
});

function addOption() {
  state.options!.push({
    frequency: "monthly",
    customDays: null,
    price: 0,
    memberBenefit: 0,
    isVisible: true,
  });
}

function removeOption(index: number) {
  if (state.options!.length > 1) {
    state.options!.splice(index, 1);
  }
}

function populateForm(plan: MembershipPlan | null): void {
  state.name = plan?.name;
  state.description = plan?.description;
  state.isActive = plan?.isActive;
  state.options = plan?.options?.map(opt => ({
    frequency: opt.frequency,
    customDays: opt.customDays,
    price: opt.price,
    memberBenefit: opt.memberBenefit,
    isVisible: opt.isVisible,
  })) ?? [{
    frequency: "monthly",
    customDays: null,
    price: 0,
    memberBenefit: 0,
    isVisible: true,
  }];
}

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
      class="flex min-h-0 flex-1 flex-col"
    >
      <div class="flex-1 overflow-y-auto px-5 py-5">
        <div class="grid gap-5">
          <base-input
            v-model="state.name"
            name="name"
            label="Plan Name*"
            placeholder="Enter plan name"
          />

          <div class="w-full overflow-auto">
            <base-text-editor
              v-model="state.description"
              name="description"
              label="Plan Offerings*"
              placeholder="Plan offerings in bullet points"
            />
          </div>

          <base-switch
            v-model="state.isActive"
            name="isActive"
            label="Status"
            on-label="Active"
            off-label="Inactive"
            color="base"
          />

          <USeparator />

          <div class="flex flex-col gap-4">
            <div
              v-for="(option, index) in state.options"
              :key="index"
              class="bg-white flex flex-col gap-5 shadow-md rounded-lg p-4"
            >
              <div class="flex gap-4 w-full flex-col md:flex-row">
                <base-select
                  v-model="option.frequency"
                  :name="`options.${index}.frequency`"
                  label="Frequency*"
                  placeholder="Select plan frequency"
                  :options="frequencyOptions"
                  class="w-full"
                />
                <base-input
                  v-model="option.price"
                  :name="`options.${index}.price`"
                  label="Price*"
                  placeholder="Enter plan price"
                  class="w-full"
                  type="number"
                />
              </div>

              <div class="flex gap-4 w-full flex-col md:flex-row">
                <base-input
                  v-if="option.frequency === 'custom'"
                  v-model="option.customDays"
                  :name="`options.${index}.customDays`"
                  label="Enter custom days*"
                  placeholder="Enter number of days"
                  type="number"
                  class="w-full md:w-1/2"
                />
                <base-input
                  v-model="option.memberBenefit"
                  :name="`options.${index}.memberBenefit`"
                  label="Member Benefit"
                  placeholder="Enter member benefit"
                  class="w-full md:w-1/2"
                  type="number"
                />
              </div>

              <div class="flex items-center justify-between gap-4">
                <base-switch
                  v-model="option.isVisible"
                  :name="`options.${index}.isVisible`"
                  label="Visibility"
                  on-label="Active"
                  off-label="Inactive"
                  color="base"
                />

                <base-button
                  v-if="state.options.length > 1"
                  variant="ghost"
                  class="text-red-500 font-medium text-xs"
                  @click="removeOption(index)"
                >
                  Remove
                  <UIcon :name="ICONS.TRASH" />
                </base-button>
              </div>
            </div>
            <base-button
              variant="outline"
              @click="addOption"
            >
              <UIcon :name="ICONS.PLUS" />
              Add Frequency
            </base-button>
          </div>
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
