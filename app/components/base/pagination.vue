<script setup lang="ts">
type Props = {
  page: number;
  total: number;
  itemsPerPage: number;
  disabled?: boolean;
};

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
});

const emit = defineEmits<{
  (e: "update:page", value: number): void;
}>();

function onPageChange(value: number): void {
  emit("update:page", value);
}
</script>

<template>
  <div class="flex items-center justify-end">
    <UPagination
      :model-value="props.page"
      :total="props.total"
      :items-per-page="props.itemsPerPage"
      :disabled="props.disabled"
      variant="outline"
      color="neutral"
      active-color="primary"
      active-variant="solid"
      size="sm"
      :sibling-count="2"
      show-edges
      class="rounded-md p-1"
      @update:page="onPageChange"
    />
  </div>
</template>
