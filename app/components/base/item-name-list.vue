<script setup lang="ts">
import { computed } from "vue";

import { serviceNames } from "~/utils/service-names";

const props = defineProps<{
  value?: string | string[] | null;
}>();

const names = computed(() => serviceNames(props.value));

const additionalCount = computed(() => Math.max(names.value.length - 1, 0));
</script>

<template>
  <span class="inline-flex min-w-0 items-center gap-2">
    <span>{{ names[0] || "N/A" }}</span>

    <UTooltip
      v-if="additionalCount"
      :delay-duration="0"
      arrow
      :ui="{ content: 'bg-white border border-stone-200 rounded-md shadow-md' }"
    >
      <button
        type="button"
        class="inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-stone-100 px-1.5 text-xs font-medium leading-none text-stone-500"
        :aria-label="`${additionalCount} ${additionalCount === 1 ? 'service' : 'services'}`"
      >
        +{{ additionalCount }}
      </button>

      <template #content>
        <div class="p-2 text-sm font-normal text-secondary-700">
          {{ additionalCount }} {{ additionalCount === 1 ? "service" : "services" }}
        </div>
      </template>
    </UTooltip>
  </span>
</template>
