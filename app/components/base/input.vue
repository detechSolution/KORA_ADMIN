<script setup lang="ts">
import { computed, ref } from "vue";

import { ICONS } from "~/config/icons";

type Props = {
  name: string; // Required for UFormField
  type?: "number" | "reset" | "submit" | "color" | "button" | "checkbox" | "date" | "datetime-local" | "email" | "file" | "hidden" | "image" | "month" | "password" | "radio" | "range" | "search" | "tel" | "text" | "time" | "url" | "week" | "textarea" | string & {};
  label?: string;
  placeholder?: string;
  required?: boolean;
  modelValue?: null | string | number;
  loading?: boolean;
  disabled?: boolean;
  leadingIcon?: string;
  trailingIcon?: string;
  readonly?: boolean;
};

const props = withDefaults(defineProps<Props>(), {
  label: "",
  required: false,
  type: "text",
  placeholder: "",
  loading: false,
  disabled: false,
  readonly: false,
});

const emit = defineEmits(["update:modelValue"]);

const inputValue = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value),
});

const showPassword = ref(false);

const computedType = computed(() =>
  props.type === "password" && showPassword.value ? "text" : props.type,
);

function togglePasswordVisibility() {
  showPassword.value = !showPassword.value;
}
</script>

<template>
  <UFormField
    :label="props.label"
    :name="props.name"
    :required="props.required"
    :ui="{
      error: 'mt-1 text-red-500 text-xs',
    }"
  >
    <UTextarea
      v-if="props.type === 'textarea'"
      v-model="inputValue"
      :placeholder="props.placeholder"
      :loading="props.loading"
      :disabled="props.disabled"
      variant="outline"
      class="w-full"
      size="lg"
      :ui="{
        base: 'bg-transparent',
      }"
    />
    <UInput
      v-else
      v-model="inputValue"
      :type="computedType"
      :placeholder="props.placeholder"
      :loading="props.loading"
      :disabled="props.disabled"
      :readonly="props.readonly"
      variant="outline"
      class="w-full"
      size="lg"
      :ui="{
        base: `bg-transparent`,
      }"
    >
      <template v-if="props.leadingIcon" #leading>
        <UIcon :name="props.leadingIcon" class="h-5 w-5" />
      </template>
      <template v-if="props.type === 'password' || props.trailingIcon" #trailing>
        <UIcon
          v-if="props.trailingIcon"
          :name="props.trailingIcon"
          class="h-5 w-5"
        />
        <UIcon
          v-else
          :name="showPassword ? ICONS.EYE : ICONS.EYE_OFF"
          class="cursor-pointer w-5 h-5"
          @click="togglePasswordVisibility"
        />
      </template>
    </UInput>
  </UFormField>
</template>
