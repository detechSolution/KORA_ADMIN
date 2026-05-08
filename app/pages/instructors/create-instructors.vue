<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import z from "zod";

import { ICONS } from "~/config/icons";
import { useMailStore } from "~/stores/mail";
import { getApiErrorMessage } from "~/utils/error";

definePageMeta({
  layout: "dashboard",
  auth: true,
  permission: "administration.roles.create",
});

const mailStore = useMailStore();
const toast = useNotification();
const router = useRouter();

const loading = ref(false);
const apiError = ref<string | null>(null);
const formRef = ref<InstanceType<typeof UForm> | null>(null);
const recipients = ref<any[]>([]);

const ALL_RECIPIENTS_VALUE = "__newsletter_subscribers__";

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? "")
    .join("");
}

const individualRecipientOptions = computed(() =>
  recipients.value
    .map((recipient: any) => {
      const email = recipient?.email ?? recipient?.recipient_email ?? recipient?.value ?? "";
      const label = recipient?.name ?? recipient?.full_name ?? recipient?.label ?? email;

      if (!email) {
        return null;
      }

      return {
        value: email,
        label,
        description: email === label ? undefined : email,
        avatar: label ? { text: getInitials(label) } : undefined,
      };
    })
    .filter(Boolean),
);

const recipientEmailValues = computed(() =>
  individualRecipientOptions.value.map(option => option?.value),
);

const recipientOptions = computed(() => [
  {
    value: ALL_RECIPIENTS_VALUE,
    label: "Newsletter Subscribers",
  },
  ...individualRecipientOptions.value,
]);

const schema = z.object({
  subject: z.string().min(1, "Mail subject is required"),
  title: z.string().min(1, "Mail title is required"),
  htmlContent: z.string().min(1, "Mail htmlContent is required"),
  recipientEmails: z.array(z.string().email("Invalid email address")).min(1, "At least one recipient is required"),
});

type createRoleSchema = z.output<typeof schema>;

const state = reactive<Partial<createRoleSchema>>({
  subject: "",
  title: "",
  htmlContent: "",
  recipientEmails: [],
});

const recipientSelection = computed({
  get: () => {
    const selectedEmails = state.recipientEmails ?? [];
    const allRecipientsSelected = recipientEmailValues.value.length > 0
      && recipientEmailValues.value.every(email => selectedEmails.includes(email));

    if (!allRecipientsSelected) {
      return selectedEmails;
    }

    return [ALL_RECIPIENTS_VALUE, ...selectedEmails];
  },

  set: (values: string[] = []) => {
    const selectedValues = values.filter((value): value is string => typeof value === "string");
    const selectedEmails = selectedValues.filter(value => value !== ALL_RECIPIENTS_VALUE);
    const allRecipientsSelected = recipientEmailValues.value.length > 0
      && recipientEmailValues.value.every(email => (state.recipientEmails ?? []).includes(email));
    const includesSelectAll = selectedValues.includes(ALL_RECIPIENTS_VALUE);

    if (includesSelectAll && !allRecipientsSelected) {
      state.recipientEmails = [...recipientEmailValues.value];
      return;
    }

    if (!includesSelectAll && allRecipientsSelected && selectedEmails.length === recipientEmailValues.value.length) {
      state.recipientEmails = [];
      return;
    }

    state.recipientEmails = selectedEmails;
  },
});

function setApiError(error: string): void {
  apiError.value = error;
}

function clearApiError(): void {
  apiError.value = null;
}

async function fetchRecipients() {
  try {
    recipients.value = await mailStore.getRecipients();
  }
  catch (error) {
    const message = getApiErrorMessage(error, "Failed to fetch recipients.");
    toast.error({ message });
  }
}

async function handleCreateRole() {
  try {
    await formRef.value?.validate();
  }
  catch {
    return;
  }
  try {
    loading.value = true;
    clearApiError();
    const payload = {
      subject: state.subject?.trim() ?? "",
      title: state.title?.trim() ?? "",
      htmlContent: state.htmlContent ?? "",
      recipientEmails: state.recipientEmails ?? [],
    };
    await mailStore.createMail(payload as { subject: string; title: string; htmlContent: string; recipientEmails: string[] });
    toast.success({ message: "Mail created successfully" });
    router.push({ name: "send-email/email-list" });
  }
  catch (error: unknown) {
    const message = getApiErrorMessage(error, "Something went wrong. Please try again.");
    if (message !== "Something went wrong. Please try again.") {
      setApiError(message);
      formRef.value?.validate();
      return;
    }
    toast.error({ message });
  }
  finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchRecipients();
});
</script>

<template>
  <div class="flex flex-col gap-6">
    <base-page-header>
      <template #title>
        Create Mail
      </template>
      <template #description>
        Create a new mail and send it to members or guests
      </template>

      <template #actions>
        <NuxtLink to="/send-email/email-list">
          <base-button
            variant="outline"
            :leading-icon="ICONS.ARROW_LEFT"
          >
            Back to list
          </base-button>
        </NuxtLink>
      </template>
    </base-page-header>

    <div class="flex flex-col gap-6 p-6 bg-white rounded-lg">
      <form-header-card
        label="Basic Info"
        description="Start by entering the instructor personal details and a short description."
      />

      <UForm
        ref="formRef"
        :schema="schema"
        :state="state"
        :validate-on="['input', 'change', 'blur']"
      >
        <div class="bg-white flex flex-col gap-5 shadow-md rounded-lg p-4">
          <div class="flex flex-col md:flex-row gap-4 w-full">
            <base-input
              v-model="state.subject"
              name="subject"
              label="Mail Subject*"
              placeholder="Enter the subject of the mail"
              class="w-full"
            />
            <base-input
              v-model="state.title"
              name="title"
              label="Mail Title*"
              placeholder="Enter the title of the mail"
              class="w-full"
            />
          </div>

          <div>
            <base-text-editor
              v-model="state.htmlContent"
              name="htmlContent"
              label="Mail Content*"
              placeholder="Enter the content of the mail"
              class="w-full min-h-30 max-h-60 overflow-y-auto"
            />
          </div>

          <USeperator class="border-t border-stone-200 border-0.5" />

          <div class="flex flex-col gap-4">
            <base-select-menu
              v-model="recipientSelection"
              name="recipientEmails"
              label="Select Recipients*"
              placeholder="Select recipients"
              :options="recipientOptions"
              search-placeholder="Search & Recipients"
              :multiple="true"
              :show-checkbox="true"
              :hidden-selected-values="[ALL_RECIPIENTS_VALUE]"
              class="w-full"
            />
          </div>

          <div class="flex justify-end">
            <base-button
              variant="solid"
              @click="handleCreateRole"
            >
              Create Mail
            </base-button>
          </div>
        </div>
      </UForm>
    </div>
  </div>
</template>
