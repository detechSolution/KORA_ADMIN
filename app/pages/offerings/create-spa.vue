<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from "vue";
import * as z from "zod";

import type { SpaSubType } from "~/types/spa";

import { useNotification } from "~/composables/use-notification";
import { ICONS } from "~/config/icons";
import { getApiErrorMessage } from "~/utils/error";

definePageMeta({
  auth: true,
  layout: "dashboard",
  permission: "offerings.services.view",
});

type StepItem = {
  title: string;
  description: string;
};

// type PricingRow = {
//   id: number;
//   duration: string;
//   timeUnit: "hours" | "minutes";
//   price: string;
// };

const spaStore = useSpaStore();
const { success, error: showError } = useNotification();
const route = useRoute();

const currentStep = ref(1);
const loading = ref(false);
const initialLoading = ref(false);
const apiError = ref<string | null>(null);
const formRef = ref<InstanceType<typeof UForm> | null>(null);

const steps: StepItem[] = [
  {
    title: "Spa Type Info",
    description: "spa-type name & description",
  },
  {
    title: "Configuration & Pricing",
    description: "Duration & Price",
  },
];

const form = reactive({
  name: "",
  description: "",
  prices: [
    {
      id: 1,
      duration: "1",
      timeUnit: "hours" as const,
      price: "",
    },
  ],
});

const timeUnitOptions = [
  { label: "Hours", value: "hours" },
  { label: "Minutes", value: "minutes" },
] as const;

const editId = computed(() => {
  const value = route.query.edit;
  const rawId = Array.isArray(value) ? value[0] : value;
  const parsedId = Number(rawId);

  return Number.isInteger(parsedId) && parsedId > 0 ? parsedId : null;
});

const isEditMode = computed(() => editId.value !== null);

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

const stepTwoSchema = z.object({
  prices: z.array(priceRowSchema).min(1, "At least one price is required"),
});

const schema = z
  .object({
    name: stepOneSchema.shape.name,
    description: stepOneSchema.shape.description,
    prices: stepTwoSchema.shape.prices,
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

function goToStep(step: number) {
  currentStep.value = step;
}

function previousStep() {
  currentStep.value = Math.max(currentStep.value - 1, 1);
}

function addPricingRow() {
  form.prices.push({
    id: Date.now(),
    duration: "",
    timeUnit: "hours",
    price: "",
  });
}

function removePricingRow(id: number) {
  if (form.prices.length === 1) {
    return;
  }

  form.prices = form.prices.filter(row => row.id !== id);
}

function setApiError(error: string): void {
  apiError.value = error;
}

function fillFormFromSubType(subType: SpaSubType): void {
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

function clearApiError(): void {
  apiError.value = null;
}

async function handleNext(): Promise<void> {
  const stepResult = stepOneSchema.safeParse({
    name: form.name,
    description: form.description,
  });

  if (!stepResult.success) {
    await formRef.value?.validate();
    return;
  }

  currentStep.value = Math.min(currentStep.value + 1, steps.length);
}

async function handleSubmit(): Promise<void> {
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
      name: form.name.trim(),
      description: form.description.trim(),
      prices: form.prices.map(price => ({
        duration: Number(price.duration),
        timeUnit: price.timeUnit,
        price: Number(price.price),
      })),
    };

    if (isEditMode.value && editId.value) {
      await spaStore.updateSpaSubType(editId.value, payload);
      success({ message: "Spa sub-type updated successfully" });
    }
    else {
      await spaStore.createSpaSubType(payload);
      success({ message: "Spa sub-type created successfully" });
    }

    await navigateTo("/offerings/spa");
  }
  catch (error: unknown) {
    const message = getApiErrorMessage(
      error,
      isEditMode.value
        ? "Failed to update spa sub-type. Please try again."
        : "Failed to create spa sub-type. Please try again.",
    );
    setApiError(message);
    await nextTick();
    await formRef.value?.validate();
    showError({ message });
  }
  finally {
    loading.value = false;
  }
}

async function loadSpaSubTypeForEdit(): Promise<void> {
  if (!editId.value) {
    return;
  }

  try {
    initialLoading.value = true;
    const subType = await spaStore.getSpaSubTypeById(editId.value);
    fillFormFromSubType(subType);
  }
  catch (error: unknown) {
    showError({
      message: getApiErrorMessage(error, "Failed to load spa sub-type."),
    });
    await navigateTo("/offerings/spa");
  }
  finally {
    initialLoading.value = false;
  }
}

onMounted(async () => {
  await loadSpaSubTypeForEdit();
});
</script>

<template>
  <div class="flex w-full flex-col gap-6">
    <base-page-header>
      <template #title>
        {{ isEditMode ? "Edit Spa Sub-types" : "Create Spa Sub-types" }}
      </template>

      <template #description>
        {{
          isEditMode
            ? "Update spa sub-types with their durations and pricing."
            : "Create spa sub-types with their durations and pricing."
        }}
      </template>

      <template #actions>
        <NuxtLink to="/offerings/spa">
          <base-button
            variant="outline"
            size="md"
            :leading-icon="ICONS.ARROW_LEFT"
          >
            Back to list
          </base-button>
        </NuxtLink>
      </template>
    </base-page-header>

    <UForm
      ref="formRef"
      :state="form"
      :schema="schema"
      :validate-on="['blur']"
    >
      <div class="rounded-3xl border border-stone-200 bg-white shadow-sm">
        <div
          class="grid min-h-107.5 grid-cols-1 lg:grid-cols-[350px_minmax(0,1fr)] relative"
        >
          <span class="mt-10 h-3/4 w-px bg-stone-200 absolute left-87.5" />
          <div class="border-b border-stone-200 p-6">
            <OfferingsSpaCreateStepper
              :steps="steps"
              :current-step="currentStep"
              @select="goToStep"
            />
          </div>

          <div class="bg-stone-50/40 p-4 sm:p-6 lg:p-8">
            <div
              v-if="initialLoading"
              class="mx-auto flex min-h-105 max-w-4xl items-center justify-center"
            >
              <UIcon
                :name="ICONS.REFRESH_CW"
                class="h-6 w-6 animate-spin text-secondary-500"
              />
            </div>

            <div v-else class="mx-auto flex max-w-full flex-col gap-6">
              <OfferingsSpaSectionCard
                :title="steps[currentStep - 1]?.title"
                :description="
                  currentStep === 1
                    ? 'Define the name and general description of this spa type'
                    : 'Configure the payment requirements for this spa type'
                "
                class="shadow-sm border border-stone-200 bg-stone-50"
              >
                <template #icon>
                  <span
                    class="flex h-7 w-7 items-center justify-center rounded-full text-primary"
                  >
                    <UIcon
                      :name="currentStep === 1 ? ICONS.INFO : ICONS.CREDIT_CARD"
                      class="h-4 w-4"
                    />
                  </span>
                </template>
              </OfferingsSpaSectionCard>

              <OfferingsSpaSectionCard
                v-if="currentStep === 1"
                class="shadow-[0px_2px_4px_-1px_#0000000F,0px_0px_6px_-1px_#0000001A] p-5"
              >
                <div class="grid gap-5">
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
              </OfferingsSpaSectionCard>

              <OfferingsSpaSectionCard
                v-else
                class="shadow-[0px_2px_4px_-1px_#0000000F,0px_0px_6px_-1px_#0000001A]"
              >
                <div class="grid gap-5">
                  <div class="rounded-2xl bg-white p-4 sm:p-5">
                    <div class="flex flex-col gap-4">
                      <div
                        v-for="(row, index) in form.prices"
                        :key="row.id"
                        class="rounded-[6px] border border-stone-200 bg-stone-50 p-4"
                      >
                        <div
                          class="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end"
                        >
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
                            placeholder="Enter Price"
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
              </OfferingsSpaSectionCard>

              <div class="flex items-center justify-between gap-3 pt-2">
                <base-button
                  v-if="currentStep > 1"
                  variant="outline"
                  size="md"
                  @click="previousStep"
                >
                  Previous
                </base-button>
                <div v-else />

                <base-button
                  variant="solid"
                  size="md"
                  :loading="loading"
                  @click="
                    currentStep === steps.length ? handleSubmit() : handleNext()
                  "
                >
                  {{
                    currentStep === steps.length
                      ? isEditMode
                        ? "Update Service"
                        : "Create Service"
                      : "Next"
                  }}
                </base-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UForm>
  </div>
</template>
