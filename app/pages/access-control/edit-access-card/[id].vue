<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import z from "zod";

import { useNotification } from "~/composables/use-notification";
import { ICONS } from "~/config/icons";
import { useAccessControlStore } from "~/stores/access-control";
import { useMembershipStore } from "~/stores/membership";

definePageMeta({ auth: true, layout: "dashboard" });

const route = useRoute();
const router = useRouter();
const store = useAccessControlStore();
const membershipStore = useMembershipStore();
const { success, error } = useNotification();
const errors = ref<Record<string, string>>({});

const state = reactive({
  userType: "existing_user",
  userId: null as number | null,
  fullName: "",
  phoneNumber: "",
  cardNumber: "",
  doorNumbers: [] as number[],
  validFrom: null as string | null,
  validUntil: null as string | null,
  removeExpiration: false,
});

const schema = z.object({
  fullName: z.string().trim().min(1, "Full name is required"),
  cardNumber: z.string().trim().min(1, "Card number is required"),
  doorNumbers: z.number().array().min(1, "Please select at least one door"),
  validFrom: z.string().nullable(),
  validUntil: z.string().nullable(),
  removeExpiration: z.boolean(),
}).superRefine((form, context) => {
  if (!form.removeExpiration) {
    if (!form.validFrom)
      context.addIssue({ code: "custom", path: ["validFrom"], message: "Valid from date is required" });
    if (!form.validUntil)
      context.addIssue({ code: "custom", path: ["validUntil"], message: "Valid until date is required" });
  }
});

const doorOptions = [
  { label: "Main Gate", value: 1 },
  { label: "Recovery Space", value: 2 },
  { label: "Restaurant", value: 3 },
];
const userOptions = computed(() => membershipStore.membershipOptions.map((member: { fullName: string; memberId: number; userId: number; email?: string }) => ({
  label: member.fullName,
  value: member.userId,
  description: member.email,
})));

function dateValue(value: string | null): string | null {
  return value ? value.slice(0, 10) : null;
}

async function loadCard(): Promise<void> {
  const card = await store.fetchAccessCard(Number(route.params.id));
  state.userType = card.userType;
  state.userId = card.userId;
  state.fullName = card.fullName;
  state.phoneNumber = card.phoneNumber;
  state.cardNumber = card.cardNumber;
  state.doorNumbers = [...card.doorNumbers];
  state.validFrom = dateValue(card.validFrom);
  state.validUntil = dateValue(card.validUntil);
  state.removeExpiration = card.removeExpiration;
}

async function updateAccessCard(): Promise<void> {
  errors.value = {};
  const validation = schema.safeParse(state);
  if (!validation.success) {
    errors.value = validation.error.issues.reduce<Record<string, string>>((result, issue) => {
      const field = String(issue.path[0]);
      if (!result[field])
        result[field] = issue.message;
      return result;
    }, {});
    error({ message: "Please fix the highlighted fields" });
    return;
  }

  try {
    await store.updateAccessCard(Number(route.params.id), {
      userType: state.userType as "existing_user" | "non_existing_user",
      userId: state.userId,
      fullName: state.fullName.trim(),
      phoneNumber: state.phoneNumber.trim(),
      cardNumber: state.cardNumber.trim(),
      doorNumbers: state.doorNumbers,
      validFrom: state.removeExpiration ? null : state.validFrom,
      validUntil: state.removeExpiration ? null : state.validUntil,
      removeExpiration: state.removeExpiration,
    });
    success({ message: "Access card updated successfully" });
    await router.push("/access-control/access-cards");
  }
  catch {
    error({ message: "Unable to update access card" });
  }
}

onMounted(async () => {
  try {
    await Promise.all([membershipStore.getMembersOptions(), loadCard()]);
  }
  catch {
    error({ message: "Unable to load access card" });
  }
});
</script>

<template>
  <div class="flex flex-col gap-6">
    <base-page-header>
      <template #title>
        Edit Access Card
      </template>
      <template #description>
        Edit access card details, assign and set validity
      </template>
      <template #actions>
        <base-button
          variant="outline"
          :leading-icon="ICONS.ARROW_LEFT"
          @click="router.push('/access-control/access-cards')"
        >
          Back to list
        </base-button>
      </template>
    </base-page-header>

    <div class="rounded-xl bg-card p-4 sm:p-5 shadow-sm">
      <form-header-card
        label="Edit Access Card"
        description="Edit access card, assign it to an user, set door permissions, and configure card validity dates."
        :icon="ICONS.ID_CARD"
      />

      <div class="mt-4 rounded-lg border border-border bg-card p-4 shadow-sm">
        <base-select-searchable
          v-if="state.userType === 'existing_user'"
          v-model="state.userId"
          name="existingUser"
          label="Select an existing member / guest"
          placeholder="Select a member"
          :options="userOptions"
          required
        />
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <base-input
            v-model="state.fullName"
            name="fullName"
            label="Enter Full Name"
            :error="errors.fullName"
            required
          />
          <base-input
            v-model="state.phoneNumber"
            name="phoneNumber"
            label="Enter Phone Number (optional)"
          />
        </div>

        <base-input
          v-model="state.cardNumber"
          name="cardNumber"
          label="Card Number"
          class="mt-3"
          :error="errors.cardNumber"
          required
        />

        <div class="mt-4">
          <p class="mb-2 text-sm font-medium">
            Door Access
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              v-for="door in doorOptions"
              :key="door.value"
              type="button"
              class="h-10 rounded-md border px-3 text-left text-sm transition-colors"
              :class="state.doorNumbers.includes(door.value) ? 'border-primary bg-primary/10' : 'border-border hover:bg-stone-50'"
              @click="state.doorNumbers = state.doorNumbers.includes(door.value) ? state.doorNumbers.filter(number => number !== door.value) : [...state.doorNumbers, door.value]"
            >
              {{ door.label }}
            </button>
          </div>
          <p v-if="errors.doorNumbers" class="mt-1 text-xs text-red-500">
            {{ errors.doorNumbers }}
          </p>
        </div>

        <div class="mt-4 flex items-center justify-between rounded-md bg-stone-50 px-3 py-2">
          <div>
            <p class="text-sm font-medium">
              Remove Expiration
            </p>
            <p class="text-xs text-secondary-500">
              Turn this option on to make the card valid forever without an expiration date.
            </p>
          </div>
          <USwitch v-model="state.removeExpiration" color="success" />
        </div>

        <div v-if="!state.removeExpiration" class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <base-date-picker
            v-model="state.validFrom"
            name="validFrom"
            label="Valid From"
            placeholder="Select From date"
            :error="errors.validFrom"
            :no-of-months="1"
          />
          <base-date-picker
            v-model="state.validUntil"
            name="validUntil"
            label="Valid Until"
            placeholder="Select To date"
            :error="errors.validUntil"
            :no-of-months="1"
          />
        </div>
      </div>

      <div class="mt-4 flex justify-end">
        <base-button
          variant="solid"
          size="md"
          :loading="store.loading"
          @click="updateAccessCard"
        >
          Update
        </base-button>
      </div>
    </div>
  </div>
</template>
