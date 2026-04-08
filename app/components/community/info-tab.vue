<script setup lang="ts">
import { computed } from "vue";

import { ICONS } from "~/config/icons";
import { formatDateTime } from "~/utils/common";

type Props = {
  community: any;
};

const props = defineProps<Props>();

const community = computed(() => props.community || null);
</script>

<template>
  <div v-if="!community" class="bg-card border border-border rounded-xl p-6 shadow-sm">
    <div class="flex flex-col items-center justify-center py-12 gap-2">
      <div class="p-4 rounded-full bg-muted/50">
        <UIcon :name="ICONS.EYE" class="w-6 h-6 text-muted-foreground" />
      </div>
      <div class="text-sm font-medium text-muted-foreground">
        No community selected
      </div>
    </div>
  </div>
  <div v-else class="bg-card border border-border rounded-xl p-6 shadow-sm">
    <div class="flex items-center gap-3 mb-6 pb-4 border-b border-border">
      <div class="p-2 rounded-lg bg-primary/10">
        <UIcon :name="ICONS.BUILDING" class="w-5 h-5 text-primary" />
      </div>
      <div>
        <h3 class="text-lg font-semibold text-foreground">
          Community Information
        </h3>
        <p class="text-xs text-muted-foreground mt-0.5">
          View detailed information about this community
        </p>
      </div>
    </div>

    <div class="space-y-6">
      <!-- Community Details Section -->
      <div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-1.5">
            <label class="block text-xs font-medium text-muted-foreground">
              Community Name
            </label>
            <div class="min-h-[38px] flex items-center">
              <div class="w-full">
                <div class="text-sm text-foreground bg-muted/30 rounded-lg px-3 py-2.5 border border-border/50 min-h-[44px] flex items-center">
                  {{ community.community_name || "N/A" }}
                </div>
              </div>
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="block text-xs font-medium text-muted-foreground">
              Community Code
            </label>
            <div class="min-h-[38px] flex items-center">
              <div class="w-full">
                <div class="text-sm text-foreground bg-muted/30 rounded-lg px-3 py-2.5 border border-border/50 min-h-[44px] flex items-center">
                  {{ community.community_code || "N/A" }}
                </div>
              </div>
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="block text-xs font-medium text-muted-foreground">
              Community Email
            </label>
            <div class="min-h-[38px] flex items-center">
              <div class="w-full">
                <div class="text-sm text-foreground bg-muted/30 rounded-lg px-3 py-2.5 border border-border/50 min-h-[44px] flex items-center">
                  {{ community.community_email || "N/A" }}
                </div>
              </div>
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="block text-xs font-medium text-muted-foreground">
              Community Type
            </label>
            <div class="min-h-[38px] flex items-center">
              <div class="w-full">
                <div class="text-sm text-foreground bg-muted/30 rounded-lg px-3 py-2.5 border border-border/50 min-h-[44px] flex items-center">
                  {{ community.community_type || "N/A" }}
                </div>
              </div>
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="block text-xs font-medium text-muted-foreground">
              PAN Number
            </label>
            <div class="min-h-[38px] flex items-center">
              <div class="w-full">
                <div class="text-sm text-foreground bg-muted/30 rounded-lg px-3 py-2.5 border border-border/50 min-h-[44px] flex items-center">
                  {{ community.community_pan_number || "N/A" }}
                </div>
              </div>
            </div>
          </div>

          <div class="space-y-1.5 md:col-span-2">
            <label class="block text-xs font-medium text-muted-foreground">
              Address
            </label>
            <div class="min-h-[38px] flex items-center">
              <div class="w-full">
                <div class="text-sm text-foreground bg-muted/30 rounded-lg px-3 py-2.5 border border-border/50 min-h-[44px] flex items-center">
                  {{ community.community_address || "N/A" }}
                </div>
              </div>
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="block text-xs font-medium text-muted-foreground">
              City
            </label>
            <div class="min-h-[38px] flex items-center">
              <div class="w-full">
                <div class="text-sm text-foreground bg-muted/30 rounded-lg px-3 py-2.5 border border-border/50 min-h-[44px] flex items-center">
                  {{ community.community_city || "N/A" }}
                </div>
              </div>
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="block text-xs font-medium text-muted-foreground">
              State
            </label>
            <div class="min-h-[38px] flex items-center">
              <div class="w-full">
                <div class="text-sm text-foreground bg-muted/30 rounded-lg px-3 py-2.5 border border-border/50 min-h-[44px] flex items-center">
                  {{ community.community_state || "N/A" }}
                </div>
              </div>
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="block text-xs font-medium text-muted-foreground">
              Contact Person
            </label>
            <div class="min-h-[38px] flex items-center">
              <div class="w-full">
                <div class="text-sm text-foreground bg-muted/30 rounded-lg px-3 py-2.5 border border-border/50 min-h-[44px] flex items-center">
                  {{ community.contact_person || "N/A" }}
                </div>
              </div>
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="block text-xs font-medium text-muted-foreground">
              Emergency Contact
            </label>
            <div class="min-h-[38px] flex items-center">
              <div class="w-full">
                <div class="text-sm text-foreground bg-muted/30 rounded-lg px-3 py-2.5 border border-border/50 min-h-[44px] flex items-center">
                  {{ community.community_emergency_contact || "N/A" }}
                </div>
              </div>
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="block text-xs font-medium text-muted-foreground">
              Created At
            </label>
            <div class="min-h-[38px] flex items-center">
              <div class="w-full">
                <div class="text-sm text-foreground bg-muted/30 rounded-lg px-3 py-2.5 border border-border/50 min-h-[44px] flex items-center">
                  {{ community.created_at ? formatDateTime(community.created_at) : "N/A" }}
                </div>
              </div>
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="block text-xs font-medium text-muted-foreground">
              Updated At
            </label>
            <div class="min-h-[38px] flex items-center">
              <div class="w-full">
                <div class="text-sm text-foreground bg-muted/30 rounded-lg px-3 py-2.5 border border-border/50 min-h-[44px] flex items-center">
                  {{ community.updated_at ? formatDateTime(community.updated_at) : "N/A" }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
