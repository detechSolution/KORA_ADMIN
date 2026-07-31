export default defineAppConfig({
  ui: {
    table: {
      slots: {
        base: "min-w-full w-full border-separate border-spacing-0 border border-border rounded-lg table-auto",
        thead: "[&>tr]:bg-muted [&>tr]:after:content-none",
        td: "border-t border-border text-foreground whitespace-nowrap",
        separator: "h-0",
      },
    },
    pagination: {
      slots: {
        root: "w-full",
        list: "flex flex-nowrap items-center justify-end gap-1",
        item: "cursor-pointer min-w-8 h-8 justify-center rounded text-xs font-medium transition-colors sm:min-w-8 sm:h-8 sm:text-sm",
        first: "rounded min-w-8 h-8 bg-muted",
        prev: "rounded min-w-8 h-8 bg-muted",
        next: "rounded min-w-8 h-8 bg-muted",
        last: "rounded min-w-8 h-8 bg-muted",
      },
    },
    skeleton: {
      base: "bg-stone-100 dark:bg-secondary-800 text-secondary-900 dark:text-secondary-50",
    },
  },
  safelist: [
    "min-w-[150px]",
    "max-w-[1000px]",
    "max-w-[900px]",
    "max-w-[800px]",
    "max-w-[700px]",
    "max-w-[600px]",
  ],
});
