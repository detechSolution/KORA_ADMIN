<script setup lang="ts">
import { computed } from "vue";

type Props = {
  page: number;
  total: number;
  itemsPerPage: number;
  disabled?: boolean;
};

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
});
const emit = defineEmits(["update:page"]);

const totalPages = computed(() => Math.ceil(props.total / props.itemsPerPage));

const rangeStart = computed(() => {
  if (props.total === 0)
    return 0;
  return (props.page - 1) * props.itemsPerPage + 1;
});

const rangeEnd = computed(() =>
  Math.min(props.page * props.itemsPerPage, props.total),
);

function onPageChange(value: number): void {
  emit("update:page", value);
}
</script>

<template>
  <div class="flex items-center justify-between gap-2">
    <div class="text-sm text-secondary-500 flex gap-1 items-center">
      Showing
      <span>{{ rangeStart }}</span>
      -
      <span>{{ rangeEnd }}</span>
      of
      <span>{{ props.total }}</span>
      entries
    </div>

    <UPagination
      v-if="totalPages > 1"
      :model-value="props.page"
      :total="props.total"
      :items-per-page="props.itemsPerPage"
      :disabled="props.disabled"
      variant="outline"
      color="neutral"
      active-color="secondary"
      active-variant="solid"
      size="sm"
      :sibling-count="2"
      show-edges
      class="rounded-md p-1"
      @update:page="onPageChange"
    />
  </div>
</template>
