<script setup lang="ts">
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import * as z from "zod";

import { useNotification } from "~/composables/use-notification";
import { ICONS } from "~/config/icons";
import { useKoraPassesStore } from "~/stores/kora-passes";
import { getApiErrorMessage } from "~/utils/error";

definePageMeta({
  auth: true,
  layout: "dashboard",
  permission: "offerings.kora_passes.create",
});

const router = useRouter();
const { success: showSuccess, error: showError } = useNotification();
const koraPassesStore = useKoraPassesStore();

const loading = ref(false);
const formRef = ref<any>(null);

function stripHtml(input: string | undefined | null): string {
  if (!input)
    return "";
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;|\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const schema = z.object({
  name: z.string().trim().min(1, "Enter a pass name"),
  validity: z.coerce.number({ message: "Enter how many days this pass is valid for" }).int().positive("Validity must be at least 1 day"),
  price: z.coerce.number({ message: "Enter a price" }).int().nonnegative("Price can't be negative"),
  spaBenefit: z.coerce.number({ message: "Enter the spa benefit percentage" }).min(0).max(100, "Benefit must be between 0% and 100%"),
  classBenefit: z.coerce.number({ message: "Enter the class benefit percentage" }).min(0).max(100, "Benefit must be between 0% and 100%"),
  eventBenefit: z.coerce.number({ message: "Enter the event benefit percentage" }).min(0).max(100, "Benefit must be between 0% and 100%"),
  workshopBenefit: z.coerce.number({ message: "Enter the workshop benefit percentage" }).min(0).max(100, "Benefit must be between 0% and 100%"),
  cafeBenefit: z.coerce.number({ message: "Enter the cafe benefit percentage" }).min(0).max(100, "Benefit must be between 0% and 100%"),
  salonBenefit: z.coerce.number({ message: "Enter the salon benefit percentage" }).min(0).max(100, "Benefit must be between 0% and 100%"),
  description: z.string().refine(v => stripHtml(v).length > 0, { message: "Add a description for this pass" }),
  status: z.boolean(),
});

type Schema = z.output<typeof schema>;

const form = reactive<Schema>({
  name: "",
  validity: undefined as any,
  price: undefined as any,
  spaBenefit: 0,
  classBenefit: 0,
  eventBenefit: 0,
  workshopBenefit: 0,
  cafeBenefit: 0,
  salonBenefit: 0,
  description: "",
  status: true,
});

async function handleCreatePass() {
  try {
    await formRef.value?.validate();
  }
  catch (err: unknown) {
    showError({ message: getApiErrorMessage(err, "Please fix the validation errors") });
    return;
  }

  try {
    loading.value = true;
    await koraPassesStore.createPass(form);
    showSuccess({ message: "Kora Pass created successfully" });
    router.push("/offerings/kora-passes");
  }
  catch (err: unknown) {
    showError({ message: getApiErrorMessage(err, "Failed to create Kora Pass") });
  }
  finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="flex w-full flex-col gap-6">
    <base-page-header>
      <template #title>
        Create Kora Passes
      </template>

      <template #description>
        Manage multiple kora passes
      </template>

      <template #actions>
        <NuxtLink to="/offerings/kora-passes">
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

    <div class="bg-card rounded-xl border border-border shadow-sm p-6">
      <!-- Info Alert -->
      <form-header-card
        label="Kora Pass Info"
        description="Start by entering the pass details."
        :icon="ICONS.INFO"
      />

      <UForm
        ref="formRef"
        :state="form"
        :schema="schema"
        class="space-y-8"
        @submit="handleCreatePass"
      >
        <!-- Form Fields -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 shadow-sm p-4 rounded-lg">
          <base-input
            v-model="form.name"
            name="name"
            label="Pass Name*"
            placeholder="Enter pass name"
          />

          <base-input
            v-model.number="form.validity"
            label="Pass Validity (Days)*"
            name="validity"
            type="number"
            placeholder="Enter number of valid days"
            class="w-full"
          >
            <template #trailing>
              <span class="text-sm text-stone-400 pr-2">Days</span>
            </template>
          </base-input>

          <base-input
            v-model.number="form.spaBenefit"
            name="spaBenefit"
            label="Spa Benefit*"
            type="number"
            placeholder="Enter spa benefit percentage"
            class="w-full"
          >
            <template #trailing>
              <span class="text-sm text-stone-400 pr-2">%</span>
            </template>
          </base-input>

          <base-input
            v-model.number="form.classBenefit"
            name="classBenefit"
            label="Class Benefit*"
            type="number"
            placeholder="Enter class benefit percentage"
            class="w-full"
          >
            <template #trailing>
              <span class="text-sm text-stone-400 pr-2">%</span>
            </template>
          </base-input>

          <base-input
            v-model.number="form.eventBenefit"
            name="eventBenefit"
            label="Event Benefit*"
            type="number"
            placeholder="Enter event benefit percentage"
            class="w-full"
          >
            <template #trailing>
              <span class="text-sm text-stone-400 pr-2">%</span>
            </template>
          </base-input>

          <base-input
            v-model.number="form.workshopBenefit"
            name="workshopBenefit"
            label="Workshop Benefit*"
            type="number"
            placeholder="Enter workshop benefit percentage"
            class="w-full"
          >
            <template #trailing>
              <span class="text-sm text-stone-400 pr-2">%</span>
            </template>
          </base-input>

          <base-input
            v-model.number="form.cafeBenefit"
            name="cafeBenefit"
            label="Cafe Benefit*"
            type="number"
            placeholder="Enter cafe benefit percentage"
            class="w-full"
          >
            <template #trailing>
              <span class="text-sm text-stone-400 pr-2">%</span>
            </template>
          </base-input>

          <base-input
            v-model.number="form.salonBenefit"
            name="salonBenefit"
            label="Salon Benefit*"
            type="number"
            placeholder="Enter salon benefit percentage"
            class="w-full"
          >
            <template #trailing>
              <span class="text-sm text-stone-400 pr-2">%</span>
            </template>
          </base-input>

          <div class="md:col-span-2">
            <base-input
              v-model.number="form.price"
              type="number"
              placeholder="Enter pass price"
              name="price"
              label="Pass Price*"
              class="w-full"
            >
              <template #trailing>
                <span class="text-sm text-stone-400 pr-2">Rs</span>
              </template>
            </base-input>
          </div>

          <div class="md:col-span-2">
            <base-text-editor
              v-model="form.description"
              name="description"
              label="Pass Description*"
              placeholder="Write a short description about this service"
              class="w-full min-h-32"
            />
          </div>

          <div class="md:col-span-2 flex flex-col gap-2">
            <span class="text-sm font-medium text-secondary-900">Status</span>
            <base-switch
              v-model="form.status"
              name="status"
              label=""
              :show-label="false"
            />
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-end pt-4">
          <base-button
            type="submit"
            size="lg"
            :loading="loading"
          >
            Create Pass
          </base-button>
        </div>
      </UForm>
    </div>
  </div>
</template>

<style scoped>
</style>
