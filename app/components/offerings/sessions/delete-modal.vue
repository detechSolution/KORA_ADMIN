<script setup lang="ts">
type Props = {
  open: boolean;
  sessionName?: string;
  loading?: boolean;
};

withDefaults(defineProps<Props>(), {
  sessionName: "",
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
    title="Delete this Session?"
    description=""
    :modal-width="420"
    dismissible
    @close="emit('close')"
  >
    <div class="flex flex-col gap-5 p-6">
      <p class="text-sm text-secondary-500">
        Are you sure you want to delete this session? All existing bookings for
        this session will be automatically canceled and users will receive an
        email notification.
      </p>

      <div class="flex justify-end gap-2">
        <base-button
          variant="outline"
          @click="emit('close')"
        >
          Cancel
        </base-button>

        <UButton
          color="error"
          variant="solid"
          :loading="loading"
          :disabled="loading"
          class="cursor-pointer font-semibold"
          @click="emit('confirm')"
        >
          Yes, Delete
        </UButton>
      </div>
    </div>
  </base-modal>
</template>
