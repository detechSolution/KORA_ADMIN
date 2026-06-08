<script setup lang="ts">
import { ICONS } from "~/config/icons";

type Props = {
  title?: string;
  description?: string;
  icon?: string;
};

withDefaults(defineProps<Props>(), {
  title: "No data found",
  description: "There’s currently nothing available to display.",
  icon: undefined,
});
</script>

<template>
  <div class="flex items-center justify-center">
    <UEmpty
      :title="title"
      :description="description"
      class="ring-0 bg-transparent"
      :ui="{
        title: 'text-secondary',
        description: 'text-secondary-400',
      }"
    >
      <template #leading>
        <div class="bg-stone-200 rounded-full p-2  items-center flex ">
          <UIcon :name="icon ?? ICONS.FILE" class="text-stone-500 h-6 w-6" />
        </div>
      </template>
    </UEmpty>
  </div>
</template>
