<script setup lang="ts">
import { computed, ref, watch } from "vue";

import { useNotification } from "~/composables/use-notification";
import { useSessionsStore } from "~/stores/sessions";
import { getApiErrorMessage } from "~/utils/error";

const props = defineProps<{
  open: boolean;
  session: any;
}>();

const emit = defineEmits(["close", "success"]);

const { success: showSuccess, error: showError } = useNotification();
const sessionsStore = useSessionsStore();
const memberOrPassUser = computed(() => sessionsStore.memberOrPassUser);

const loading = ref(false);
const memberOptions = ref<{ label: string; value: number; description: string }[]>([]);
const selectedMemberId = ref<number | null>(null);

async function fetchMembers() {
  try {
    await sessionsStore.getMembers(props.session.id);
    memberOptions.value = memberOrPassUser.value.data.map((item: any) => ({
      label: item.name,
      value: item.userId,
      description: item.email,
    }));
  }
  catch (error: unknown) {
    showError({
      message: getApiErrorMessage(error, "Failed to load members"),
    });
  }
}

async function handleAddMember() {
  if (!selectedMemberId.value || !props.session?.id)
    return;

  let payload = memberOrPassUser.value.data.find((option: any) => option.memberId === selectedMemberId.value || option.userId === selectedMemberId.value);
  payload = {
    memberId: payload.memberId,
    userPassId: payload.userPassId,
  };
  try {
    loading.value = true;
    await sessionsStore.addMemberToSession(props.session.id, payload);
    showSuccess({ message: "Member added successfully" });
    emit("success");
    emit("close");
  }
  catch (error: unknown) {
    showError({ message: getApiErrorMessage(error, "Failed to add member") });
  }
  finally {
    selectedMemberId.value = null;
    loading.value = false;
  }
}

watch(() => props.open, (newVal) => {
  if (newVal) {
    fetchMembers();
  }
});
</script>

<template>
  <base-modal
    :open="open"
    title="Add Member or Pass User To This Session."
    :modal-width="600"
    dismissible
    @close="emit('close')"
  >
    <div v-if="session" class="flex flex-col gap-6 p-6">
      <base-select-menu
        v-model="selectedMemberId"
        name="member"
        label="Select Member or Pass User*"
        placeholder="Search and select member or pass user"
        :options="memberOptions"
        :loading="loading"
        search-input
        search-placeholder="Search members..."
      />

      <div class="flex justify-end pt-4">
        <base-button
          variant="solid"
          size="md"
          class="bg-stone-900 hover:bg-stone-800 min-w-24"
          :loading="loading"
          :disabled="!selectedMemberId"
          @click="handleAddMember"
        >
          Add
        </base-button>
      </div>
    </div>
  </base-modal>
</template>
