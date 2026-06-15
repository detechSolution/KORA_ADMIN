<script setup lang="ts">
import { ref } from "vue";

import { ICONS } from "~/config/icons";

defineProps<{
  open: boolean;
  session: any;
}>();

const emit = defineEmits(["close", "edit"]);

const isPreviewOpen = ref(false);
const previewType = ref<"image" | "video">("image");
const previewUrl = ref("");

function openPreview(type: "image" | "video", url: string) {
  if (!url)
    return;
  previewType.value = type;
  previewUrl.value = url;
  isPreviewOpen.value = true;
}
</script>

<template>
  <base-modal
    :open="open"
    title="Session Overview"
    :modal-width="800"
    dismissible
    @close="emit('close')"
  >
    <div v-if="session" class="flex flex-col gap-6 p-6">
      <!-- Header Info -->
      <div class="flex items-start justify-between">
        <div class="flex flex-col gap-1">
          <h2 class="text-xl font-semibold text-secondary-900">
            {{ session.name }}
          </h2>
          <div class="flex items-center gap-1.5 text-sm text-secondary-500">
            <UIcon :name="ICONS.USER" class="w-4 h-4" />
            <span>{{ session.instructor }}</span>
          </div>
        </div>
        <base-badge
          :status="session.type"
          variant="subtle"
          size="md"
        >
          {{ session.type }}
        </base-badge>
      </div>

      <!-- Banner & Video -->
      <div class="flex flex-col gap-3">
        <h3 class="text-sm font-semibold text-secondary-900">
          Session Banner & Video
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Banner Image -->
          <div
            class="aspect-4/3 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 cursor-zoom-in"
            @click="openPreview('image', session.bannerUrl)"
          >
            <img
              v-if="session.bannerUrl"
              :src="session.bannerUrl"
              alt="Session Banner"
              class="w-full h-full object-cover transition-transform hover:scale-105"
            >
            <div v-else class="w-full h-full flex items-center justify-center text-secondary-300">
              <UIcon :name="ICONS.IMAGE" class="w-12 h-12" />
            </div>
          </div>

          <!-- Video Thumbnail -->
          <div
            class="relative aspect-4/3 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 group cursor-pointer"
            @click="openPreview('video', session.videoUrl)"
          >
            <img
              v-if="session.videoUrl || session.bannerUrl"
              :src="session.bannerUrl"
              alt="Session Video"
              class="w-full h-full object-cover brightness-90 group-hover:brightness-75 transition-all"
            >
            <div v-else class="w-full h-full flex items-center justify-center text-secondary-300">
              <UIcon :name="ICONS.PLAY" class="w-12 h-12" />
            </div>
            <!-- Play Button Overlay -->
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="w-12 h-12 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                <UIcon :name="ICONS.PLAY" class="w-6 h-6 ml-1" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Details -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="flex flex-col gap-2 text-sm text-secondary-600">
          <div class="flex items-center gap-2">
            <UIcon :name="ICONS.CALENDAR" class="w-4 h-4 text-primary" />
            <span>{{ session.sessionDate }}</span>
          </div>
          <div class="flex items-center gap-2">
            <UIcon :name="ICONS.LOCATION" class="w-4 h-4 text-primary" />
            <span>{{ session.venue }}</span>
          </div>
          <div class="flex items-center gap-2">
            <UIcon :name="ICONS.CLOCK" class="w-4 h-4 text-primary" />
            <span>{{ session.startTime }} - {{ session.endTime }}</span>
          </div>
        </div>
        <base-badge
          status="Paid"
          variant="subtle"
        >
          Rs. {{ session.price }}
        </base-badge>
      </div>

      <!-- Capacity -->
      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between text-xs text-secondary-500">
          <span>Capacity</span>
          <span class="font-medium text-secondary-900">{{ session.registered ?? 0 }}/{{ session.capacity }}</span>
        </div>
        <base-progress
          :value="session.registered"
          :max="session.capacity"
          size="md"
          color="success"
        />
      </div>

      <!-- About -->
      <div class="flex flex-col gap-2">
        <h3 class="text-sm font-semibold text-secondary-900">
          About This Session
        </h3>
        <p
          class="text-sm text-secondary-600 leading-relaxed"
          v-html="session.description"
        />
      </div>

      <!-- Metadata -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="p-3 rounded-xl border border-stone-100 bg-stone-50/50 flex flex-col gap-1">
          <div class="flex items-center gap-1.5 text-[10px] text-secondary-400 font-medium">
            <UIcon :name="ICONS.USER" class="w-3 h-3" />
            <span>Created By</span>
          </div>
          <div class="flex items-center gap-2">
            <base-avatar
              :name="session.createdBy.fullName"
              :src="session.createdBy.fullName"
            />
            <span class="text-xs font-semibold text-secondary-700">{{ session.createdBy.fullName }}</span>
          </div>
        </div>
        <div class="p-3 rounded-xl border border-stone-100 bg-stone-50/50 flex flex-col gap-1">
          <div class="flex items-center gap-1.5 text-[10px] text-secondary-400 font-medium">
            <UIcon :name="ICONS.USER" class="w-3 h-3" />
            <span>Last Edited By</span>
          </div>
          <div class="flex items-center gap-2">
            <base-avatar
              :name="session.updatedBy.fullName"
              :src="session.updatedBy.fullName"
            />
            <span class="text-xs font-semibold text-secondary-700">{{ session.updatedBy.fullName }}</span>
          </div>
        </div>
        <div class="p-3 rounded-xl border border-stone-100 bg-stone-50/50 flex flex-col gap-1">
          <div class="flex items-center gap-1.5 text-[10px] text-secondary-400 font-medium">
            <UIcon :name="ICONS.CALENDAR" class="w-3 h-3" />
            <span>Last Edited Date</span>
          </div>
          <div class="flex items-center gap-2 h-5">
            <span class="text-xs font-semibold text-secondary-700">Mar 10, 2026</span>
          </div>
        </div>
      </div>

      <!-- Footer Action -->
      <div class="flex justify-end pt-2">
        <base-button
          variant="solid"
          size="md"
          class="bg-stone-900 hover:bg-stone-800"
          @click="emit('edit', session.id)"
        >
          Edit Session
        </base-button>
      </div>
    </div>
  </base-modal>

  <!-- Preview Modal -->
  <base-modal
    :open="isPreviewOpen"
    :title="previewType === 'image' ? 'Image Preview' : 'Video Preview'"
    :modal-width="previewType === 'image' ? 900 : 1000"
    dismissible
    @close="isPreviewOpen = false"
  >
    <div class="flex items-center justify-center bg-black/95 min-h-100 rounded-lg overflow-hidden">
      <img
        v-if="previewType === 'image'"
        :src="previewUrl"
        class="max-w-full max-h-[80vh] object-contain"
        alt="Fullscreen Preview"
      >
      <video
        v-else-if="previewType === 'video'"
        :src="previewUrl"
        controls
        autoplay
        class="max-w-full max-h-[80vh]"
      />
    </div>
  </base-modal>
</template>
