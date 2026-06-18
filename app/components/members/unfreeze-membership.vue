<script setup lang="ts">
type Props = {
  open: boolean;
  memberName?: string;
  loading?: boolean;
};

withDefaults(defineProps<Props>(), {
  memberName: "",
  loading: false,
});

const emit = defineEmits<{
  (e: "close"): void;
  (e: "confirm"): void;
}>();
</script>

<template>
  <base-modal
    :open="open"
    title="Unfreeze Membership?"
    :modal-width="420"
    dismissible
    @close="emit('close')"
  >
    <div class="flex flex-col gap-5 p-6">
      <p class="text-sm text-secondary-500">
        Are you sure you want to unfreeze
        <span v-if="memberName" class="font-medium text-secondary-900">{{ memberName }}</span><span v-else>this</span>'s membership? Their subscription will resume immediately.
      </p>

      <div class="flex justify-end gap-2">
        <base-button
          variant="outline"
          @click="emit('close')"
        >
          Cancel
        </base-button>

        <base-button
          variant="solid"
          :loading="loading"
          :disabled="loading"
          @click="emit('confirm')"
        >
          Unfreeze
        </base-button>
      </div>
    </div>
  </base-modal>
</template>
