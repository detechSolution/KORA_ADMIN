<script setup lang="ts">
import { reactive, ref } from "vue";
import z from "zod";

import { ICONS } from "~/config/icons";
import { useMailStore } from "~/stores/mail";
import { getApiErrorMessage } from "~/utils/error";

definePageMeta({
  layout: "dashboard",
  auth: true,
  permission: "mails.create",
});

const mailStore = useMailStore();
const toast = useNotification();
const router = useRouter();

const loading = ref(false);
const apiError = ref<string | null>(null);
const formRef = ref<InstanceType<typeof UForm> | null>(null);

const schema = z.object({
  subject: z.string().min(1, "Mail subject is required"),
  title: z.string().min(1, "Mail title is required"),
  htmlContent: z.string().min(1, "Mail htmlContent is required"),
  recipientEmails: z.array(z.string().email("Invalid email address")).min(1, "At least one recipient is required"),
});

type MailSchema = z.output<typeof schema>;

const recipientEmails = ref<string[]>([]);

const state = reactive<Partial<MailSchema>>({
  subject: "",
  title: "",
  htmlContent: "",
  get recipientEmails() { return recipientEmails.value; },
  set recipientEmails(v) { recipientEmails.value = v; },
});

async function handleCreateMail() {
  try {
    await formRef.value?.validate();
  }
  catch {
    return;
  }
  try {
    loading.value = true;
    apiError.value = null;
    await mailStore.createMail({
      subject: state.subject?.trim() ?? "",
      title: state.title?.trim() ?? "",
      htmlContent: state.htmlContent ?? "",
      recipientEmails: state.recipientEmails ?? [],
    });
    toast.success({ message: "Mail created successfully" });
    router.push({ name: "send-email/email-list" });
  }
  catch (error: unknown) {
    const message = getApiErrorMessage(error, "Something went wrong. Please try again.");
    if (message !== "Something went wrong. Please try again.") {
      apiError.value = message;
      formRef.value?.validate();
      return;
    }
    toast.error({ message });
  }
  finally {
    loading.value = false;
  }
}
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
        label="Create Mail"
        description="Create a new mail and send it to members or guests"
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

          <send-mail-select-menu
            v-model="recipientEmails"
            name="recipientEmails"
            label="Select Recipients*"
          />

          <div class="flex justify-end">
            <base-button
              variant="solid"
              @click="handleCreateMail"
            >
              Create Mail
            </base-button>
          </div>
        </div>
      </UForm>
    </div>
  </div>
</template>
