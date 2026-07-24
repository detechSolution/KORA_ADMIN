<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";

import { useMailStore } from "~/stores/mail";
import { useMembershipStore } from "~/stores/membership";

type Item = { value: string; label: string };
type Props = { name: string; label?: string; modelValue: string[] };

const props = withDefaults(defineProps<Props>(), { label: "" });
const emit = defineEmits<{ "update:modelValue": [value: string[]] }>();

const SELECT_ALL = "__select_all__";

const mailStore = useMailStore();
const membershipStore = useMembershipStore();
const activeGroup = ref("all_clients");
const recipients = ref<Item[]>([]);
const loading = ref(false);

const FILTERS = computed(() => {
  const baseFilters = [
    { value: "all_clients", label: "All Clients" },
  ];

  const planFilters = membershipStore.plans.data.map(plan => ({
    value: plan.name.toLowerCase().replace(/\s+/g, "_"),
    label: plan.name,
  }));

  const endFilters = [
    { value: "newsletter_subscribers", label: "Newsletter Subscribers" },
  ];

  return [...baseFilters, ...planFilters, ...endFilters];
});

async function load() {
  loading.value = true;
  try {
    const data = await mailStore.getRecipients({ group: activeGroup.value });
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
  }
}

watch(activeGroup, load, { immediate: true });

onMounted(() => {
  membershipStore.fetchPlans();
});

const allSelected = computed(() =>
  recipients.value.length > 0 && recipients.value.every(r => props.modelValue.includes(r.value)),
);

const items = computed<Item[]>(() => [
  { value: SELECT_ALL, label: "Select All", initials: "" },
  ...recipients.value,
]);

const inputValue = computed({
  get: () => allSelected.value ? [SELECT_ALL, ...props.modelValue] : props.modelValue,
  set: (vals: string[]) => {
    const nowHasAll = vals.includes(SELECT_ALL);
    const hadAll = allSelected.value;

    if (nowHasAll && !hadAll) {
      emit("update:modelValue", recipients.value.map(r => r.value));
    }
    else if (!nowHasAll && hadAll) {
      emit("update:modelValue", []);
    }
    else {
      emit("update:modelValue", vals.filter(v => v !== SELECT_ALL));
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
      value-key="value"
      :items="items"
      :loading="loading"
      multiple
      placeholder="Search and select recipients"
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
            @click.stop="activeGroup = f.value"
          >
            {{ f.label }}
          </button>
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
