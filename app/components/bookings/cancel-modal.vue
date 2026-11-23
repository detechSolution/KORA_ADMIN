<script setup lang="ts">
import { computed, ref, watch } from "vue";

type Props = {
  open: boolean;
  loading?: boolean;
  maxQuantity?: number;
  serviceTitle?: string;
};

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  maxQuantity: 1,
  serviceTitle: "this service",
});

const emit = defineEmits<{
  (e: "close"): void;
  (e: "confirm", quantity: number): void;
}>();
const quantity = ref(1);
const validQuantity = computed(() => Number.isInteger(Number(quantity.value)) && Number(quantity.value) >= 1 && Number(quantity.value) <= props.maxQuantity);
watch(() => props.open, (open) => {
  if (open)
    quantity.value = 1;
});
</script>

<template>
  <base-modal
    :open="open"
    title="Cancel tickets"
    description=""
    :modal-width="420"
    dismissible
    @close="emit('close')"
  >
    <div class="flex flex-col gap-5 p-6">
      <p class="text-sm text-secondary-500">
        Choose how many tickets to cancel for {{ serviceTitle }}. {{ maxQuantity }} remain booked.
        Any refund will be reviewed separately.
      </p>

      <UFormField
        label="Tickets to cancel"
        name="quantity"
        :error="validQuantity ? undefined : `Cannot cancel more than ${maxQuantity} tickets`"
      >
        <UInput
          v-model="quantity"
          type="number"
          :min="1"
          :max="maxQuantity"
          :step="1"
          :disabled="loading"
          class="w-full"
        />
      </UFormField>

      <div class="flex justify-end gap-2 mt-2">
        <base-button
          variant="outline"
          @click="emit('close')"
        >
          Keep tickets
        </base-button>

        <UButton
          color="error"
          variant="solid"
          :loading="loading"
          :disabled="loading || !validQuantity"
          class="cursor-pointer font-semibold"
          @click="emit('confirm', Number(quantity))"
        >
          Cancel {{ Number(quantity) === 1 ? 'ticket' : 'tickets' }}
        </UButton>
      </div>
    </div>
  </base-modal>
</template>
