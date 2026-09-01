<script setup lang="ts">
import { computed, onMounted, reactive, ref, toRef, watch } from "vue";
import { useRouter } from "vue-router";
import z from "zod";

import type { MemberOption } from "~/composables/use-member-options";

import { useMemberOptions } from "~/composables/use-member-options";
import { useNotification } from "~/composables/use-notification";
import { ICONS } from "~/config/icons";
import { useAccessControlStore } from "~/stores/access-control";
import { preventInvalidNumberInput } from "~/utils/common";
import { getApiErrorMessage } from "~/utils/error";

definePageMeta({
  auth: true,
  layout: "dashboard",
});

const { success, error: showError } = useNotification();
const accessControlStore = useAccessControlStore();
const formRef = ref<InstanceType<typeof UForm> | null>(null);
const router = useRouter();

const state = reactive({
  userType: "existing_user" as "existing_user" | "non_existing_user",
  selectedUser: null as string | number | null,
  cardNumber: "",
  fullName: "",
  phoneNumber: "",
  doorNumbers: [] as number[],
  removeExpiration: false,
  validFrom: null as string | null,
  validUntil: null as string | null,
});

const schema = z
  .object({
    userType: z.enum(["existing_user", "non_existing_user"]),
    selectedUser: z.union([z.string(), z.number()]).nullable(),
    fullName: z.string(),
    cardNumber: z.string().trim().min(1, "Card number is required"),
    doorNumbers: z.number().array().min(1, "Please select at least one door"),
    validFrom: z.string().nullable(),
    validUntil: z.string().nullable(),
    removeExpiration: z.boolean(),
  })
  .superRefine((form, context) => {
    if (form.userType === "existing_user" && !form.selectedUser) {
      context.addIssue({
        code: "custom",
        path: ["selectedUser"],
        message: "Please select a member or guest",
      });
    }
    if (form.userType === "non_existing_user" && !form.fullName.trim()) {
      context.addIssue({
        code: "custom",
        path: ["fullName"],
        message: "Full name is required",
      });
    }
    if (!form.removeExpiration) {
      if (!form.validFrom) {
        context.addIssue({
          code: "custom",
          path: ["validFrom"],
          message: "Valid from date is required",
        });
      }
      if (!form.validUntil) {
        context.addIssue({
          code: "custom",
          path: ["validUntil"],
          message: "Valid until date is required",
        });
      }
    }
  });

const doorOptions = [
  { label: "Main Gate", value: 1 },
  { label: "Recovery Space", value: 2 },
  { label: "Restaurant", value: 3 },
];
const userTypeOptions = [
  { label: "Existing User", value: "existing_user" },
  { label: "Non-existing User", value: "non_existing_user" },
];
const isExistingUser = computed(() => state.userType === "existing_user");

const {
  options: userOptions,
  searchTerm: memberSearchTerm,
  selectedOption: selectedMember,
  loading: memberOptionsLoading,
  load: loadMembers,
} = useMemberOptions(toRef(state, "selectedUser"));

function applyMemberDates(member: MemberOption | null): void {
  if (member?.startDate && member.endDate) {
    state.validFrom = member.startDate;
    state.validUntil = member.endDate;
    state.removeExpiration = false;
  }
  else if (isExistingUser.value) {
    state.validFrom = null;
    state.validUntil = null;
  }
}

watch(
  () => state.removeExpiration,
  (enabled) => {
    if (enabled) {
      state.validFrom = null;
      state.validUntil = null;
    }
  },
);

watch(selectedMember, applyMemberDates);

watch(
  () => state.userType,
  (userType) => {
    if (userType === "non_existing_user") {
      state.selectedUser = null;
      state.validFrom = null;
      state.validUntil = null;
    }
  },
);

async function createAccessCard(): Promise<void> {
  try {
    await formRef.value?.validate();
  }
  catch {
    return;
  }

  try {
    const payload = {
      userType: state.userType as "existing_user" | "non_existing_user",
      userId: state.selectedUser,
      fullName:
        state.fullName.trim() || selectedMember.value?.fullName || undefined,
      phoneNumber:
        state.phoneNumber.trim()
        || selectedMember.value?.phoneNumber
        || undefined,
      cardNumber: state.cardNumber.trim(),
      doorNumbers: state.doorNumbers,
      validFrom: state.removeExpiration ? null : state.validFrom,
      validUntil: state.removeExpiration ? null : state.validUntil,
      removeExpiration: state.removeExpiration,
    };

    if (payload.removeExpiration) {
      payload.validFrom = null;
      payload.validUntil = null;
    }

    await accessControlStore.createAccessCard(payload);
    success({ message: "Access card created successfully" });
    router.push("/access-control/access-cards");
  }
  catch (error) {
    showError({
      message: getApiErrorMessage(error, "Failed to create booking"),
    });
  }
}

onMounted(loadMembers);
</script>

<template>
  <div class="flex flex-col gap-6">
    <base-page-header>
      <template #title>
        Create Access Card
      </template>
      <template #description>
        Create, assign and set validity to the access card
      </template>
      <template #actions>
        <NuxtLink to="/access-control/access-cards">
          <base-button variant="outline" :leading-icon="ICONS.ARROW_LEFT">
            Back to list
          </base-button>
        </NuxtLink>
      </template>
    </base-page-header>

    <div
      class="rounded-xl bg-card p-4 sm:p-5 shadow-sm flex flex-col md:flex-row gap-6 min-h-[450px]"
    >
      <aside
        class="md:w-[230px] shrink-0 rounded-md border border-border bg-stone-50 self-stretch"
      >
        <div class="p-3">
          <h2 class="text-sm font-semibold">
            User Type
          </h2>
          <p class="mt-1 text-[11px] text-secondary-500">
            Is this user existing or non-existing? Select accordingly.
          </p>
        </div>
        <USeparator />
        <div class="p-2">
          <base-tabs
            v-model="state.userType"
            :items="userTypeOptions"
            variant="solid"
            color="primary"
            orientation="vertical"
          />
        </div>
      </aside>

      <section class="min-w-0 flex-1">
        <UForm
          ref="formRef"
          :schema="schema"
          :state="state"
          :validate-on="['input', 'change', 'blur']"
          class="contents"
        >
          <form-header-card
            label="Create Access Card"
            description="Issue an access card, assign it to a user, set door permissions, and configure card validity dates."
            :icon="ICONS.CARD"
          />

          <div
            class="mt-4 rounded-lg border border-border bg-card p-4 shadow-sm"
          >
            <base-select-searchable
              v-if="isExistingUser"
              v-model="state.selectedUser"
              v-model:search-term="memberSearchTerm"
              name="selectedUser"
              label="Select an existing user"
              placeholder="Select a user"
              search-placeholder="Search members..."
              :loading="memberOptionsLoading"
              :options="userOptions"
            />
            <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <base-input
                v-model="state.fullName"
                name="fullName"
                label="Enter Full Name"
                placeholder="Enter full name"
              />
              <base-input
                v-model="state.phoneNumber"
                name="phoneNumber"
                label="Enter Phone Number (optional)"
                placeholder="Enter phone number"
                type="tel"
                @keydown="preventInvalidNumberInput"
              />
            </div>

            <base-input
              v-model="state.cardNumber"
              name="cardNumber"
              label="Card Number"
              placeholder="Enter Card Number"
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
                  :class="
                    state.doorNumbers.includes(door.value)
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:bg-stone-50'
                  "
                  @click="
                    state.doorNumbers = state.doorNumbers.includes(door.value)
                      ? state.doorNumbers.filter(
                        (number) => number !== door.value,
                      )
                      : [...state.doorNumbers, door.value]
                  "
                >
                  {{ door.label }}
                </button>
              </div>
            </UFormField>

            <div
              v-if="!isExistingUser"
              class="mt-4 flex items-center justify-between rounded-md bg-stone-50 px-3 py-2"
            >
              <div>
                <p class="text-sm font-medium">
                  Remove Expiration
                </p>
                <p class="text-xs text-secondary-500">
                  Turn this option on to make the card valid forever without an
                  expiration date.
                </p>
              </div>
              <USwitch v-model="state.removeExpiration" color="success" />
            </div>

            <div
              v-if="isExistingUser || !state.removeExpiration"
              class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              <base-date-picker
                v-model="state.validFrom"
                name="validFrom"
                label="Valid From"
                placeholder="Select From date"
                :min-date="selectedMember?.startDate"
                :max-date="selectedMember?.endDate"
                :no-of-months="1"
              />
              <base-date-picker
                v-model="state.validUntil"
                name="validUntil"
                label="Valid Until"
                placeholder="Select To date"
                :min-date="selectedMember?.startDate"
                :max-date="selectedMember?.endDate"
                :no-of-months="1"
              />
            </div>
          </div>

          <div class="mt-4 flex justify-end">
            <base-button
              variant="solid"
              :loading="accessControlStore.loading"
              :disabled="accessControlStore.loading"
              size="md"
              @click="createAccessCard"
            >
              Create
            </base-button>
          </div>
        </UForm>
      </section>
    </div>
  </div>
</template>
