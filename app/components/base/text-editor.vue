<script setup lang="ts">
import { computed } from "vue";

type EditorContent = Record<string, unknown> | string | null;
type EditorContentType = "html" | "json" | "markdown";

type ToolbarItem = { kind: "mark"; mark: "bold" | "italic" | "strike" | "code" | "underline"; icon?: string; tooltip?: string } | { kind: "heading"; level: 1 | 2 | 3; icon?: string; tooltip?: string } | { kind: "link"; icon?: string; tooltip?: string; href?: string } | { kind: "image"; icon?: string; tooltip?: string; src?: string } | { kind: "bulletList" | "orderedList" | "taskList" | "blockquote" | "codeBlock" | "horizontalRule" | "paragraph" | "clearFormatting" | "undo" | "redo"; icon?: string; tooltip?: string };

type Props = {
  name: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  modelValue?: EditorContent;
  contentType?: EditorContentType;
  disabled?: boolean;
  readonly?: boolean;
  toolbar?: boolean;
  toolbarItems?: ToolbarItem[][];
  height?: string | number;
  showToolbarHint?: boolean;
};

const props = withDefaults(defineProps<Props>(), {
  label: "",
  placeholder: "",
  required: false,
  modelValue: "",
  contentType: "html",
  disabled: false,
  readonly: false,
  toolbar: true,
  height: "320px",
  showToolbarHint: true,
  toolbarItems: () => [
    [
      { kind: "mark", mark: "bold", icon: "i-lucide-bold", tooltip: "Bold" },
      { kind: "mark", mark: "italic", icon: "i-lucide-italic", tooltip: "Italic" },
      { kind: "mark", mark: "underline", icon: "i-lucide-underline", tooltip: "Underline" },
      { kind: "mark", mark: "strike", icon: "i-lucide-strikethrough", tooltip: "Strike" },
    ],
    [
      { kind: "heading", level: 1, icon: "i-lucide-heading-1", tooltip: "Heading 1" },
      { kind: "heading", level: 2, icon: "i-lucide-heading-2", tooltip: "Heading 2" },
      { kind: "heading", level: 3, icon: "i-lucide-heading-3", tooltip: "Heading 3" },
    ],
    [
      { kind: "link", icon: "i-lucide-link", tooltip: "Add or remove link" },
      { kind: "image", icon: "i-lucide-image", tooltip: "Insert image" },
      { kind: "horizontalRule", icon: "i-lucide-minus", tooltip: "Divider" },
    ],
    [
      { kind: "bulletList", icon: "i-lucide-list", tooltip: "Bullet list" },
      { kind: "orderedList", icon: "i-lucide-list-ordered", tooltip: "Numbered list" },
      { kind: "blockquote", icon: "i-lucide-quote", tooltip: "Quote" },
      { kind: "codeBlock", icon: "i-lucide-code-xml", tooltip: "Code block" },
    ],
    [
      { kind: "undo", icon: "i-lucide-undo-2", tooltip: "Undo" },
      { kind: "redo", icon: "i-lucide-redo-2", tooltip: "Redo" },
    ],
  ],
});

const emit = defineEmits<{
  "update:modelValue": [value: EditorContent];
}>();

const inputValue = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value),
});

const isEditable = computed(() => !(props.disabled || props.readonly));
const normalizedHeight = computed(() => {
  if (typeof props.height === "number") {
    return `${props.height}px`;
  }

  return /^\d+$/.test(props.height) ? `${props.height}px` : props.height;
});

const editorHandlers = computed(() => ({
  link: {
    canExecute: () => true,
    execute: (editor: any, cmd: { href?: string }) => {
      const previousUrl = editor.getAttributes("link").href;

      if (previousUrl) {
        return editor.chain().focus().unsetLink();
      }

      const href = cmd?.href || (window as any).prompt("Enter the URL:");
      if (!href) {
        return editor.chain();
      }

      if (editor.state.selection.empty) {
        return editor.chain().focus().insertContent({
          type: "text",
          text: href,
          marks: [{ type: "link", attrs: { href } }],
        });
      }

      return editor.chain().focus().extendMarkRange("link").setLink({ href });
    },
    isActive: (editor: any) => editor.isActive("link"),
    isDisabled: (editor: any) => editor.isActive("image"),
  },
}));
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
    <div
      class="overflow-hidden rounded-xl border border-stone-300 bg-white"
      :class="{ 'opacity-70': props.disabled }"
    >
      <UEditor
        v-model="inputValue"
        :content-type="props.contentType"
        :placeholder="props.placeholder || undefined"
        :editable="isEditable"
        :handlers="editorHandlers"
        class="base-text-editor"
        :style="{ '--editor-height': normalizedHeight }"
      >
        <template
          v-if="props.toolbar && isEditable"
          #default="{ editor }"
        >
          <UEditorToolbar
            :editor="editor"
            :items="props.toolbarItems"
            class="border-b border-stone-200 bg-stone-50 px-2 py-2"
          />
        </template>
      </UEditor>
    </div>
  </UFormField>
</template>

<style scoped>
.base-text-editor {
  display: flex;
  flex-direction: column;
}

.base-text-editor :deep([data-slot="content"]) {
  height: var(--editor-height) !important;
  max-height: var(--editor-height) !important;
  min-height: var(--editor-height) !important;
  overflow-y: auto;
}

.base-text-editor :deep(.ProseMirror) {
  min-height: 100%;
  padding: 1rem;
}

.base-text-editor :deep(.ProseMirror:focus) {
  outline: none;
}
</style>
