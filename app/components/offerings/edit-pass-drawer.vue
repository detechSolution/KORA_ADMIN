<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import * as z from "zod";

import { useNotification } from "~/composables/use-notification";
import { useKoraPassesStore } from "~/stores/kora-passes";
import { getApiErrorMessage } from "~/utils/error";

const props = defineProps<{
  open: boolean;
  pass: any;
}>();

const emit = defineEmits(["close", "success"]);

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
  name: z.string().trim().min(1, "Pass name is required"),
  validity: z.coerce.number({ message: "Validity is required" }).int().positive("Validity must be a positive integer"),
  price: z.coerce.number({ message: "Price is required" }).int().nonnegative("Price must be non-negative"),
  discount: z.coerce.number({ message: "Discount is required" }).min(0).max(100, "Discount must be between 0 and 100"),
  description: z.string().refine(v => stripHtml(v).length > 0, { message: "Description is required" }),
  status: z.boolean(),
});

type Schema = z.output<typeof schema>;

const form = reactive<Schema>({
  name: "",
  validity: 0,
  price: 0,
  discount: 0,
  description: "",
  status: true,
});

watch(() => props.pass, (newPass) => {
  if (newPass) {
    form.name = newPass.name;
    form.validity = newPass.numberOfDays;
    form.price = newPass.price;
    form.discount = newPass.discount;
    form.description = newPass.description;
    form.status = newPass.isActive;
  }
}, { immediate: true });

async function handleUpdatePass() {
  try {
    await formRef.value?.validate();
  }
  catch (err: unknown) {
    showError({ message: getApiErrorMessage(err, "Please fix the validation errors") });
    return;
  }

  try {
    loading.value = true;
    const payload = {
      name: form.name,
      numberOfDays: form.validity,
      price: form.price,
      discount: form.discount,
      description: form.description,
      isActive: form.status,
    };
    await koraPassesStore.updatePass(props.pass.id, payload);
    showSuccess({ message: "Kora Pass updated successfully" });
    emit("success");
    emit("close");
  }
  catch (err: unknown) {
    showError({ message: getApiErrorMessage(err, "Failed to update Kora Pass") });
  }
  finally {
    loading.value = false;
  }
}
</script>

<template>
  <base-drawer
    :open="open"
    title="Edit Pass"
    :drawer-width="520"
    @close="emit('close')"
  >
    <div class="flex flex-col h-full overflow-hidden">
      <div class="flex-1 overflow-y-auto p-6">
        <UForm
          ref="formRef"
          :state="form"
          :schema="schema"
          class="space-y-6"
          @submit="handleUpdatePass"
        >
          <base-input
            v-model="form.name"
            name="name"
            label="Pass Name"
            placeholder="Enter pass name"
          />

          <base-input
            v-model.number="form.validity"
            label="Pass Validity (Days)"
            name="validity"
            type="number"
            placeholder="Enter number of valid days"
          >
            <template #trailing>
              <span class="text-sm text-stone-400 pr-2">Days</span>
            </template>
          </base-input>

          <base-input
            v-model.number="form.price"
            label="Pass Price"
            name="price"
            type="number"
            placeholder="Enter pass price"
          >
            <template #trailing>
              <span class="text-sm text-stone-400 pr-2">Rs</span>
            </template>
          </base-input>

          <base-input
            v-model.number="form.discount"
            label="Discount"
            name="discount"
            type="number"
            placeholder="Enter discount percentage"
          >
            <template #trailing>
              <span class="text-sm text-stone-400 pr-2">%</span>
            </template>
          </base-input>

          <base-text-editor
            v-model="form.description"
            label="Pass Description*"
            name="description"
            placeholder="This pass includes all classes access, recovery axis, towel & locker."
          />

          <div class="md:col-span-2 flex flex-col gap-2">
            <span class="text-sm font-medium text-secondary-900">Status</span>
            <base-switch
              v-model="form.status"
              name="status"
              label=""
              :show-label="false"
            />
          </div>
        </UForm>
      </div>

      <div class="p-6 border-t border-stone-100 flex items-center justify-end gap-3 bg-white mt-auto">
        <base-button
          variant="outline"
          class="min-w-24"
          @click="emit('close')"
        >
          Cancel
        </base-button>
        <base-button
          variant="solid"
          class="min-w-32 bg-stone-900 hover:bg-stone-800"
          :loading="loading"
          @click="handleUpdatePass"
        >
          Update Pass
        </base-button>
      </div>
    </div>
  </base-drawer>
</template>
