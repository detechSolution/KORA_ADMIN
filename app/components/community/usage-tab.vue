<script setup lang="ts">
import { computed, ref, watch } from "vue";

import type { CommunityUsageSummary } from "~/stores/communities";

import { ICONS } from "~/config/icons";
import { useCommunitiesStore } from "~/stores/communities";

type Props = {
  community: any;
};

const props = defineProps<Props>();

const communitiesStore = useCommunitiesStore();

const usage = ref<CommunityUsageSummary | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

const communityId = computed(() => props.community?.id ?? null);

async function fetchUsage(): Promise<void> {
  const id = communityId.value;
  if (!id) {
    usage.value = null;
    return;
  }
  loading.value = true;
  error.value = null;
  try {
    const data = await communitiesStore.getCommunityUsageSummary(Number(id));
    usage.value = data ?? null;
  }
  catch {
    error.value = "Failed to load usage summary.";
    usage.value = null;
  }
  finally {
    loading.value = false;
  }
}

watch(
  () => communityId.value,
  (id) => {
    if (id) {
      fetchUsage();
    }
    else {
      usage.value = null;
      error.value = null;
    }
  },
  { immediate: true },
);

function pct(total: number, part: number): number {
  if (total <= 0)
    return 0;
  return Math.round((part / total) * 100);
}

const sectionTitleClass = "flex items-center gap-3 mb-4";
const sectionHeadingClass = "text-sm font-semibold text-foreground uppercase tracking-wide";

const summaryMax = computed(() => {
  if (!usage.value)
    return 1;
  const u = usage.value;
  return Math.max(
    1,
    u.total_houses,
    u.total_residents,
    u.total_guards,
    u.total_visitors,
  );
});

const barScale = (value: number) => Math.min(100, Math.round((value / summaryMax.value) * 100));

const housesTotal = computed(() => {
  if (!usage.value)
    return 1;
  const u = usage.value;
  return u.houses_owned + u.houses_available + u.houses_no_owner || 1;
});

const summaryItems = computed(() => {
  if (!usage.value)
    return [];
  const u = usage.value;
  return [
    { label: "Houses", value: u.total_houses, icon: ICONS.BUILDING },
    { label: "Residents", value: u.total_residents, icon: ICONS.USERS },
    { label: "Guards", value: u.total_guards, icon: ICONS.LOCK },
    { label: "Visitors", value: u.total_visitors, icon: "i-lucide-user-plus" },
  ];
});
</script>

<template>
  <div v-if="!community" class="bg-card border border-border rounded-xl p-6 shadow-sm h-full">
    <div class="flex flex-col items-center justify-center py-12 gap-2">
      <div class="p-4 rounded-full bg-muted/50">
        <UIcon :name="ICONS.BUILDING" class="w-6 h-6 text-muted-foreground" />
      </div>
      <div class="text-sm font-medium text-muted-foreground">
        No community selected
      </div>
    </div>
  </div>
  <div v-else class="bg-card border border-border rounded-xl p-6 shadow-sm h-full overflow-y-auto">
    <!-- Header (matches Info / Accounts exactly) -->
    <div class="flex items-center justify-between gap-3 mb-6 pb-4 border-b border-border">
      <div class="flex items-center gap-3">
        <div class="p-2 rounded-lg bg-primary/10">
          <UIcon :name="ICONS.REPORTS" class="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 class="text-lg font-semibold text-foreground">
            Usage summary
          </h3>
          <p class="text-xs text-muted-foreground mt-0.5">
            Houses, residents, guards and visitors
          </p>
        </div>
      </div>
      <button
        type="button"
        class="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-border bg-card text-foreground hover:bg-muted transition-colors disabled:opacity-50"
        :disabled="loading"
        @click="fetchUsage"
      >
        <UIcon
          :name="ICONS.REFRESH_CW"
          class="w-4 h-4"
          :class="{ 'animate-spin': loading }"
        />
        Refresh
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading && !usage" class="flex flex-col items-center justify-center py-12 gap-3">
      <div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      <p class="text-sm text-muted-foreground">
        Loading usage summary...
      </p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="flex flex-col items-center justify-center py-12 gap-3">
      <div class="p-4 rounded-full bg-destructive/10">
        <UIcon :name="ICONS.ALERT_CIRCLE" class="w-6 h-6 text-destructive" />
      </div>
      <p class="text-sm text-muted-foreground text-center">
        {{ error }}
      </p>
      <button
        type="button"
        class="text-sm font-medium text-primary hover:underline"
        @click="fetchUsage"
      >
        Try again
      </button>
    </div>

    <!-- Content: blended cards + horizontal bars -->
    <div v-else-if="usage" class="space-y-6">
      <!-- Overview: horizontal lines (label left, bar, number right) -->
      <div>
        <div :class="sectionTitleClass">
          <UIcon :name="ICONS.REPORTS" class="w-4 h-4 text-primary shrink-0" />
          <h4 :class="sectionHeadingClass">
            Overview
          </h4>
        </div>
        <div class="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3">
          <div
            v-for="item in summaryItems"
            :key="item.label"
            class="flex items-center gap-3"
          >
            <div class="flex items-center gap-2 w-28 shrink-0">
              <UIcon :name="item.icon" class="w-4 h-4 text-primary shrink-0" />
              <span class="text-sm font-medium text-foreground">{{ item.label }}</span>
            </div>
            <div class="flex-1 min-w-0 h-8 rounded-lg bg-muted overflow-hidden">
              <div
                class="h-full rounded-lg bg-primary transition-all duration-500"
                :style="{ width: `${barScale(item.value)}%`, minWidth: item.value ? '4px' : '0' }"
              />
            </div>
            <span class="w-14 text-right text-sm font-semibold tabular-nums text-foreground shrink-0">
              {{ item.value }}
            </span>
          </div>
        </div>
      </div>

      <!-- Houses by status: 3 cards, each with label + number + horizontal bar -->
      <div class="border-b border-border pb-6">
        <div :class="sectionTitleClass">
          <UIcon :name="ICONS.BUILDING" class="w-4 h-4 text-primary shrink-0" />
          <h4 :class="sectionHeadingClass">
            Houses by status
          </h4>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col gap-3">
            <div class="flex items-center justify-between gap-2">
              <span class="text-sm font-medium text-muted-foreground">Owned</span>
              <span class="text-xl font-bold text-foreground tabular-nums">{{ usage.houses_owned }}</span>
            </div>
            <div class="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                class="h-full rounded-full bg-primary transition-all duration-300"
                :style="{ width: `${pct(housesTotal, usage.houses_owned)}%`, minWidth: usage.houses_owned ? '4px' : '0' }"
              />
            </div>
          </div>
          <div class="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col gap-3">
            <div class="flex items-center justify-between gap-2">
              <span class="text-sm font-medium text-muted-foreground">Available</span>
              <span class="text-xl font-bold text-foreground tabular-nums">{{ usage.houses_available }}</span>
            </div>
            <div class="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                class="h-full rounded-full bg-primary/70 transition-all duration-300"
                :style="{ width: `${pct(housesTotal, usage.houses_available)}%`, minWidth: usage.houses_available ? '4px' : '0' }"
              />
            </div>
          </div>
          <div class="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col gap-3">
            <div class="flex items-center justify-between gap-2">
              <span class="text-sm font-medium text-muted-foreground">No owner</span>
              <span class="text-xl font-bold text-foreground tabular-nums">{{ usage.houses_no_owner }}</span>
            </div>
            <div class="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                class="h-full rounded-full bg-muted-foreground/50 transition-all duration-300"
                :style="{ width: `${pct(housesTotal, usage.houses_no_owner)}%`, minWidth: usage.houses_no_owner ? '4px' : '0' }"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Residents: card with total + active and horizontal segmented bar -->
      <div class="border-b border-border pb-6">
        <div :class="sectionTitleClass">
          <UIcon :name="ICONS.USERS" class="w-4 h-4 text-primary shrink-0" />
          <h4 :class="sectionHeadingClass">
            Residents
          </h4>
        </div>
        <div class="rounded-xl border border-border bg-card p-5 shadow-sm flex flex-col gap-4">
          <div class="flex items-center justify-between gap-4 flex-wrap">
            <div class="flex items-center gap-2">
              <UIcon :name="ICONS.USERS" class="w-5 h-5 text-primary shrink-0" />
              <span class="text-sm font-medium text-muted-foreground">Total</span>
              <span class="text-xl font-bold text-foreground tabular-nums">{{ usage.total_residents }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium text-muted-foreground">Active</span>
              <span class="text-xl font-bold text-foreground tabular-nums">{{ usage.active_residents }}</span>
              <span class="text-sm text-muted-foreground">({{ pct(usage.total_residents, usage.active_residents) }}%)</span>
            </div>
          </div>
          <div class="h-3 w-full rounded-lg overflow-hidden flex bg-muted">
            <div
              class="bg-primary transition-all duration-500"
              :style="{ width: `${pct(usage.total_residents, usage.active_residents)}%` }"
            />
          </div>
        </div>
      </div>

      <!-- Guards: card with total + active and horizontal segmented bar -->
      <div>
        <div :class="sectionTitleClass">
          <UIcon :name="ICONS.LOCK" class="w-4 h-4 text-primary shrink-0" />
          <h4 :class="sectionHeadingClass">
            Guards
          </h4>
        </div>
        <div class="rounded-xl border border-border bg-card p-5 shadow-sm flex flex-col gap-4">
          <div class="flex items-center justify-between gap-4 flex-wrap">
            <div class="flex items-center gap-2">
              <UIcon :name="ICONS.LOCK" class="w-5 h-5 text-primary shrink-0" />
              <span class="text-sm font-medium text-muted-foreground">Total</span>
              <span class="text-xl font-bold text-foreground tabular-nums">{{ usage.total_guards }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium text-muted-foreground">Active</span>
              <span class="text-xl font-bold text-foreground tabular-nums">{{ usage.active_guards }}</span>
              <span class="text-sm text-muted-foreground">({{ pct(usage.total_guards, usage.active_guards) }}%)</span>
            </div>
          </div>
          <div class="h-3 w-full rounded-lg overflow-hidden flex bg-muted">
            <div
              class="bg-primary transition-all duration-500"
              :style="{ width: `${pct(usage.total_guards, usage.active_guards)}%` }"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- No data -->
    <div v-else class="flex flex-col items-center justify-center py-12 gap-2">
      <div class="p-4 rounded-full bg-muted/50">
        <UIcon :name="ICONS.REPORTS" class="w-6 h-6 text-muted-foreground" />
      </div>
      <p class="text-sm text-muted-foreground">
        No usage data available.
      </p>
    </div>
  </div>
</template>
