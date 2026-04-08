<script setup lang="ts">
import { ref } from "vue";

import { ICONS } from "~/config/icons";

type Props = {
  community: any;
  open: boolean;
};

defineProps<Props>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "updated"): void;
}>();

const activeTab = ref("info");

const tabs = [
  { label: "Info", value: "info", icon: ICONS.EYE },
  { label: "Accounts", value: "accounts", icon: ICONS.BUILDING },
  { label: "Usage", value: "usage", icon: ICONS.REPORTS },
  { label: "Admins", value: "admins", icon: ICONS.USERS },
];

function handleClose(): void {
  activeTab.value = "info";
  emit("close");
}
</script>

<template>
  <base-modal
    :open="open"
    :title="community?.community_name || 'Community Details'"
    description="View detailed information about this community"
    :modal-width="1000"
    modal-max-height="90vh"
    dismissible
    @close="handleClose"
  >
    <div class="flex h-full min-h-0 flex-col gap-4">
      <div class="shrink-0 bg-card border border-border rounded-lg p-1.5 overflow-hidden">
        <nav class="flex gap-1 overflow-x-auto scroll-smooth hide-scrollbar" role="tablist">
          <button
            v-for="tab in tabs"
            :key="tab.value"
            role="tab"
            :aria-selected="activeTab === tab.value"
            class="group flex items-center gap-2.5 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap shrink-0"
            :class="[
              activeTab === tab.value
                ? 'bg-primary text-white shadow-sm'
                : 'text-foreground hover:bg-muted',
            ]"
            @click="activeTab = tab.value"
          >
            <UIcon
              :name="tab.icon"
              class="w-4 h-4 transition-all duration-200 shrink-0"
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
          <community-info-tab
            v-if="activeTab === 'info'"
            key="info"
            :community="community"
          />

          <community-accounts-tab
            v-else-if="activeTab === 'accounts'"
            key="accounts"
            :community="community"
            @updated="emit('updated')"
          />
          <community-usage-tab
            v-else-if="activeTab === 'usage'"
            key="usage"
            :community="community"
          />
          <community-admins-tab
            v-else-if="activeTab === 'admins'"
            key="admins"
            :community="community"
          />
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
