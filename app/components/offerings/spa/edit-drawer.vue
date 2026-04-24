<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from "vue";
import * as z from "zod";

import type { SpaSubType } from "~/types/spa";

import { useNotification } from "~/composables/use-notification";
import { ICONS } from "~/config/icons";
import { useSpaStore } from "~/stores/spa";
import { getApiErrorMessage } from "~/utils/error";

type PricingRow = {
  id: number;
  duration: string;
  timeUnit: "hours" | "minutes";
  price: string;
};

type Props = {
  open: boolean;
  serviceId: number | null;
};

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "updated"): void;
}>();

const spaStore = useSpaStore();
const { success, error: showError } = useNotification();

const currentStep = ref(1);
const loading = ref(false);
const initialLoading = ref(false);
const apiError = ref<string | null>(null);
const formRef = ref<InstanceType<typeof UForm> | null>(null);

const steps = [
  { title: "Service Info" },
  { title: "Configuration & Pricing" },
] as const;

const timeUnitOptions = [
  { label: "Hours", value: "hours" },
  { label: "Minutes", value: "minutes" },
] as const;

const form = reactive<{
  name: string;
  description: string;
  prices: PricingRow[];
}>({
  name: "",
  description: "",
  prices: [
    {
      id: 1,
      duration: "1",
      timeUnit: "hours",
      price: "",
    },
  ],
});

const isOpen = computed({
  get: () => props.open,
  set: (value: boolean) => {
    if (!value) {
      emit("close");
    }
  },
});

const priceRowSchema = z.object({
  id: z.number(),
  duration: z
    .string()
    .trim()
    .min(1, "Duration is required")
    .refine((value) => {
      const numeric = Number(value);
      return !Number.isNaN(numeric) && numeric > 0;
    }, "Duration must be greater than 0"),
  timeUnit: z.enum(["hours", "minutes"]),
  price: z
    .string()
    .trim()
    .min(1, "Price is required")
    .refine((value) => {
      const numeric = Number(value);
      return !Number.isNaN(numeric) && numeric >= 0;
    }, "Price must be a valid non-negative number"),
});

const stepOneSchema = z.object({
  name: z.string().trim().min(1, "Spa type name is required"),
  description: z.string().trim().min(1, "Description is required"),
});

const schema = z
  .object({
    name: stepOneSchema.shape.name,
    description: stepOneSchema.shape.description,
    prices: z.array(priceRowSchema).min(1, "At least one price is required"),
  })
  .superRefine((_data, ctx) => {
    if (!apiError.value) {
      return;
    }

    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: currentStep.value === 1 ? ["name"] : ["prices", 0, "price"],
      message: apiError.value,
    });
  });

function resetForm(): void {
  currentStep.value = 1;
  apiError.value = null;
  form.name = "";
  form.description = "";
  form.prices = [
    {
      id: 1,
      duration: "1",
      timeUnit: "hours",
      price: "",
    },
  ];
}

function clearApiError(): void {
  apiError.value = null;
}

function closeDrawer(): void {
  emit("close");
}

function previousStep(): void {
  currentStep.value = Math.max(currentStep.value - 1, 1);
}

function addPricingRow(): void {
  clearApiError();
  form.prices.push({
    id: Date.now(),
    duration: "",
    timeUnit: "hours",
    price: "",
  });
}

function removePricingRow(id: number): void {
  if (form.prices.length === 1) {
    return;
  }

  clearApiError();
  form.prices = form.prices.filter(row => row.id !== id);
}

function fillForm(subType: SpaSubType): void {
  form.name = subType.name;
  form.description = subType.description ?? "";
  form.prices = subType.prices.length
    ? subType.prices.map(price => ({
        id: price.id,
        duration: String(price.duration),
        timeUnit: price.timeUnit,
        price: String(price.price),
      }))
    : [
        {
          id: Date.now(),
          duration: "1",
          timeUnit: "hours",
          price: "",
        },
      ];
}

async function handleNext(): Promise<void> {
  const result = stepOneSchema.safeParse({
    name: form.name,
    description: form.description,
  });

  if (!result.success) {
    await formRef.value?.validate();
    return;
  }

  currentStep.value = 2;
}

async function handleUpdate(): Promise<void> {
  if (!props.serviceId) {
    return;
  }

  try {
    await formRef.value?.validate();
  }
  catch {
    return;
  }

  try {
    loading.value = true;
    clearApiError();

    await spaStore.updateSpaSubType(props.serviceId, {
      name: form.name.trim(),
      description: form.description.trim(),
      prices: form.prices.map(price => ({
        duration: Number(price.duration),
        timeUnit: price.timeUnit,
        price: Number(price.price),
      })),
    });

    success({ message: "Spa sub-type updated successfully" });
    emit("updated");
    closeDrawer();
  }
  catch (error: unknown) {
    apiError.value = getApiErrorMessage(error, "Failed to update spa sub-type. Please try again.");
    await nextTick();
    await formRef.value?.validate();
    showError({ message: apiError.value });
  }
  finally {
    loading.value = false;
  }
}

async function loadService(id: number): Promise<void> {
  try {
    initialLoading.value = true;
    const subType = await spaStore.getSpaSubTypeById(id);
    fillForm(subType);
  }
  catch (error: unknown) {
    showError({
      message: getApiErrorMessage(error, "Failed to load spa sub-type."),
    });
    closeDrawer();
  }
  finally {
    initialLoading.value = false;
  }
}

watch(
  () => props.open,
  async (isOpenNow) => {
    if (!isOpenNow || !props.serviceId) {
      resetForm();
      return;
    }

    resetForm();
    await nextTick();
    await loadService(props.serviceId);
  },
);
</script>

<template>
  <UDrawer
    v-model:open="isOpen"
    direction="right"
    :dismissible="true"
    :handle="false"
    :ui="{
      content: 'inset-y-0 right-0 flex h-screen w-full max-w-[520px] flex-col overflow-hidden rounded-none bg-white shadow-2xl',
      overlay: 'bg-black/50',
    }"
  >
    <template #content>
      <UForm
        ref="formRef"
        :state="form"
        :schema="schema"
        :validate-on="['blur']"
        class="flex min-h-0 flex-1 flex-col"
      >
        <div class="flex items-center justify-between border-b border-stone-200 px-5 py-4">
          <h2 class="text-lg font-semibold text-secondary">
            Edit Service
          </h2>
          <button
            type="button"
            class="rounded-md p-1 text-secondary-400 transition hover:bg-stone-100 hover:text-secondary"
            @click="closeDrawer"
          >
            <UIcon :name="ICONS.X" class="h-4 w-4" />
          </button>
        </div>

        <div v-if="initialLoading" class="flex flex-1 items-center justify-center">
          <UIcon
            :name="ICONS.REFRESH_CW"
            class="h-6 w-6 animate-spin text-secondary-500"
          />
        </div>

        <template v-else>
          <div class="flex items-center gap-3 px-5 py-5">
            <template v-for="(step, index) in steps" :key="step.title">
              <button
                type="button"
                class="flex min-w-0 flex-col items-center gap-1 text-center"
                @click="currentStep = index + 1"
              >
                <span
                  class="flex h-7 w-7 items-center justify-center rounded-full border text-xs font-medium"
                  :class="index + 1 === currentStep
                    ? 'border-primary-700 bg-primary-700 text-white'
                    : 'border-primary-700 text-primary-700'"
                >
                  {{ index + 1 }}
                </span>
                <span class="text-[11px] text-secondary">
                  {{ step.title }}
                </span>
              </button>

              <div
                v-if="index !== steps.length - 1"
                class="mb-5 h-px flex-1 bg-stone-200"
              />
            </template>
          </div>

          <div class="flex-1 overflow-y-auto px-5 pb-6">
            <div v-if="currentStep === 1" class="grid gap-5">
              <base-input
                v-model="form.name"
                name="name"
                label="Spa Type Name"
                placeholder="e.g. Oil massage, stone healing"
                required
                @update:model-value="clearApiError"
              />

              <base-input
                v-model="form.description"
                name="description"
                label="About This Service Type"
                type="textarea"
                placeholder="Describe this service type"
                required
                @update:model-value="clearApiError"
              />
            </div>

            <div v-else class="rounded-[6px] border border-stone-200 bg-white p-4">
              <div class="flex max-h-[420px] flex-col gap-4 overflow-y-auto pr-1">
                <div
                  v-for="(row, index) in form.prices"
                  :key="row.id"
                  class="rounded-[6px] border border-stone-200 bg-stone-50 p-4"
                >
                  <div class="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
                    <base-input
                      v-model="row.duration"
                      :name="`prices.${index}.duration`"
                      label="Duration"
                      placeholder="Enter duration"
                      required
                      @update:model-value="clearApiError"
                    />

                    <base-select
                      v-model="row.timeUnit"
                      :name="`prices.${index}.timeUnit`"
                      label="Time Unit"
                      :options="[...timeUnitOptions]"
                      required
                    />

                    <base-input
                      v-model="row.price"
                      :name="`prices.${index}.price`"
                      label="Price (Rs)"
                      placeholder="Enter price"
                      required
                      @update:model-value="clearApiError"
                    />

                    <base-button
                      v-if="form.prices.length > 1"
                      variant="ghost"
                      size="md"
                      class="md:mb-1"
                      @click="removePricingRow(row.id)"
                    >
                      Remove
                    </base-button>
                  </div>
                </div>
              </div>

              <button
                type="button"
                class="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary-700 transition hover:text-primary-800"
                @click="addPricingRow"
              >
                <UIcon :name="ICONS.PLUS" class="h-4 w-4" />
                Add Duration
              </button>
            </div>
          </div>

          <div class="flex items-center justify-between border-t border-stone-200 px-5 py-4">
            <base-button
              v-if="currentStep === 1"
              variant="outline"
              size="md"
              @click="closeDrawer"
            >
              Cancel
            </base-button>
            <base-button
              v-else
              variant="outline"
              size="md"
              @click="previousStep"
            >
              Back
            </base-button>

            <base-button
              variant="solid"
              size="md"
              :loading="loading"
              @click="currentStep === 1 ? handleNext() : handleUpdate()"
            >
              {{ currentStep === 1 ? "Next" : "Update" }}
            </base-button>
          </div>
        </template>
      </UForm>
    </template>
  </UDrawer>
</template>
