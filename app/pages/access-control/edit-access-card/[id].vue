<script setup lang="ts">
import { onMounted, reactive, ref, toRef } from "vue";
import z from "zod";

import { useMemberOptions } from "~/composables/use-member-options";
import { useNotification } from "~/composables/use-notification";
import { ICONS } from "~/config/icons";
import { useAccessControlStore } from "~/stores/access-control";
import { preventInvalidNumberInput } from "~/utils/common";
import { getApiErrorMessage } from "~/utils/error";

definePageMeta({ auth: true, layout: "dashboard" });

const route = useRoute();
const router = useRouter();
const store = useAccessControlStore();
const { success, error: showError } = useNotification();
const formRef = ref<InstanceType<typeof UForm> | null>(null);

const state = reactive({
  userType: "existing_user" as "existing_user" | "non_existing_user",
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
  userType: z.enum(["existing_user", "non_existing_user"]),
  userId: z.union([z.string(), z.number()]).nullable(),
  fullName: z.string(),
  cardNumber: z.string().trim().min(1, "Card number is required"),
  doorNumbers: z.number().array().min(1, "Please select at least one door"),
  validFrom: z.string().nullable(),
  validUntil: z.string().nullable(),
  removeExpiration: z.boolean(),
}).superRefine((form, context) => {
  if (form.userType === "existing_user" && !form.userId)
    context.addIssue({ code: "custom", path: ["userId"], message: "Please select a member or guest" });
  if (form.userType === "non_existing_user" && !form.fullName.trim())
    context.addIssue({ code: "custom", path: ["fullName"], message: "Full name is required" });
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
const {
  options: userOptions,
  searchTerm: memberSearchTerm,
  loading: memberOptionsLoading,
  load: loadMembers,
  setSelectedOption,
} = useMemberOptions(toRef(state, "userId"));

function dateValue(value: string | null): string | null {
  return value ? value.slice(0, 10) : null;
}

async function loadCard(): Promise<void> {
  const card = await store.fetchAccessCard(Number(route.params.id));
  state.userType = card.userType;
  state.userId = card.userId;
  setSelectedOption({
    label: card.fullName || String(card.userId),
    value: card.userId || 0,
    description: card.email,
  });
  state.fullName = card.fullName;
  state.phoneNumber = card.phoneNumber;
  state.cardNumber = Number.parseInt(card.cardNumber, 16).toString().padStart(10, "0");
  state.doorNumbers = [...card.doorNumbers];
  state.validFrom = dateValue(card.validFrom);
  state.validUntil = dateValue(card.validUntil);
  state.removeExpiration = card.removeExpiration;
}

async function updateAccessCard(): Promise<void> {
  try {
    await formRef.value?.validate();
  }
  catch {
    return;
  }

  try {
    await store.updateAccessCard(Number(route.params.id), {
      userType: state.userType as "existing_user" | "non_existing_user",
      userId: state.userId,
      fullName: state.fullName,
      phoneNumber: state.phoneNumber,
      cardNumber: state.cardNumber,
      doorNumbers: state.doorNumbers,
      validFrom: state.removeExpiration ? null : state.validFrom,
      validUntil: state.removeExpiration ? null : state.validUntil,
      removeExpiration: state.removeExpiration,
    });
    success({ message: "Access card updated successfully" });
    await router.push("/access-control/access-cards");
  }
  catch (error: unknown) {
    showError({ message: getApiErrorMessage(error, "Unable to update access card") });
  }
}

onMounted(async () => {
  try {
    await Promise.all([loadMembers(), loadCard()]);
  }
  catch (error: unknown) {
    showError({ message: getApiErrorMessage(error, "Unable to load access card") });
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
      <UForm
        ref="formRef"
        :schema="schema"
        :state="state"
        :validate-on="['input', 'change', 'blur']"
        class="contents"
      >
        <form-header-card
          label="Edit Access Card"
          description="Edit access card, assign it to an user, set door permissions, and configure card validity dates."
          :icon="ICONS.ID_CARD"
        />

        <div class="mt-4 rounded-lg border border-border bg-card p-4 shadow-sm">
          <base-select-searchable
            v-if="state.userType === 'existing_user'"
            v-model="state.userId"
            v-model:search-term="memberSearchTerm"
            name="userId"
            label="Select an existing member / guest"
            placeholder="Select a member"
            search-placeholder="Search members..."
            :loading="memberOptionsLoading"
            :options="userOptions"
          />
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <base-input
              v-model="state.fullName"
              name="fullName"
              label="Enter Full Name"
            />
            <base-input
              v-model="state.phoneNumber"
              name="phoneNumber"
              label="Enter Phone Number (optional)"
              type="tel"
              @keydown="preventInvalidNumberInput"
            />
          </div>

          <base-input
            v-model="state.cardNumber"
            name="cardNumber"
            label="Card Number"
            class="mt-3"
          />

          <UFormField name="doorNumbers" class="mt-4">
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
          </UFormField>

          <div
            v-if="state.userType !== 'existing_user'"
            class="mt-4 flex items-center justify-between rounded-md bg-stone-50 px-3 py-2"
          >
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
              :no-of-months="1"
            />
            <base-date-picker
              v-model="state.validUntil"
              name="validUntil"
              label="Valid Until"
              placeholder="Select To date"
              :no-of-months="1"
            />
          </div>
        </div>
      </UForm>
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
</template>
