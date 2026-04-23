<script setup lang="ts">
type Props = {
  open: boolean;
  serviceName?: string;
  loading?: boolean;
};

withDefaults(defineProps<Props>(), {
  serviceName: "",
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
    title="Delete Spa Sub-type ?"
    description=""
    :modal-width="420"
    dismissible
    @close="emit('close')"
  >
    <div class="flex flex-col gap-5">
      <p class="text-sm text-secondary-500">
        Are you sure you want to delete this spa sub-type?
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
