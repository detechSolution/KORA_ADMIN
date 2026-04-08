/**
 * Minimal types for table column definitions and row data.
 * Use Record<string, unknown> for row data when you need type safety without a full model.
 */
export type TableColumn<T = Record<string, unknown>> = {
  accessorKey?: string;
  header?: string;
  cell?: (info: { row: { original: T } }) => unknown;
  [key: string]: unknown;
};

export type TableRow = Record<string, unknown>;
