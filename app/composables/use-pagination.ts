import { ref } from "vue";

import { DEFAULT_PAGE_SIZE } from "~/config/constants";

/**
 * Composable for list page pagination state.
 * Use with store list actions that accept { pagination: { page, limit } }.
 *
 * @param initialPageSize - Default page size (limit). Defaults to DEFAULT_PAGE_SIZE from config.
 */
export function usePagination(initialPageSize = DEFAULT_PAGE_SIZE) {
  const pagination = ref({
    page: 1,
    pageSize: initialPageSize,
  });

  const resetPagination = () => {
    pagination.value.page = 1;
  };

  const setPage = (page: number) => {
    pagination.value.page = page;
  };

  const setPageSize = (pageSize: number) => {
    pagination.value.pageSize = pageSize;
    resetPagination();
  };

  return {
    pagination,
    resetPagination,
    setPage,
    setPageSize,
  };
}
