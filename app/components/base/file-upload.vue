<script setup lang="ts">
import { computed } from "vue";

type FileType = "image" | "video" | "both";

type ModelValue = string | File | (string | File)[] | null;

type Props = {
  label?: string;
  name?: string;
  modelValue?: ModelValue;
  accept?: FileType;
  description?: string;
  color?: "primary" | "secondary" | "success" | "info" | "warning" | "error" | "neutral";
  highlight?: boolean;
  classNames?: string;
  multiple?: boolean;
  required?: boolean;
};

const props = withDefaults(defineProps<Props>(), {
  label: "",
  name: "",
  accept: "both",
  color: "neutral",
  highlight: true,
  multiple: false,
  required: false,
});

const emit = defineEmits<{
  (e: "update:modelValue", file: ModelValue): void;
}>();

const internalValue = computed({
  get: () => null,
  set: (value) => {
    if (props.multiple) {
      const current = Array.isArray(props.modelValue) ? props.modelValue : (props.modelValue ? [props.modelValue] : []);
      const newFiles = Array.isArray(value) ? value : (value ? [value] : []);
      emit("update:modelValue", [...current, ...newFiles]);
    }
    else {
      emit("update:modelValue", value ?? null);
    }
  },
});

const files = computed(() => {
  if (!props.modelValue)
    return [];
  return Array.isArray(props.modelValue) ? props.modelValue : [props.modelValue];
});

function getFileName(file: string | File): string {
  if (typeof file === "string") {
    return file.split("/").pop()?.split("?")[0] || "file";
  }
  return file.name;
}

function getFileSize(file: string | File): string {
  if (file instanceof File) {
    return formatFileSize(file.size);
  }
  return "Existing File";
}

function formatFileSize(bytes: number): string {
  if (bytes === 0)
    return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

function removeFile(index: number) {
  if (props.multiple && Array.isArray(props.modelValue)) {
    const updated = [...props.modelValue];
    updated.splice(index, 1);
    emit("update:modelValue", updated.length > 0 ? updated : null);
  }
  else {
    emit("update:modelValue", null);
  }
}

function getAcceptTypes(fileType: FileType): string {
  switch (fileType) {
    case "image":
      return ".svg,.png,.jpg,.jpeg,.gif,.webp";
    case "video":
      return ".mp4,.webm,.mov,.mkv,.avi";
    case "both":
      return ".svg,.png,.jpg,.jpeg,.gif,.webp,.mp4,.webm,.mov,.mkv,.avi";
    default:
      return "*/*";
  }
}

function getDefaultDescription(fileType: FileType): string {
  switch (fileType) {
    case "image":
      return "SVG, PNG, JPG or GIF (max. 2MB)";
    case "video":
      return "MP4, WebM, MOV or MKV (max. 50MB)";
    case "both":
      return "Image (SVG, PNG, JPG, GIF) or Video (MP4, WebM, MOV, MKV)";
    default:
      return "";
  }
}
</script>

<template>
  <div>
    <UFormField
      :label="label"
      :name="name"
      :required="required"
      :ui="{
        error: 'mt-1 text-red-500 text-xs',
      }"
    >
      <div class="w-full space-y-3">
        <UFileUpload
          v-model="internalValue"
          :color="color"
          :highlight="highlight"
          :accept="getAcceptTypes(accept)"
          :multiple="multiple"
          :label="label || `Drop your ${accept === 'both' ? 'file' : accept} here`"
          :description="description || getDefaultDescription(accept)"
          :class="classNames"
          :ui="{
            base: 'bg-[#F9F6F2] hover:bg-[#F9F6F2] border-stone-300',
          }"
        >
          <template #leading>
            <div class="image-dropzone py-2 px-2.5 rounded-full">
              <UIcon
                name="i-lucide-upload"
                class="text-white w-5 h-5"
              />
            </div>
          </template>
        </UFileUpload>

        <div
          v-for="(file, index) in files"
          :key="index"
          class="flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white p-3 shadow-sm"
        >
          <div class="flex min-w-0 items-center gap-3 overflow-hidden">
            <div class="flex h-10 shrink-0 items-center justify-center rounded-full bg-stone-100">
              <UIcon
                :name="accept === 'video' ? 'i-lucide-video' : 'i-lucide-image'"
                class="h-5 w-5 text-stone-500 p-4"
              />
            </div>
            <div class="flex min-w-0 flex-col overflow-hidden">
              <span class="truncate text-sm font-medium text-stone-900">
                {{ getFileName(file) }}
              </span>
              <span class="text-xs text-stone-500">
                {{ getFileSize(file) }}
              </span>
            </div>
          </div>

          <UButton
            icon="i-lucide-x"
            color="neutral"
            variant="ghost"
            size="sm"
            class="shrink-0"
            @click="removeFile(index)"
          />
        </div>
      </div>
    </UFormField>
  </div>
</template>

<style>
.image-dropzone {
  background: linear-gradient(180.17deg, rgba(26, 26, 27, 0.8) 0.15%, #1a1a1b 99.85%);
}
</style>
