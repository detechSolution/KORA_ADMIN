<script setup lang="ts">
import { ICONS } from "~/config/icons";
import { PERMISSIONS_KORA_PASSES } from "~/config/permissions";

defineProps<{
  id: number;
  name: string;
  description: string | null;

  price: number;
  isActive: boolean;
  isInvitation: boolean;
}>();

const emit = defineEmits<{
  edit: [id: number];
  invite: [id: number];
  invitees: [id: number];
}>();
const { can } = usePermission();
</script>

<template>
  <div
    class="bg-card rounded-xl shadow-sm border border-stone-100 overflow-hidden flex flex-col transition-all hover:shadow-md"
  >
    <!-- Header -->
    <div class="p-5 flex items-start justify-between border-b border-stone-50">
      <h3 class="text-lg font-bold text-secondary-900">
        {{ name }}
      </h3>
      <base-badge :color="isActive ? 'success' : 'red'">
        {{ isActive ? "Active" : "Expired" }}
      </base-badge>
    </div>
    <!-- Content -->
    <div class="p-5 flex-1 space-y-3">
      <p class="text-sm text-secondary-500 leading-relaxed">
        {{ (description ?? "").replace(/<[^>]*>/g, "") }}
      </p>
    </div>

    <!-- Footer -->
    <div
      class="px-5 py-4 bg-stone-50/30 border-t border-stone-100 flex items-center justify-between mt-auto"
    >
      <div v-if="!isInvitation" class="text-base font-bold text-secondary-900">
        Rs. {{ price.toLocaleString() }}
      </div>
      <div class="flex flex-wrap items-center gap-1">
        <button
          v-if="isInvitation && isActive && can(PERMISSIONS_KORA_PASSES.CREATE)"
          type="button"
          class="p-2 rounded-lg text-secondary-400 hover:text-primary hover:bg-primary/5 transition-all"
          title="Add user"
          aria-label="Add user"
          @click="emit('invite', id)"
        >
          <UIcon :name="ICONS.USER_PLUS" class="w-4 h-4" />
        </button>
        <button
          v-if="isInvitation"
          type="button"
          class="p-2 rounded-lg text-secondary-400 hover:text-primary hover:bg-primary/5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          title="View invitees"
          aria-label="View invitees"
          @click="emit('invitees', id)"
        >
          <UIcon :name="ICONS.USERS" class="w-4 h-4" />
        </button>
        <button
          v-if="can(PERMISSIONS_KORA_PASSES.UPDATE)"
          aria-label="Edit pass"
          type="button"
          class="p-2 rounded-lg text-secondary-400 hover:text-primary hover:bg-primary/5 transition-all"
          @click="emit('edit', id)"
        >
          <UIcon :name="ICONS.EDIT" class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>
