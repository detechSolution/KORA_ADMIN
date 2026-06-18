<script setup lang="ts">
import { computed, ref, watch } from "vue";

import { ICONS } from "~/config/icons";
import { useMembershipStore } from "~/stores/membership";
import { formatDate } from "~/utils/common";
import { getApiErrorMessage } from "~/utils/error";

type Props = {
  open?: boolean;
  member: any;
};

const props = withDefaults(defineProps<Props>(), {
  open: false,
  member: null,
});

const emit = defineEmits<{
  (e: "close"): void;
}>();

const selectedTab = ref("profile");

const tabs = [
  { label: "Profile", value: "profile" },
  { label: "Bookings", value: "bookings" },
  { label: "Payments", value: "payments" },
];

const profileEditInfo = computed(() => {
  if (!props.member)
    return [];
  return [
    { label: "Created At", value: formatDate(props.member?.joinedAt as string), icon: ICONS.CALENDAR },
    // { label: "Last Edited By", value: props.member?.user?.role || "-", icon: ICONS.USER_PLUS },
    { label: "Last Edited Date", value: formatDate(props.member?.updatedAt as string), icon: ICONS.CALENDAR },
  ];
});

const membershipStore = useMembershipStore();
const { error: showError } = useNotification();
const loading = computed(() => membershipStore.loading);
const memberBookings = computed(() => membershipStore.memberBookings);
const memberPayments = computed(() => membershipStore.memberPayments);

async function fetchBookingsandPayments() {
  try {
    loading.value = true;
    await membershipStore.fetchMemberBookings(props.member.id);
    await membershipStore.fetchMemberPayments(props.member.id);
  }
  catch (error: unknown) {
    showError({ message: getApiErrorMessage(error, "Failed to load member details") });
  }
  finally {
    loading.value = false;
  }
}

watch(
  () => props.open,
  (open: boolean) => {
    if (open && props.member) {
      fetchBookingsandPayments();
    }
  },
  { immediate: true },
);
</script>

<template>
  <base-modal
    :open="open"
    title="Member Profile"
    :modal-width="800"
    dismissible
    @close="emit('close')"
  >
    <base-tabs
      v-model="selectedTab"
      :items="tabs"
      variant="solid"
      class="p-6"
      color="secondary"
    >
      <section
        v-if="selectedTab === 'profile'"
        class="flex flex-col gap-4"
      >
        <!-- Profile Info -->
        <div class="flex justify-between">
          <div class="flex flex-col gap-4 justify-between">
            <!-- Name + Role badge -->
            <div class="flex flex-col gap-2">
              <p class="text-xs text-secondary-400 font-normal">
                Name
              </p>
              <div class="flex items-center gap-2">
                <base-avatar
                  key=""
                  :name="member?.user?.fullName"
                  :src="member?.user?.fullName"
                />
                <p class="text-sm font-medium">
                  {{ member?.user?.fullName }}
                </p>
                <base-badge
                  v-if="member?.user?.role"
                  :status="member?.user?.role"
                >
                  {{ member?.user?.role }}
                </base-badge>
              </div>
            </div>

            <!-- Phone -->
            <div class="flex flex-col items-start gap-2">
              <p class="text-xs text-secondary-400 font-normal">
                Phone
              </p>
              <p class="text-sm font-medium">
                {{ member?.user?.phoneNumber || member?.phoneNumber || "N/A" }}
              </p>
            </div>
          </div>

          <div class="flex flex-col gap-4 justify-between">
            <!-- Email -->
            <div class="flex flex-col gap-2">
              <p class="text-xs text-secondary-400 font-normal">
                Email
              </p>
              <p class="text-sm font-medium">
                {{ member?.user?.email || "N/A" }}
              </p>
            </div>

            <!-- Status -->
            <div class="flex flex-col gap-2 self-start">
              <p class="text-xs text-secondary-400 font-normal">
                Status
              </p>
              <div class="flex items-center gap-2">
                <div class="h-2 w-2 rounded-full" :class="member?.user?.isActive ? 'bg-green-500' : 'bg-red-500'" />
                {{ member?.user?.isActive ? "Active" : "Inactive" }}
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="member?.membershipPlan && member?.isActive"
          class="border border-stone-200 rounded-md p-3 flex justify-between items-center"
        >
          <div class="flex flex-col gap-2">
            <div class="flex items-center gap-2">
              <h2>
                {{ member?.membershipPlan?.name }}
              </h2>

              <base-badge
                v-if="member?.isFrozen"
              >
                Freezed
              </base-badge>
            </div>
            <p class="text-secondary-400 font-normal text-xs">
              {{ member?.subscriptionStartDate }} - {{ member?.subscriptionEndDate }}
            </p>

            <base-badge class="w-fit" :status="member?.membershipPlanOption?.frequency">
              {{ member?.membershipPlanOption?.frequency }}
            </base-badge>
          </div>

          <p class="text-secondary-400 font-semibold text-xs">
            Rs. {{ member?.membershipPlanOption?.price }}
          </p>
        </div>

        <USeparator />

        <!-- Additional Info Cards -->
        <div class="flex justify-between gap-4">
          <div
            v-for="profile in profileEditInfo"
            :key="profile.label"
            class="flex flex-col w-full gap-2 p-3 rounded-md"
          >
            <div class="text-secondary-400 text-xs flex gap-2 items-center">
              <UIcon :name="profile.icon" class="w-4 h-4" />
              <span>{{ profile.label }}</span>
            </div>
            <span class="text-sm font-medium text-secondary-700">{{ profile.value }}</span>
          </div>
        </div>
      </section>

      <section
        v-if="selectedTab === 'bookings'"
        class="flex flex-col gap-4"
      >
        <div v-if="memberBookings.data.length" class="space-y-2">
          <div
            v-for="booking in memberBookings.data"
            :key="booking.id"
            class="p-3 border gap-8 border-stone-200 rounded-md flex justify-between items-center"
          >
            <div class="flex items-center justify-between w-full">
              <p class="font-medium text-sm text-secondary">
                {{ booking.itemName }}
              </p>

              <p class="text-xs font-normal text-secondary-500">
                {{ formatDate(booking.bookedFor) }}
              </p>
            </div>
            <base-badge :status="booking.status">
              {{ booking.status }}
            </base-badge>
          </div>
        </div>
        <div v-else>
          <base-empty
            title="No bookings"
          />
        </div>
      </section>

      <section
        v-if="selectedTab === 'payments'"
        class="flex flex-col gap-4"
      >
        <div v-if="memberPayments.data.length" class="space-y-2">
          <div
            v-for="payment in memberPayments.data"
            :key="payment.id"
            class="p-3 border gap-8 border-stone-200 rounded-md flex justify-between items-center"
          >
            <div class="flex w-full items-center justify-between">
              <div class="font-medium flex gap-2 items-center text-sm text-secondary">
                {{ payment.title }}

                <base-badge uppercase>
                  {{ payment.bookingCode || payment.referenceCode }}
                </base-badge>
              </div>
              <p class="text-xs font-normal text-secondary-500">
                {{ formatDate(payment.createdAt) }}
              </p>
            </div>

            <base-badge :status="payment.status">
              {{ payment.status }}
            </base-badge>
          </div>
        </div>
        <div v-else>
          <base-empty
            title="No payments"
          />
        </div>
      </section>
    </base-tabs>
  </base-modal>
</template>
