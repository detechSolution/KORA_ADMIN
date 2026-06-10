<script setup lang="ts">
import { reactive, ref } from "vue";
import z from "zod";

import type { CreateMembershipPlanPayload } from "~/types/membership";

import { ICONS } from "~/config/icons";
import { useMembershipStore } from "~/stores/membership";
import { getApiErrorMessage } from "~/utils/error";

definePageMeta({
  layout: "dashboard",
  auth: true,
  permission: "membership_plans.create",
});

const frequencyOptions = [
  { label: "Monthly", value: "monthly" },
  { label: "Quarterly", value: "quarterly" },
  { label: "Yearly", value: "yearly" },
  { label: "Custom", value: "custom" },
];

const membershipStore = useMembershipStore();
const { success, error: showError } = useNotification();
const router = useRouter();

const loading = ref(false);
const apiError = ref<string | null>(null);
const formRef = ref<InstanceType<typeof UForm> | null>(null);

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
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  isActive: z.boolean(),
  options: z.array(optionSchema).min(1, "At least one frequency option is required"),
});

type CreatePlanSchema = z.output<typeof schema>;

const state = reactive<Partial<CreatePlanSchema>>({
  name: "",
  description: "",
  isActive: false,
  options: [
    {
      frequency: "monthly",
      customDays: null,
      price: 0,
      memberBenefit: 0,
      isVisible: true,
    },
  ],
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

function clearApiError(): void {
  apiError.value = null;
}

async function handleCreatePlan() {
  try {
    await formRef.value?.validate();
  }
  catch {
    return;
  }
  try {
    loading.value = true;
    clearApiError();
    const payload: CreateMembershipPlanPayload = {
      name: state.name,
      description: state.description,
      isActive: state.isActive,
      options: state.options.map(opt => ({
        frequency: opt.frequency,
        ...(opt.frequency === "custom" && { customDays: opt.customDays }),
        price: opt.price,
        memberBenefit: opt.memberBenefit,
        isVisible: opt.isVisible,
      })),
    };
    await membershipStore.createPlan(payload);
    success({ message: "Membership plan created successfully" });
    router.push("/members/plans");
  }
  catch (error: unknown) {
    showError({ message: getApiErrorMessage(error, "Something went wrong. Please try again.") });
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
        Create Membership Plan
      </template>
      <template #description>
        Create and manage membership plans
      </template>

      <template #actions>
        <NuxtLink to="/members/plans">
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
        label="Create Membership Plan"
        description="Create a membership plan by adding basic details below."
      />

      <UForm
        ref="formRef"
        :schema="schema"
        :state="state"
        :validate-on="['input', 'change', 'blur']"
        class="flex flex-col gap-6"
      >
        <div class="bg-white flex flex-col gap-5 shadow-md rounded-lg p-4">
          <div class="flex flex-col gap-4 w-full">
            <base-input
              v-model="state.name"
              name="name"
              label="Plan Name*"
              placeholder="Enter plan name"
            />

            <base-text-editor
              v-model="state.description"
              name="description"
              label="Plan Offerings*"
              placeholder="Plan offerings in bullet points"
            />

            <base-switch
              v-model="state.isActive"
              name="isActive"
              label="Status"
              on-label="Active"
              off-label="Inactive"
              color="base"
            />
          </div>
        </div>
        <USeparator />

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
              :trailing-icon="ICONS.PERCENT"
            />
          </div>

          <div class="flex items-center justify-between gap-4 ">
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

        <USeparator />

        <div class="flex justify-end">
          <base-button
            variant="solid"
            :loading="loading"
            @click="handleCreatePlan"
          >
            Create Plan
          </base-button>
        </div>
      </UForm>
    </div>
  </div>
</template>

<style>

</style>
