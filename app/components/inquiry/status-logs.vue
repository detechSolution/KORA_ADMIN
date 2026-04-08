<script setup lang="ts">
import { ref, watch } from "vue";

import type { HistoryItem, Inquiry } from "~/types/inquiry";

import { useNotification } from "~/composables/use-notification";
import { ICONS } from "~/config/icons";
import { getInquiryStatusColor } from "~/config/inquiry-status";
import { useInquiriesStore } from "~/stores/inquiries";
import { getApiErrorMessage } from "~/utils/error";

type Props = {
  inquiry: Inquiry | null;
  /** Increment to trigger a refetch of history (e.g. after status update) */
  refreshKey?: number;
};

const props = defineProps<Props>();

const inquiriesStore = useInquiriesStore();
const { error } = useNotification();

const historyLoading = ref(false);
const history = ref<HistoryItem[]>([]);

async function fetchHistory(): Promise<void> {
  const inquiryId = props.inquiry?.id;
  if (!inquiryId) {
    return;
  }

  try {
    historyLoading.value = true;
    const data = await inquiriesStore.getInquiryHistory({ inquiry_id: inquiryId });
    history.value = data || [];
  }
  catch (err: unknown) {
    error({ message: getApiErrorMessage(err, "Failed to fetch inquiry history") });
    history.value = [];
  }
  finally {
    historyLoading.value = false;
  }
}

// Watch for inquiry ID changes and fetch history
watch(
  () => props.inquiry?.id,
  (newId) => {
    if (newId) {
      fetchHistory();
    }
  },
  { immediate: true },
);

// Refetch when parent signals refresh (e.g. after status update)
watch(
  () => props.refreshKey,
  (key) => {
    if (key != null && key > 0 && props.inquiry?.id) {
      fetchHistory();
    }
  },
);
</script>

<template>
  <div class="rounded-xl border border-border bg-card p-6">
    <div class="mb-6 flex items-center gap-3 border-b border-border pb-4">
      <div class="rounded-lg bg-primary/10 p-2">
        <UIcon :name="ICONS.CLOCK" class="h-5 w-5 text-primary" />
      </div>
      <div>
        <h3 class="text-lg font-semibold text-foreground">
          Inquiry logs
        </h3>
        <p class="mt-0.5 text-xs text-muted-foreground">
          Timeline of all status changes and updates
        </p>
      </div>
    </div>

    <div v-if="historyLoading" class="flex flex-col items-center justify-center py-12">
      <div class="mb-3 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      <div class="text-sm text-muted-foreground">
        Loading history...
      </div>
    </div>

    <div v-else-if="history.length === 0" class="flex flex-col items-center justify-center gap-2 py-12">
      <div class="rounded-full bg-muted/50 p-4">
        <UIcon :name="ICONS.CLOCK" class="h-6 w-6 text-muted-foreground" />
      </div>
      <div class="text-sm font-medium text-muted-foreground">
        No history available
      </div>
    </div>

    <div v-else class="relative">
      <div class="space-y-0">
        <div
          v-for="(item, index) in history"
          :key="item.id || index"
          class="relative pl-8 pb-6 last:pb-0"
        >
          <!-- Timeline Line -->
          <div class="absolute left-0 top-0 bottom-0 flex flex-col items-center">
            <div
              class="relative z-10 h-3 w-3 rounded-full border-2 bg-card transition-all duration-200"
              :class="[
                index === 0
                  ? 'border-primary shadow-lg shadow-primary/20'
                  : 'border-muted-foreground/30',
              ]"
            >
              <div
                v-if="index === 0"
                class="absolute inset-0 animate-ping rounded-full bg-primary/20"
              />
            </div>
            <div
              v-if="index < history.length - 1"
              class="mt-1 h-full min-h-[80px] w-px bg-border"
            />
          </div>

          <!-- Timeline Content -->
          <div class="relative">
            <div class="mb-3 flex items-start justify-between gap-4">
              <div class="flex items-center gap-2">
                <base-badge
                  v-if="item.status_name"
                  :color="item.status_id ? getInquiryStatusColor(Number(item.status_id)) : 'muted'"
                  class="text-xs font-medium"
                >
                  {{ item.status_name }}
                </base-badge>
              </div>
              <div class="whitespace-nowrap rounded-md bg-muted/30 px-2 py-1 text-xs font-medium text-muted-foreground">
                {{ item.created_at ? formatDateTime(item.created_at) : "N/A" }}
              </div>
            </div>

            <div
              v-if="item.notes"
              class="mt-4 rounded-lg border border-border/50 bg-muted/30 p-3"
            >
              <p class="text-sm leading-relaxed text-foreground">
                {{ item.notes }}
              </p>
            </div>

            <p
              v-if="item.status_description"
              class="mt-3 text-xs italic text-muted-foreground"
            >
              {{ item.status_description }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
