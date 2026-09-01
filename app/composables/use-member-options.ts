import type { Ref } from "vue";

import { useDebounceFn } from "@vueuse/core";
import { computed, ref, watch } from "vue";

import { useMembershipStore } from "~/stores/membership";

export type MemberOption = {
  label: string;
  value: number;
  description?: string;
  fullName?: string;
  phoneNumber?: string;
  membershipPlanId?: number | null;
  passId?: number | null;
  startDate?: string | null;
  endDate?: string | null;
};

export function useMemberOptions(selectedId: Ref<string | number | null>) {
  const membershipStore = useMembershipStore();
  const searchTerm = ref("");
  const selectedOption = ref<MemberOption | null>(null);

  const options = computed<MemberOption[]>(() => {
    const memberOptions = membershipStore.membershipOptions.map((member: any) => ({
      label: member.label || member.fullName || String(member.userId),
      value: member.userId,
      description: member.email,
      fullName: member.fullName,
      phoneNumber: member.phoneNumber,
      membershipPlanId: member.membershipPlanId,
      passId: member.passId,
      startDate: member.startDate,
      endDate: member.endDate,
    }));

    if (
      selectedOption.value
      && !memberOptions.some(option => option.value === selectedOption.value?.value)
    ) {
      memberOptions.unshift(selectedOption.value);
    }

    return memberOptions;
  });

  const search = useDebounceFn(
    (value: string) => membershipStore.getMembersOptions({ q: value.trim() }),
    300,
  );

  watch(searchTerm, search);
  watch([selectedId, options], ([id, memberOptions]) => {
    if (!id) {
      selectedOption.value = null;
      return;
    }

    const option = memberOptions.find(item => item.value === id);
    if (option && selectedOption.value?.value !== option.value) {
      selectedOption.value = option;
    }
  }, { immediate: true });

  function setSelectedOption(option: MemberOption): void {
    selectedOption.value = option;
  }

  return {
    options,
    searchTerm,
    selectedOption: computed(() => selectedOption.value),
    loading: computed(() => membershipStore.loading),
    load: () => membershipStore.getMembersOptions(),
    setSelectedOption,
  };
}
