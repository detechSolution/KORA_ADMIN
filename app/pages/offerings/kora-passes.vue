<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import { useNotification } from "~/composables/use-notification";
import { ICONS } from "~/config/icons";
import { PERMISSIONS_KORA_PASSES } from "~/config/permissions";
import { useKoraPassesStore } from "~/stores/kora-passes";
import { getApiErrorMessage } from "~/utils/error";

definePageMeta({
  auth: true,
  layout: "dashboard",
  permission: "offerings.kora_passes.view",
});

const koraPassesStore = useKoraPassesStore();

const isEditDrawerOpen = ref(false);
const isInvitationModalOpen = ref(false);
const selectedPass = ref<any>(null);
const { can } = usePermission();
const { success: showSuccess, error: showError } = useNotification();
const koraPasses = computed(() => koraPassesStore.koraPasses);
const regularPasses = computed(() => koraPasses.value.data.filter((pass: any) => !pass.isInvitation));
const invitationPasses = computed(() => koraPasses.value.data.filter((pass: any) => pass.isInvitation));

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

function handleInvitePass(id: number) {
  const pass = koraPasses.value.data.find((item: any) => item.id === id);
  if (pass) {
    selectedPass.value = pass;
    isInvitationModalOpen.value = true;
  }
}

async function handleSendInvitation(payload: { passId: number; emails: string[]; fromDate: string; toDate: string }) {
  try {
    await koraPassesStore.invitePass(payload.passId, payload.emails, payload.fromDate, payload.toDate);
    showSuccess({ message: "Invitation sent successfully" });
    isInvitationModalOpen.value = false;
  }
  catch (error: unknown) {
    showError({ message: getApiErrorMessage(error, "Failed to send invitation") });
  }
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
          v-if="can(PERMISSIONS_KORA_PASSES.CREATE)"
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

    <div class="rounded-b-xl space-y-10">
      <!-- Loading State -->
      <div v-if="koraPassesStore.loading && !koraPasses.data.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="i in 3"
          :key="i"
          class="h-64 rounded-xl bg-stone-100 animate-pulse"
        />
      </div>

      <div v-else class="space-y-10">
        <!-- Regular Passes -->
        <section>
          <div class="mb-4">
            <h2 class="text-xl font-semibold text-secondary-900">
              Regular Passes
            </h2>
            <p class="text-sm text-secondary-500">
              Passes available on the website.
            </p>
          </div>

          <base-empty
            v-if="!regularPasses.length"
            title="No regular passes found"
            description="Create a regular pass to display it here."
          />

          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <OfferingsKoraPassCard
              v-for="pass in regularPasses"
              :key="pass.id"
              v-bind="pass"
              @edit="handleEditPass"
              @invite="handleInvitePass"
            />
          </div>
        </section>

        <!-- Invitation Passes -->
        <section>
          <div class="mb-4">
            <h2 class="text-xl font-semibold text-secondary-900">
              Invitation Passes
            </h2>
            <p class="text-sm text-secondary-500">
              Private passes that are not displayed on the website.
            </p>
          </div>

          <base-empty
            v-if="!invitationPasses.length"
            title="No invitation passes found"
            description="Invitation passes will appear here once created."
          />

          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <OfferingsKoraPassCard
              v-for="pass in invitationPasses"
              :key="pass.id"
              v-bind="pass"
              @edit="handleEditPass"
              @invite="handleInvitePass"
            />
          </div>
        </section>
      </div>
    </div>

    <!-- Edit Pass Drawer -->
    <OfferingsEditPassDrawer
      :open="isEditDrawerOpen"
      :pass="selectedPass"
      @close="isEditDrawerOpen = false"
      @success="handleSuccess"
    />

    <OfferingsSendInvitationModal
      :open="isInvitationModalOpen"
      :pass="selectedPass"
      :loading="koraPassesStore.loading"
      @close="isInvitationModalOpen = false"
      @send="handleSendInvitation"
    />
  </div>
</template>

<style scoped>

</style>
