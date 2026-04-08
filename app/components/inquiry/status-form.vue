<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import * as z from "zod";

import type { Inquiry } from "~/types/inquiry";

import { useNotification } from "~/composables/use-notification";
import { usePermission } from "~/composables/use-permission";
import { ICONS } from "~/config/icons";
import { getInquiryStatusColor } from "~/config/inquiry-status";
import { PERMISSIONS_INQUIRIES } from "~/config/permissions";
import { useInquiriesStore } from "~/stores/inquiries";
import { getApiErrorMessage } from "~/utils/error";

type Props = {
  inquiry: Inquiry | null;
};

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "updated"): void;
}>();

const inquiriesStore = useInquiriesStore();
const { can } = usePermission();
const { success, error } = useNotification();

const updating = ref(false);
const isConvertOpen = ref(false);
const formRef = ref<InstanceType<typeof UForm> | null>(null);

const currentStatusId = computed(() => Number(props.inquiry?.status_id || 0));

const schema = computed(() =>
  z.object({
    status: z
      .string()
      .min(1, "Please select a status to update")
      .refine(
        val => Number(val) > currentStatusId.value,
        "Status must be greater than the current status. You can only progress forward.",
      ),
    notes: z.string().optional(),
  }),
);

const state = reactive<{ status: string; notes: string }>({
  status: "",
  notes: "",
});

const currentStatus = computed(() => {
  const statusId = currentStatusId.value;
  const statusName = props.inquiry?.status_name || "";
  const statusOption = inquiriesStore.inquiryStatuses.find(opt => opt.id === statusId);
  return {
    id: statusId,
    name: statusName || statusOption?.name || "N/A",
    description: statusOption?.description || "",
    color: statusId ? getInquiryStatusColor(statusId) : "muted",
  };
});

const selectOptions = computed(() => {
  const currentId = currentStatusId.value;
  return inquiriesStore.inquiryStatuses
    .filter(status => Number(status.id) > currentId)
    .map(status => ({
      label: `${status.name} - ${status.description}`,
      value: String(status.id),
    }));
});

const hasStatusChanged = computed(() => {
  const currentId = currentStatusId.value;
  const selectedId = Number(state.status);
  return selectedId !== currentId && selectedId > currentId;
});

const isClosedWon = computed(() => {
  const name = (props.inquiry?.status_name ?? "").toLowerCase();
  return name.includes("closed won");
});

// Reset form when inquiry changes
watch(
  () => props.inquiry?.id,
  () => {
    state.status = "";
    state.notes = "";
  },
);

async function handleUpdate(): Promise<void> {
  if (!props.inquiry?.id) {
    return;
  }

  try {
    await formRef.value?.validate();
  }
  catch {
    return;
  }

  const selectedId = Number(state.status);

  try {
    updating.value = true;

    await inquiriesStore.updateInquiryStatus({
      inquiry_id: props.inquiry.id,
      status_id: selectedId,
      notes: state.notes.trim() || "",
    });
    success({ message: "Inquiry updated successfully" });
    state.status = "";
    state.notes = "";
    emit("updated");
  }
  catch (err: unknown) {
    error({ message: getApiErrorMessage(err, "Failed to update inquiry") });
  }
  finally {
    updating.value = false;
  }
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="rounded-xl border border-border bg-card p-6 h-full">
      <div class="mb-6 flex items-center gap-3 border-b border-border pb-4">
        <div class="rounded-lg bg-primary/10 p-2">
          <UIcon :name="ICONS.SETTINGS" class="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 class="text-lg font-semibold text-foreground">
            Update inquiry status
          </h3>
          <p class="mt-0.5 text-xs text-muted-foreground">
            Change the status and add notes to track progress
          </p>
        </div>
      </div>

      <div class="space-y-4">
        <!-- Current Status Display -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-foreground">
            Current Status
          </label>
          <div class="flex items-center gap-2">
            <base-badge
              :color="currentStatus.color"
              class="text-sm"
            >
              {{ currentStatus.name }}
            </base-badge>
            <span
              v-if="currentStatus.description"
              class="text-xs text-muted-foreground"
            >
              {{ currentStatus.description }}
            </span>
          </div>
        </div>

        <template v-if="!isClosedWon">
          <UForm
            ref="formRef"
            :state="state"
            :schema="schema"
            :validate-on="['input', 'change', 'blur']"
            class="space-y-4"
          >
            <base-select
              v-model="state.status"
              name="status"
              label="Change Status"
              placeholder="Select status"
              :options="selectOptions"
              required
            />

            <base-input
              v-model="state.notes"
              type="textarea"
              name="notes"
              label="Add new note"
              placeholder="Add a new note about this inquiry..."
            />

            <div v-if="can(PERMISSIONS_INQUIRIES.VIEW)" class="flex justify-end">
              <base-button
                :loading="updating"
                :disabled="!hasStatusChanged"
                @click="handleUpdate"
              >
                Update inquiry
              </base-button>
            </div>
          </UForm>
        </template>
      </div>
    </div>

    <div
      v-if="isClosedWon"
      class="rounded-xl border-2 border-emerald-200/50 bg-emerald-50/50 p-6 dark:border-emerald-800/30 dark:bg-emerald-950/20"
    >
      <div class="mb-6 flex items-start justify-between border-b border-emerald-200/50 pb-4 dark:border-emerald-800/30">
        <div class="flex items-center gap-3">
          <div class="rounded-lg bg-emerald-500/10 p-2">
            <UIcon :name="ICONS.BUILDING" class="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">
              Convert to community
            </h3>
            <p class="mt-0.5 text-xs text-muted-foreground">
              Activate this inquiry as a community on Baha
            </p>
          </div>
        </div>
        <base-badge color="emerald" class="shrink-0 text-xs">
          Onboarding
        </base-badge>
      </div>

      <p class="text-sm text-muted-foreground mb-6">
        Follow the onboarding steps to activate this society on Baha and assign a subscription plan.
      </p>

      <div class="flex justify-end">
        <base-button
          variant="outline"
          color="primary"
          @click="isConvertOpen = true"
        >
          Convert Inquiry → Community
        </base-button>
      </div>
    </div>
  </div>
</template>
