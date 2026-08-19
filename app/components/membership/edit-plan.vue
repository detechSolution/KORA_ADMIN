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

function pct(label: string) {
  return z
    .number({ error: `${label} must be a number` })
    .min(0, `${label} cannot be negative`)
    .max(100, `${label} cannot exceed 100%`);
}

const optionSchema = z.object({
  frequency: z.string().min(1, "Frequency is required"),
  customDays: z.number().nullable(),
  price: z.number({ error: "Price must be a number" }).min(0, "Price cannot be negative"),
  isVisible: z.boolean(),
}).refine(
  data => data.frequency !== "custom" || (data.customDays !== null && data.customDays >= 1),
  { message: "Custom days must be at least 1", path: ["customDays"] },
);

const schema = z.object({
  name: z.string().min(1, "Plan name is required"),
  freezeDays: z
    .number({ error: "Freeze days must be a number" })
    .refine(
      value => value === 0 || value >= 7,
      { message: "Freeze days must be 0 or at least 7" },
    ),
  maxVisitors: z.number({ error: "Max visitors must be a number" }).min(0, "Max visitors cannot be less than 0"),
  spaBenefit: pct("Spa benefit"),
  classBenefit: pct("Class benefit"),
  eventBenefit: pct("Event benefit"),
  workshopBenefit: pct("Workshop benefit"),
  spaGuestBenefit: pct("Spa guest benefit"),
  classGuestBenefit: pct("Class guest benefit"),
  eventGuestBenefit: pct("Event guest benefit"),
  workshopGuestBenefit: pct("Workshop guest benefit"),
  description: z.string().min(1, "Description is required"),
  isPurchasable: z.boolean(),
  options: z.array(optionSchema).min(1, "At least one frequency option is required"),
});

type EditPlanSchema = z.output<typeof schema>;

const state = reactive<Partial<EditPlanSchema>>({
  name: "",
  freezeDays: 0,
  maxVisitors: 0,
  spaBenefit: 0,
  classBenefit: 0,
  eventBenefit: 0,
  workshopBenefit: 0,
  spaGuestBenefit: 0,
  classGuestBenefit: 0,
  eventGuestBenefit: 0,
  workshopGuestBenefit: 0,
  description: "",
  isPurchasable: true,
  options: [],
});

function addOption() {
  state.options!.push({
    frequency: "monthly",
    customDays: null,
    price: 0,
    isVisible: true,
  });
}

function removeOption(index: number) {
  if (state.options!.length > 1) {
    state.options!.splice(index, 1);
  }
}

function populateForm(plan: MembershipPlan | null): void {
  state.name = plan?.name ?? "";
  state.description = plan?.description ?? "";
  state.isPurchasable = plan?.isPurchasable ?? true;
  state.freezeDays = plan?.freezeDays ?? 0;
  state.maxVisitors = plan?.maxVisitors ?? 0;
  state.spaBenefit = plan?.spaBenefit ?? 0;
  state.classBenefit = plan?.classBenefit ?? 0;
  state.eventBenefit = plan?.eventBenefit ?? 0;
  state.workshopBenefit = plan?.workshopBenefit ?? 0;
  state.spaGuestBenefit = plan?.spaGuestBenefit ?? 0;
  state.classGuestBenefit = plan?.classGuestBenefit ?? 0;
  state.eventGuestBenefit = plan?.eventGuestBenefit ?? 0;
  state.workshopGuestBenefit = plan?.workshopGuestBenefit ?? 0;
  state.options = plan?.options?.map(opt => ({
    frequency: opt.frequency,
    customDays: opt.customDays ?? null,
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
      isPurchasable: state.isPurchasable!,
      isFreezable: (state.freezeDays ?? 0) > 0,
      freezeDays: state.freezeDays!,
      maxVisitors: state.maxVisitors!,
      spaBenefit: state.spaBenefit!,
      classBenefit: state.classBenefit!,
      eventBenefit: state.eventBenefit!,
      workshopBenefit: state.workshopBenefit!,
      spaGuestBenefit: state.spaGuestBenefit!,
      classGuestBenefit: state.classGuestBenefit!,
      eventGuestBenefit: state.eventGuestBenefit!,
      workshopGuestBenefit: state.workshopGuestBenefit!,
      options: (state.options ?? []).map(opt => ({
        frequency: opt.frequency,
        ...(opt.frequency === "custom" && { customDays: opt.customDays }),
        price: opt.price,
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
          <base-input
            v-model="state.freezeDays"
            name="freezeDays"
            label="Freeze Days*"
            placeholder="Enter freeze days"
            type="number"
          />
          <base-input
            v-model="state.maxVisitors"
            name="maxVisitors"
            label="Max Visitors*"
            placeholder="Enter max visitors"
            type="number"
          />

          <USeparator />

          <div class="flex flex-col gap-0.5">
            <h3 class="text-sm text-secondary font-medium">
              Member Benefit
            </h3>
            <p class="text-secondary-500 text-xs">
              Set a discount percentage for members on this plan. Leave as 0 if no discount applies.
            </p>
          </div>

          <div class="flex justify-between gap-4 w-full">
            <base-input
              v-model="state.spaBenefit"
              name="spaBenefit"
              label="Spa*"
              placeholder="0"
              type="number"
              class="w-full"
              :trailing-icon="ICONS.PERCENT"
            />
            <base-input
              v-model="state.classBenefit"
              name="classBenefit"
              label="Class*"
              placeholder="0"
              type="number"
              class="w-full"
              :trailing-icon="ICONS.PERCENT"
            />
          </div>

          <div class="flex justify-between gap-4 w-full">
            <base-input
              v-model="state.eventBenefit"
              name="eventBenefit"
              label="Event*"
              placeholder="0"
              type="number"
              class="w-full"
              :trailing-icon="ICONS.PERCENT"
            />
            <base-input
              v-model="state.workshopBenefit"
              name="workshopBenefit"
              label="Workshop*"
              placeholder="0"
              type="number"
              class="w-full"
              :trailing-icon="ICONS.PERCENT"
            />
          </div>
          <USeparator />

          <div class="flex flex-col gap-0.5">
            <h3 class="text-sm text-secondary font-medium">
              Guest Benefit
            </h3>
            <p class="text-secondary-500 text-xs">
              Set a discount percentage for member’s guest. For services that do not require a benefit discount, please leave the value as 0
            </p>
          </div>

          <div class="flex gap-4 w-full">
            <base-input
              v-model="state.spaGuestBenefit"
              name="spaGuestBenefit"
              label="Spa*"
              placeholder="0"
              type="number"
              class="w-full"
              :trailing-icon="ICONS.PERCENT"
            />
            <base-input
              v-model="state.classGuestBenefit"
              name="classGuestBenefit"
              label="Class*"
              placeholder="0"
              type="number"
              class="w-full"
              :trailing-icon="ICONS.PERCENT"
            />
          </div>
          <div class="flex gap-4 w-full">
            <base-input
              v-model="state.eventGuestBenefit"
              name="eventGuestBenefit"
              label="Event*"
              placeholder="0"
              type="number"
              class="w-full"
              :trailing-icon="ICONS.PERCENT"
            />
            <base-input
              v-model="state.workshopGuestBenefit"
              name="workshopGuestBenefit"
              label="Workshop*"
              placeholder="0"
              type="number"
              class="w-full"
              :trailing-icon="ICONS.PERCENT"
            />
          </div>

          <USeparator />

          <div class="w-full overflow-auto">
            <base-text-editor
              v-model="state.description"
              name="description"
              label="Plan Offerings*"
              placeholder="Plan offerings in bullet points"
            />
          </div>

          <base-switch
            v-model="state.isPurchasable"
            name="isPurchasable"
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

              <base-input
                v-if="option.frequency === 'custom'"
                v-model="option.customDays"
                :name="`options.${index}.customDays`"
                label="Enter custom days*"
                placeholder="Enter number of days"
                type="number"
              />

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
