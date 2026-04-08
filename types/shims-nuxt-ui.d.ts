declare module "@nuxt/ui/composables/useToast" {
  export type Toast = {
    id: string | number;
    open?: boolean;
    title?: string;
    description?: string;
    icon?: string;
    color?: string;
    timeout?: number;
    onClick?: (toast: Toast) => void;
    [key: string]: unknown;
  };

  export type UseToastResult = {
    toasts: import("vue").Ref<Toast[]>;
    add: (toast: Partial<Toast>) => Toast;
    update: (id: string | number, toast: Partial<Toast>) => void;
    remove: (id: string | number) => void;
    clear: () => void;
  };

  export function useToast(): UseToastResult;
}
