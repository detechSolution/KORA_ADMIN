<script setup lang="ts">
import { computed } from "vue";

import { uniqueServiceNames } from "~/utils/service-names";

const props = defineProps<{
  value?: string | string[] | null;
}>();

const names = computed(() => uniqueServiceNames(props.value));

const additionalNames = computed(() => names.value.slice(1));
</script>

<template>
  <span class="inline-flex min-w-0 items-center gap-2">
    <span>{{ names[0] || "N/A" }}</span>

    <UTooltip
      v-if="additionalNames.length"
      :delay-duration="0"
      arrow
      :ui="{ content: 'bg-white border border-stone-200 rounded-md shadow-md' }"
    >
      <button
        type="button"
        class="inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-stone-100 px-1.5 text-xs font-medium leading-none text-stone-500"
        :aria-label="`${additionalNames.length} ${additionalNames.length === 1 ? 'service' : 'services'}`"
      >
        +{{ additionalNames.length }}
      </button>

      <template #content>
        <div class="p-2 text-sm font-normal text-secondary-700">
          {{ additionalNames.length }} {{ additionalNames.length === 1 ? "service" : "services" }}
        </div>
      </template>
    </UTooltip>
  </span>
</template>
