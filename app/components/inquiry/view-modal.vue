<script setup lang="ts">
import { ref } from "vue";

import type { Inquiry } from "~/types/inquiry";

import { ICONS } from "~/config/icons";

type Props = {
  inquiry: Inquiry | null;
  open: boolean;
};

defineProps<Props>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "updated"): void;
}>();

const activeTab = ref("info");
const historyRefreshKey = ref(0);

const tabs = [
  { label: "Info", value: "info", icon: ICONS.EYE },
  { label: "Onboarding", value: "onboarding", icon: ICONS.BUILDING },
];

function handleUpdated(): void {
  historyRefreshKey.value += 1;
  emit("updated");
}

function handleClose(): void {
  activeTab.value = "info";
  emit("close");
}
</script>

<template>
  <base-modal
    :open="open"
    title="Inquiry Details"
    description="View and update inquiry information"
    :modal-width="1000"
    modal-max-height="90vh"
    dismissible
    @close="handleClose"
  >
    <div class="flex h-full min-h-0 flex-col gap-4">
      <div class="shrink-0 overflow-hidden rounded-lg border border-border bg-card p-1.5">
        <nav
          class="flex gap-1 overflow-x-auto scroll-smooth hide-scrollbar"
          role="tablist"
        >
          <button
            v-for="tab in tabs"
            :key="tab.value"
            role="tab"
            :aria-selected="activeTab === tab.value"
            class="group flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-all duration-200"
            :class="[
              activeTab === tab.value
                ? 'bg-primary text-white shadow-sm'
                : 'text-foreground hover:bg-muted',
            ]"
            @click="activeTab = tab.value"
          >
            <UIcon
              :name="tab.icon"
              class="h-4 w-4 shrink-0 transition-all duration-200"
              :class="[
                activeTab === tab.value
                  ? 'text-white'
                  : 'text-muted-foreground group-hover:text-foreground',
              ]"
            />
            <span>{{ tab.label }}</span>
          </button>
        </nav>
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto">
        <Transition
          name="tab-fade"
          mode="out-in"
        >
          <inquiry-info-tab
            v-if="activeTab === 'info'"
            key="info"
            :inquiry="inquiry"
            @updated="handleUpdated"
          />

          <div
            v-else-if="activeTab === 'onboarding'"
            key="onboarding"
            class="grid grid-cols-1 gap-4 lg:grid-cols-2 h-full"
          >
            <inquiry-status-form
              :inquiry="inquiry"
              @updated="handleUpdated"
            />
            <inquiry-status-logs
              :inquiry="inquiry"
              :refresh-key="historyRefreshKey"
            />
          </div>
        </Transition>
      </div>
    </div>
  </base-modal>
</template>

<style scoped>
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
</style>
