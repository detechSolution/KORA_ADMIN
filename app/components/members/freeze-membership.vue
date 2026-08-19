<script setup lang="ts">
import { reactive, ref } from "vue";
import z from "zod";

import type { Member } from "~/types/membership";

import { useNotification } from "~/composables/use-notification";
import { useMembershipStore } from "~/stores/membership";
import { getApiErrorMessage } from "~/utils/error";

type Props = {
  open: boolean;
  member: Member;
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

const today = new Date();
const todayDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

function requiredDate(message: string) {
  return z.preprocess(value => value ?? "", z.string().min(1, message));
}

const schema = z.object({
  dateRange: z.object({
    start: requiredDate("Start date is required"),
    end: requiredDate("End date is required when a start date is selected"),
  }, { error: "Freeze start and end dates are required" }),
  reason: z.string().min(1, "Reason is required"),
}).superRefine((data, ctx) => {
  const { start, end } = data.dateRange;

  if (start && !end) {
    ctx.addIssue({
      code: "custom",
      path: ["dateRange"],
      message: "End date is required when a start date is selected",
    });
    return;
  }

  if (!start && end) {
    ctx.addIssue({
      code: "custom",
      path: ["dateRange"],
      message: "Start date is required when an end date is selected",
    });
    return;
  }

  if (!start || !end)
    return;

  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffInDays = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffInDays < 6) {
    ctx.addIssue({
      code: "custom",
      path: ["dateRange"],
      message: "Minimum freeze period is 7 days",
    });
  }
});

type FreezeSchema = z.output<typeof schema>;

const state = reactive<Partial<FreezeSchema>>({
  dateRange: { start: "", end: "" },
  reason: "",
});

function resetForm(): void {
  state.dateRange = { start: "", end: "" };
  state.reason = "";
}

async function handleSubmit(): Promise<void> {
  await formRef.value?.validate();

  try {
    loading.value = true;
    await membershipStore.freezeMembership(props.member.id, {
      startsOn: state.dateRange.start,
      endsOn: state.dateRange.end,
      reason: state.reason ?? "",
    });
    success({ message: "Membership frozen successfully" });
    emit("updated");
    handleClose();
  }
  catch (error: unknown) {
    showError({ message: getApiErrorMessage(error, "Failed to freeze membership.") });
  }
  finally {
    loading.value = false;
  }
}

function handleClose(): void {
  resetForm();
  emit("close");
}
</script>

<template>
  <base-modal
    :open="open"
    title="Freeze Membership"
    :modal-width="600"
    dismissible
    @close="handleClose"
  >
    <UForm
      ref="formRef"
      :schema="schema"
      :state="state"
      class="flex flex-col gap-0"
    >
      <div class="flex flex-col gap-6 p-6">
        <!-- Member info strip -->
        <div class="flex items-center gap-3 rounded-md border border-stone-200 bg-stone-50 px-4 py-3">
          <base-avatar :name="member?.user?.fullName" size="sm" />
          <div class="flex flex-col">
            <p class="text-sm font-medium text-secondary-900">
              {{ member?.user?.fullName }}
            </p>
            <p class="text-xs text-secondary-400">
              {{ member?.user?.email }}
            </p>
          </div>
        </div>

        <!-- Date range -->
        <base-date-picker
          v-model="state.dateRange"
          name="dateRange"
          range
          placeholder="Select freeze period"
          :min-date="todayDate"
          label="Freeze Start and End Date*"
        />

        <!-- Reason -->
        <base-input
          v-model="state.reason"
          name="reason"
          label="Freeze Reason"
          type="textarea"
          placeholder="Why freeze this membership?"
          :rows="4"
        />
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-end border-t border-stone-200 px-6 py-4">
        <div class="flex gap-3">
          <base-button
            variant="outline"
            size="md"
            @click="handleClose"
          >
            Cancel
          </base-button>
          <base-button
            variant="solid"
            size="md"
            :loading="loading"
            @click="handleSubmit"
          >
            Freeze Membership
          </base-button>
        </div>
      </div>
    </UForm>
  </base-modal>
</template>
