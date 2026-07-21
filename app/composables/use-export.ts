import { useNotification } from "~/composables/use-notification";

export type ExportColumn<T> = {
  header: string;
  key?: keyof T;
  accessorKey?: string;
  accessorFn?: (row: T) => string | number | null | undefined;
};

export function useExport() {
  const { error } = useNotification();

  const exportToCSV = <T>(
    filename: string,
    data: T[],
    columns: ExportColumn<T>[],
  ) => {
    try {
      if (!data || data.length === 0) {
        error({ message: "No data available to export" });
        return;
      }

      // 1. Build CSV header row
      const headers = columns.map(c => `"${c.header.replace(/"/g, "\"\"")}"`).join(",");

      // 2. Build rows
      const rows = data.map((item) => {
        return columns.map((col) => {
          let val = "";
          if (col.accessorFn) {
            const rawVal = col.accessorFn(item);
            val = rawVal != null ? String(rawVal) : "";
          }
          else if (col.key) {
            const rawVal = item[col.key];
            val = rawVal != null ? String(rawVal) : "";
          }
          else if (col.accessorKey) {
            const rawVal = (item as any)[col.accessorKey];
            val = rawVal != null ? String(rawVal) : "";
          }

          // Escape quotes and wrap in quotes for CSV safety
          return `"${val.replace(/"/g, "\"\"")}"`;
        }).join(",");
      });

      const csvContent = [headers, ...rows].join("\n");

      // 3. Create blob and download link
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${filename}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    }
    catch (err) {
      console.error("Export error", err);
      error({ message: "Failed to export data" });
    }
  };

  return { exportToCSV };
}
