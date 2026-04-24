<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import * as z from "zod";

import { useNotification } from "~/composables/use-notification";
import { usePermission } from "~/composables/use-permission";
import { useSubscriptionsStore } from "~/stores/subscriptions";
import { formatDateTime } from "~/utils/common";
import { getApiErrorMessage } from "~/utils/error";

type Props = {
  plan: any;
  open: boolean;
};

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "updated"): void;
}>();

const subscriptionsStore = useSubscriptionsStore();
const { can } = usePermission();
const { success, error } = useNotification();

const updating = ref(false);

const schema = z.object({
  price: z.string()
    .min(1, "Price is required")
    .refine((value) => {
      const numeric = Number(value);
      return !Number.isNaN(numeric) && numeric >= 0;
    }, "Price must be a valid non-negative number"),
});

type Schema = z.output<typeof schema>;

const state = reactive<Partial<Schema> & {
  name?: string;
  description?: string;
  interval?: string;
  statusDisplay?: string;
  createdAt?: string;
  updatedAt?: string;
  is_active?: boolean;
}>({
  name: "",
  description: "",
  interval: "",
  statusDisplay: "",
  createdAt: "",
  updatedAt: "",
  price: props.plan?.price !== undefined && props.plan?.price !== null
    ? String(props.plan.price)
    : "",
  is_active: true,
});

const formRef = ref<InstanceType<typeof UForm> | null>(null);

watch(
  () => props.plan,
  (newPlan) => {
    if (!newPlan) {
      return;
    }
    state.name = newPlan.name ?? "";
    state.description = newPlan.description ?? "";
    state.interval = newPlan.interval ?? "";
    state.statusDisplay = typeof newPlan.is_active === "boolean" ? (newPlan.is_active ? "Active" : "Disabled") : "N/A";
    state.createdAt = newPlan.created_at ? formatDateTime(newPlan.created_at) : (newPlan.createdAt ? formatDateTime(newPlan.createdAt) : "");
    state.updatedAt = newPlan.updated_at ? formatDateTime(newPlan.updated_at) : (newPlan.updatedAt ? formatDateTime(newPlan.updatedAt) : "");
    state.price = newPlan.price !== undefined && newPlan.price !== null ? String(newPlan.price) : "";
    state.is_active = newPlan.is_active ?? true;
  },
  { immediate: true },
);

async function handleUpdate(): Promise<void> {
  try {
    await formRef.value?.validate();
  }
  catch {
    return;
  }

  try {
    updating.value = true;
    const payload = {
      subscription_plan_id: props.plan.id,
      price: Number(state.price),
      is_active: state.is_active ?? true,
    };
    await subscriptionsStore.updateSubscriptionPlan(payload);
    success({ message: "Plan updated successfully" });
    emit("updated");
  }
  catch (err: unknown) {
    error({ message: getApiErrorMessage(err, "Failed to update plan") });
  }
  finally {
    updating.value = false;
  }
}
</script>

<template>
  <base-modal
    :open="open"
    title="Plan Details"
    description="View and update plan information"
    :modal-width="800"
    dismissible
    @close="emit('close')"
  >
    <div v-if="plan" class="flex flex-col gap-4">
      <UForm
        ref="formRef"
        :state="state"
        :schema="schema"
        :validate-on="['input', 'change', 'blur']"
        class="flex flex-col gap-4"
      >
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <base-input
            v-model="state.name"
            name="name"
            label="Plan Name"
            placeholder="—"
            disabled
          />
          <base-input
            v-model="state.interval"
            name="interval"
            label="Frequency"
            placeholder="—"
            disabled
          />
          <div class="md:col-span-2">
            <base-input
              v-model="state.description"
              name="description"
              label="Description"
              type="textarea"
              placeholder="—"
              disabled
            />
          </div>
          <base-input
            v-model="state.price"
            type="text"
            name="price"
            label="Price"
            placeholder="Enter price"
            required
          />
          <base-switch
            v-model="state.is_active"
            name="is_active"
            label="Status"
            on-label="Active"
            off-label="Disabled"
          />
        </div>
        <div class="flex justify-end gap-2">
          <base-button
            variant="outline"
            @click="emit('close')"
          >
            Cancel
          </base-button>
          <base-button
            v-if="can(PERMISSIONS_CONFIGURATION.PLANS_UPDATE)"
            type="submit"
            :loading="updating"
            @click="handleUpdate"
          >
            Update Plan
          </base-button>
        </div>
      </UForm>
    </div>
  </base-modal>
</template>
