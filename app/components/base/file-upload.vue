<script setup lang="ts">
import { computed } from "vue";

type FileType = "image" | "video" | "both";

type Props = {
  label?: string;
  name?: string;
  modelValue?: File | null;
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
  (e: "update:modelValue", file: File | null): void;
}>();

const inputValue = computed({
  get: () => props.modelValue ?? null,
  set: value => emit("update:modelValue", value ?? null),
});

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
      <UFileUpload
        v-model="inputValue"
        :color="color"
        :highlight="highlight"
        :accept="getAcceptTypes(accept)"
        :multiple="multiple"
        :label="label"
        :description="description || getDefaultDescription(accept)"
        :class="classNames"
      />
    </UFormField>
  </div>
</template>
