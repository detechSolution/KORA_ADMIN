<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";

import { useMailStore } from "~/stores/mail";

type Item = { value: string; label: string };
type Props = { name: string; label?: string; modelValue: string[] };

const props = withDefaults(defineProps<Props>(), { label: "" });
const emit = defineEmits<{ "update:modelValue": [value: string[]] }>();

const SELECT_ALL = "__select_all__";

const mailStore = useMailStore();
const activeGroup = ref("all_clients");
const recipients = ref<Item[]>([]);
const loading = ref(false);
const changingGroup = ref(false);
const searchTerm = ref("");
let searchDebounce: ReturnType<typeof setTimeout> | undefined;
let requestId = 0;

const FILTERS = computed(() => {
  const baseFilters = [
    { value: "all_clients", label: "All Clients" },
  ];

  const planFilters = (mailStore.mailOptions || []).map((plan: string) => ({
    value: plan,
    label: plan,
  }));

  const endFilters = [
    { value: "newsletter_subscribers", label: "Newsletter Subscribers" },
  ];

  return [...baseFilters, ...planFilters, ...endFilters];
});

async function load() {
  const currentRequestId = ++requestId;
  loading.value = true;
  try {
    const data = await mailStore.getRecipients({ group: activeGroup.value, q: searchTerm.value });
    if (currentRequestId !== requestId)
      return;

    recipients.value = data
      .map((r: any) => {
        const email = r.email ?? r.recipient_email ?? "";
        const name = r.name ?? r.full_name ?? email;
        return { value: email, label: name };
      })
      .filter((r: Item) => r.value);
  }
  finally {
    loading.value = false;
    changingGroup.value = false;
  }
}

function selectGroup(group: string) {
  if (group === activeGroup.value)
    return;

  // USelectMenu can emit a normalized value when its items are replaced.
  // Keep the current selection while the new recipient group is loading.
  changingGroup.value = true;
  activeGroup.value = group;
}

watch(activeGroup, load, { immediate: true });

watch(searchTerm, () => {
  if (searchDebounce)
    clearTimeout(searchDebounce);

  searchDebounce = setTimeout(load, 300);
});

onMounted(() => {
  mailStore.getMembershipOptions();
});

const allSelected = computed(() =>
  recipients.value.length > 0 && recipients.value.every(r => props.modelValue.includes(r.value)),
);

const items = computed<Item[]>(() => recipients.value.length > 0
  ? [
      { value: SELECT_ALL, label: "Select All", initials: "" },
      ...recipients.value,
    ]
  : []);

const inputValue = computed({
  get: () => allSelected.value ? [SELECT_ALL, ...props.modelValue] : props.modelValue,
  set: (vals: string[]) => {
    if (changingGroup.value)
      return;

    const nowHasAll = vals.includes(SELECT_ALL);
    const groupEmails = new Set(recipients.value.map(r => r.value));
    const selectedInGroup = vals.filter(value => value !== SELECT_ALL);
    const selectedOutsideGroup = props.modelValue.filter(email => !groupEmails.has(email));

    if (nowHasAll) {
      // Selecting all adds this membership group to existing recipients.
      emit("update:modelValue", [...new Set([...props.modelValue, ...groupEmails])]);
    }
    else {
      // Removing selections only affects the active group, preserving other groups.
      emit("update:modelValue", [...new Set([...selectedOutsideGroup, ...selectedInGroup])]);
    }
  },
});

function isSelected(value: string) {
  return value === SELECT_ALL ? allSelected.value : props.modelValue.includes(value);
}
</script>

<template>
  <UFormField
    :label="props.label"
    :name="props.name"
    :ui="{ error: 'mt-1 text-red-500 text-xs' }"
  >
    <USelectMenu
      v-model="inputValue"
      v-model:search-term="searchTerm"
      value-key="value"
      :items="items"
      :loading="loading"
      multiple
      placeholder="Search and select recipients"
      :ignore-filter="true"
      :reset-search-term-on-select="false"
      :search-input="{ placeholder: 'Search & Select Recipients' }"
      size="xl"
      class="w-full"
    >
      <template #default>
        <span v-if="props.modelValue.length > 0" class="text-sm text-stone-700">
          {{ props.modelValue.length }} recipient{{ props.modelValue.length === 1 ? "" : "s" }} selected
        </span>
        <span v-else class="text-sm text-stone-400">Search and select recipients</span>
      </template>

      <template #content-top>
        <div class="flex flex-wrap items-center gap-2 px-3 py-2 border-b border-stone-200">
          <span class="text-sm text-stone-700 font-medium">Users:</span>
          <button
            v-for="f in FILTERS"
            :key="f.value"
            type="button"
            class="px-2.5 py-2 cursor-pointer rounded-md text-xs font-medium border transition-colors"
            :class="activeGroup === f.value
              ? 'bg-primary text-white border-primary'
              : 'bg-white text-secondary border-secondary-100 hover:border-primary hover:text-primary'"
            @click.stop="selectGroup(f.value)"
          >
            {{ f.label }}
          </button>
        </div>
      </template>

      <template #empty>
        <div class="px-3 py-6 text-center text-sm text-stone-400">
          No recipients found
        </div>
      </template>

      <template #item="{ item }">
        <div
          class="flex items-center gap-2 w-full "
          :class="item.value === SELECT_ALL ? 'border-b border-stone-100 h-6' : ''"
        >
          <UCheckbox
            :model-value="isSelected(item.value)"
            class="pointer-events-none"
          />
          <template v-if="item.value !== SELECT_ALL">
            <base-avatar
              :src="item.label"
              :alt="item.label"
            />
          </template>
          <span
            class="text-sm text-stone-700 truncate"
            :class="item.value === SELECT_ALL ? 'font-medium' : ''"
          >
            {{ item.label }}
          </span>
        </div>
      </template>
    </USelectMenu>
  </UFormField>
</template>
