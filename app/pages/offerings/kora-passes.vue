<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import type {
  InvitationRequest,
  InvitationResult,
  KoraPass,
} from "~/types/kora-passes";

import { useNotification } from "~/composables/use-notification";
import { ICONS } from "~/config/icons";
import { PERMISSIONS_KORA_PASSES } from "~/config/permissions";
import { useKoraPassesStore } from "~/stores/kora-passes";
import { getApiErrorMessage, isApiError } from "~/utils/error";
import { invitationResultSchema } from "~/utils/pass-invitations";

definePageMeta({
  auth: true,
  layout: "dashboard",
  permission: "offerings.kora_passes.view",
});

const koraPassesStore = useKoraPassesStore();

const isEditDrawerOpen = ref(false);
const isInvitationModalOpen = ref(false);
const selectedPass = ref<KoraPass | null>(null);
const isInviteesDrawerOpen = ref(false);
const invitationResult = ref<InvitationResult | null>(null);
const { can } = usePermission();
const { success: showSuccess, error: showError } = useNotification();
const koraPasses = computed(() => koraPassesStore.koraPasses);
const regularPasses = computed(() =>
  koraPasses.value.data.filter(pass => !pass.isInvitation),
);
const invitationPasses = computed(() =>
  koraPasses.value.data.filter(pass => pass.isInvitation),
);

async function loadPasses() {
  try {
    await koraPassesStore.getKoraPasses();
  }
  catch (error: unknown) {
    showError({ message: getApiErrorMessage(error, "Unable to load passes") });
  }
}
onMounted(loadPasses);

function handleEditPass(id: number) {
  const pass = koraPasses.value.data.find(p => p.id === id);
  if (pass) {
    selectedPass.value = pass;
    isEditDrawerOpen.value = true;
  }
}

function handleSuccess() {
  void loadPasses();
}

function handleInvitePass(id: number) {
  const pass = koraPasses.value.data.find(item => item.id === id);
  if (pass) {
    selectedPass.value = pass;
    invitationResult.value = null;
    isInvitationModalOpen.value = true;
  }
}

function handleViewInvitees(id: number) {
  selectedPass.value
    = koraPasses.value.data.find(pass => pass.id === id) ?? null;
  isInviteesDrawerOpen.value = Boolean(selectedPass.value);
}

async function handleSendInvitation(payload: InvitationRequest) {
  if (koraPassesStore.loading || !can(PERMISSIONS_KORA_PASSES.CREATE))
    return;
  try {
    const result = await koraPassesStore.invitePass(
      payload.passId,
      payload.guests,
      payload.fromDate,
    );
    invitationResult.value = result;
    if (
      !result.skipped.length
      && result.granted.every(guest => guest.sentEmail)
    ) {
      showSuccess({
        message: `${result.granted.length} invitation(s) sent successfully`,
      });
      isInvitationModalOpen.value = false;
    }
  }
  catch (error: unknown) {
    const result = isApiError(error)
      ? invitationResultSchema.safeParse(error.data)
      : null;
    if (result?.success) {
      invitationResult.value = result.data;
    }
    else {
      showError({
        message: getApiErrorMessage(
          error,
          "Unable to confirm invitations. Check the invitees list before trying again.",
        ),
      });
    }
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

    <div class="rounded-b-xl space-y-5">
      <!-- Loading State -->
      <div
        v-if="koraPassesStore.loading && !koraPasses.data.length"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <div
          v-for="i in 3"
          :key="i"
          class="h-64 rounded-xl bg-stone-100 animate-pulse"
        />
      </div>

      <div v-else class="space-y-5">
        <!-- Regular Passes -->
        <section>
          <base-empty
            v-if="!regularPasses.length"
            title="No regular passes found"
            description="Create a pass to display it here."
          />

          <div
            v-else
            class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3"
          >
            <OfferingsKoraPassCard
              v-for="pass in regularPasses"
              :key="pass.id"
              v-bind="pass"
              @edit="handleEditPass"
              @invite="handleInvitePass"
              @invitees="handleViewInvitees"
            />
          </div>
        </section>

        <!-- Invitation Passes -->
        <section>
          <base-page-header class="mb-4">
            <template #title>
              Invitation Passes
            </template>
            <template #description>
              List of invitation passes
            </template>
          </base-page-header>

          <base-empty
            v-if="!invitationPasses.length"
            title="No invitation passes found"
            description="Invitation passes will appear here once created."
          />

          <div
            v-else
            class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3"
          >
            <OfferingsKoraPassCard
              v-for="pass in invitationPasses"
              :key="pass.id"
              v-bind="pass"
              @edit="handleEditPass"
              @invite="handleInvitePass"
              @invitees="handleViewInvitees"
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
      :result="invitationResult"
      @close="!koraPassesStore.loading && (isInvitationModalOpen = false)"
      @send="handleSendInvitation"
    />
    <OfferingsPassInvitees
      :open="isInviteesDrawerOpen"
      :pass="selectedPass"
      @close="isInviteesDrawerOpen = false"
    />
  </div>
</template>

<style scoped></style>
