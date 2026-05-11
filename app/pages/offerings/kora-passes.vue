<script setup lang="ts">
import { computed, onMounted } from "vue";

import { ICONS } from "~/config/icons";
import { useKoraPassesStore } from "~/stores/kora-passes";

definePageMeta({
  auth: true,
  layout: "dashboard",
  permission: "offerings.sessions.view",
});

const koraPassesStore = useKoraPassesStore();

const koraPasses = computed(() => koraPassesStore.koraPasses);

onMounted(() => {
  koraPassesStore.getKoraPasses();
});

function handleEditPass(id: number) {
  console.log("Edit pass", id);
  // Implementation for edit pass
}
</script>

<template>
  <div class="w-full gap-6 flex flex-col">
    <base-page-header>
      <template #title>
        Kora Passes
      </template>
      <template #description>
        Manage multiple kora passes
      </template>
      <template #actions>
        <NuxtLink
          to="/offerings/create-passes"
        >
          <base-button
            variant="solid"
            size="md"
            :leading-icon="ICONS.PLUS"
          >
            Create Pass
          </base-button>
        </NuxtLink>
      </template>
    </base-page-header>

    <div class="rounded-b-xl">
      <!-- Loading State -->
      <div v-if="koraPassesStore.loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="i in 3"
          :key="i"
          class="h-64 rounded-xl bg-stone-100 animate-pulse"
        />
      </div>

      <!-- Passes Cards -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <OfferingsKoraPassCard
          v-for="pass in koraPasses.data"
          :key="pass.id"
          v-bind="pass"
          @edit="handleEditPass"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
