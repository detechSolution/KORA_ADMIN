<script setup lang="ts">
import { onMounted, ref } from "vue";

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

const loading = ref(false);
const memberOptions = ref<any[]>([]);
const selectedMemberId = ref<number | null>(null);

async function fetchMembers() {
  try {
    loading.value = true;
    const data = await sessionsStore.getMembers();
    memberOptions.value = data;
  }
  catch (error: unknown) {
    showError({ message: getApiErrorMessage(error, "Failed to load members") });
  }
  finally {
    loading.value = false;
  }
}

async function handleAddMember() {
  if (!selectedMemberId.value || !props.session?.id)
    return;

  try {
    loading.value = true;
    await sessionsStore.addMemberToSession(props.session.id, selectedMemberId.value);
    showSuccess({ message: "Member added successfully" });
    emit("success");
    emit("close");
  }
  catch (error: unknown) {
    showError({ message: getApiErrorMessage(error, "Failed to add member") });
  }
  finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchMembers();
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
    <div v-if="session" class="flex flex-col gap-6 py-2">
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
