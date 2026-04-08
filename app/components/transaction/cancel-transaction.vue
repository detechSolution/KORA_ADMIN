<script setup lang="ts">
import { ICONS } from "~/config/icons";

type Props = {
  open: boolean;
  transaction: any;
  loading?: boolean;
};

withDefaults(defineProps<Props>(), {
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
    title="Cancel Transaction"
    description="Are you sure you want to cancel this transaction?"
    :modal-width="500"
    dismissible
    @close="emit('close')"
  >
    <div class="flex flex-col gap-4">
      <p class="text-sm text-muted-foreground">
        This will cancel transaction
        <span class="font-medium text-foreground">{{ transaction?.reference_number ?? "—" }}</span>.
        This action cannot be undone.
      </p>
      <div class="flex justify-end gap-2">
        <base-button
          variant="outline"
          @click="emit('close')"
        >
          No, Keep It
        </base-button>
        <base-button
          color="primary"
          :leading-icon="ICONS.X_CIRCLE"
          :loading="loading"
          :disabled="loading"
          @click="emit('confirm')"
        >
          Yes, Cancel Transaction
        </base-button>
      </div>
    </div>
  </base-modal>
</template>
