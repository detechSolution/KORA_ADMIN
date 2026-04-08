<script setup lang="ts">
import { computed, h, ref, resolveComponent, watch } from "vue";

import { useNotification } from "~/composables/use-notification";
import { usePagination } from "~/composables/use-pagination";
import { ICONS } from "~/config/icons";
import { useCommunitiesStore } from "~/stores/communities";

type Props = {
  community: any;
};

const props = defineProps<Props>();

const communitiesStore = useCommunitiesStore();
const { success, error: showError } = useNotification();
const { pagination } = usePagination();

const loading = ref(false);
const adminsList = ref<any[]>([]);
const totalCount = ref(0);

const activateModalOpen = ref(false);
const adminToActivate = ref<any>(null);
const sendEmailWithCredentials = ref(false);
const activating = ref(false);

const community = computed(() => props.community ?? null);

function openActivateModal(admin: any): void {
  adminToActivate.value = admin;
  sendEmailWithCredentials.value = false;
  activateModalOpen.value = true;
}

function closeActivateModal(): void {
  activateModalOpen.value = false;
  adminToActivate.value = null;
  sendEmailWithCredentials.value = false;
}

async function confirmActivateAccount(): Promise<void> {
  const admin = adminToActivate.value;
  const communityId = community.value?.id;
  if (!admin || !communityId)
    return;

  const payload = {
    user_id: Number(admin.id),
    community_id: Number(communityId),
    send_email: sendEmailWithCredentials.value,
  };

  try {
    activating.value = true;
    await communitiesStore.activateCommunityAdmin(payload);
    success({
      message: sendEmailWithCredentials.value
        ? "Account activated. Credentials will be sent by email."
        : "Account activated.",
    });
    closeActivateModal();
    await fetchAdmins();
  }
  catch {
    showError({ message: "Failed to activate account" });
  }
  finally {
    activating.value = false;
  }
}

const columns = computed(() => [
  {
    header: "Name",
    cell: ({ row }: { row: any }) => row.original.name ?? "—",
  },
  {
    header: "Email",
    cell: ({ row }: { row: any }) => row.original.email ?? "—",
  },
  {
    header: "Status",
    cell: ({ row }: { row: any }) => {
      const isActive = row.original.is_active === true;
      const color = isActive ? "emerald" : "red";
      const label = isActive ? "Active" : "Inactive";
      return h(
        resolveComponent("base-badge"),
        { color },
        () => label,
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }: { row: any }) => {
      const isInactive = row.original.is_active !== true;
      const showActions = totalCount.value === 1 && isInactive;
      if (!showActions)
        return null;
      return h("div", { class: "text-right" }, h(
        resolveComponent("UDropdownMenu"),
        {
          content: {
            align: "end",
          },
          ui: { content: "min-w-[150px]", itemLeadingIcon: "hidden" },
          items: [
            {
              label: "Activate account",
              onSelect: () => openActivateModal(row.original),
            },
          ],
        },
        () =>
          h(resolveComponent("UButton"), {
            icon: ICONS.ELLIPSIS_VERTICAL,
            color: "neutral",
            variant: "ghost",
            class: "ml-auto",
          }),
      ));
    },
  },
]);

async function fetchAdmins(): Promise<void> {
  const id = community.value?.id;
  if (!id)
    return;
  try {
    loading.value = true;
    const result = await communitiesStore.getCommunityAdmins({
      community_id: id,
      pagination: {
        page: pagination.value.page,
        limit: pagination.value.pageSize,
      },
    });
    adminsList.value = result?.data ?? [];
    totalCount.value = result?.total_count ?? 0;
  }
  catch {
    showError({ message: "Failed to load community admins" });
    adminsList.value = [];
    totalCount.value = 0;
  }
  finally {
    loading.value = false;
  }
}

watch(
  () => community.value?.id,
  (id) => {
    if (id) {
      pagination.value.page = 1;
      fetchAdmins();
    }
    else {
      adminsList.value = [];
      totalCount.value = 0;
    }
  },
  { immediate: true },
);
</script>

<template>
  <div v-if="!community" class="bg-card border border-border rounded-xl p-6 shadow-sm h-full">
    <div class="flex flex-col items-center justify-center py-12 gap-2">
      <div class="p-4 rounded-full bg-muted/50">
        <UIcon :name="ICONS.USERS" class="w-6 h-6 text-muted-foreground" />
      </div>
      <div class="text-sm font-medium text-muted-foreground">
        No community selected
      </div>
    </div>
  </div>
  <div v-else class="bg-card border border-border rounded-xl p-6 shadow-sm h-full overflow-y-auto">
    <div class="flex items-center gap-3 mb-4 pb-4 border-b border-border">
      <div class="p-2 rounded-lg bg-primary/10">
        <UIcon :name="ICONS.USERS" class="w-5 h-5 text-primary" />
      </div>
      <div>
        <h3 class="text-lg font-semibold text-foreground">
          Community Admins
        </h3>
        <p class="text-xs text-muted-foreground mt-0.5">
          Users with admin access for this community
        </p>
      </div>
    </div>

    <div class="space-y-3">
      <div class="rounded-lg border border-border bg-card overflow-hidden shadow-sm">
        <base-table
          :data="adminsList"
          :columns="columns"
          :loading="loading"
          :skeleton-rows="5"
          empty-title="No admins found"
          empty-description="No community admins have been assigned yet."
        />
      </div>
      <base-pagination
        :page="pagination.page"
        :total="Number(totalCount)"
        :items-per-page="pagination.pageSize"
        :disabled="loading"
        @update:page="(v) => { pagination.page = v; fetchAdmins(); }"
      />
    </div>

    <!-- Activate account confirmation modal -->
    <base-modal
      :open="activateModalOpen"
      title="Activate account"
      description="Confirm activation for this community admin."
      :modal-width="500"
      dismissible
      @close="closeActivateModal"
    >
      <div class="flex flex-col gap-4">
        <p class="text-sm text-muted-foreground">
          You are about to activate the account for
          <span class="font-medium text-foreground">{{ adminToActivate?.name ?? adminToActivate?.email ?? "—" }}</span>.
          They will be able to sign in and access this community.
        </p>

        <label class="flex items-center gap-3 cursor-pointer group">
          <input
            v-model="sendEmailWithCredentials"
            type="checkbox"
            class="h-4 w-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-0"
          >
          <span class="text-sm text-foreground group-hover:text-foreground/90">
            Send email with credentials
          </span>
        </label>
        <p v-if="sendEmailWithCredentials" class="text-xs text-muted-foreground">
          An email containing login credentials will be sent to {{ adminToActivate?.email ?? "the admin" }}.
        </p>

        <div class="flex justify-end gap-2">
          <base-button
            variant="outline"
            @click="closeActivateModal"
          >
            Cancel
          </base-button>
          <base-button
            :loading="activating"
            :disabled="activating"
            :leading-icon="ICONS.CHECK_CIRCLE"
            @click="confirmActivateAccount"
          >
            Activate account
          </base-button>
        </div>
      </div>
    </base-modal>
  </div>
</template>
