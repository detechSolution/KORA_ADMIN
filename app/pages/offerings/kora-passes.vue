<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import { ICONS } from "~/config/icons";
import { useKoraPassesStore } from "~/stores/kora-passes";

definePageMeta({
  auth: true,
  layout: "dashboard",
  permission: "offerings.kora_passes.view",
});

const koraPassesStore = useKoraPassesStore();

const isEditDrawerOpen = ref(false);
const selectedPass = ref<any>(null);

const koraPasses = computed(() => koraPassesStore.koraPasses);

onMounted(() => {
  koraPassesStore.getKoraPasses();
});

function handleEditPass(id: number) {
  const pass = koraPasses.value.data.find((p: any) => p.id === id);
  if (pass) {
    selectedPass.value = pass;
    isEditDrawerOpen.value = true;
  }
}

function handleSuccess() {
  koraPassesStore.getKoraPasses();
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
            size="lg"
            :leading-icon="ICONS.PLUS"
          >
            Create Pass
          </base-button>
        </NuxtLink>
      </template>
    </base-page-header>

    <div class="rounded-b-xl">
      <!-- Loading State -->
      <div v-if="koraPassesStore.loading && !koraPasses.data.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="i in 3"
          :key="i"
          class="h-64 rounded-xl bg-stone-100 animate-pulse"
        />
      </div>

      <!-- Empty State -->
      <base-empty
        v-else-if="!koraPasses.data.length"
        title="No passes found"
      />

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

    <!-- Edit Pass Drawer -->
    <OfferingsEditPassDrawer
      :open="isEditDrawerOpen"
      :pass="selectedPass"
      @close="isEditDrawerOpen = false"
      @success="handleSuccess"
    />
  </div>
</template>

<style scoped>

</style>
