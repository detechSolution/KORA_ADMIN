type NotificationOptions = {
  title?: string;
  message: string;
  duration?: number;
};

const defaultOptions = {
  duration: 5000,
  ui: {
    root: "bg-card border border-border rounded-lg text-foreground",
    title: "font-semibold ",
  },
};

export function useNotification() {
  const toast = useToast();

  const success = (options: NotificationOptions) => {
    return toast.add({
      title: options.title || "Success",
      description: options.message,
      color: "success",
      duration: options.duration || defaultOptions.duration,
      ui: defaultOptions.ui,
    });
  };

  const error = (options: NotificationOptions) => {
    return toast.add({
      title: options.title || "Error",
      description: options.message,
      color: "error",
      duration: options.duration || defaultOptions.duration,
      ui: defaultOptions.ui,
    });
  };

  return {
    success,
    error,
  };
}
