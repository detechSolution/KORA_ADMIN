import { defineStore } from "pinia";
import { ref } from "vue";

// import { getHttp } from "~/composables/use-api";

export const useKoraPassesStore = defineStore("kora-passes", () => {
  // const http = getHttp();

  // State
  const loading = ref(false);
  const koraPasses = ref<any[]>([]);

  // Actions
  const getKoraPasses = async (): Promise<void> => {
    try {
      loading.value = true;
      // Mocking for now
      koraPasses.value = [
        {
          id: 1,
          name: "1-Day Pass",
          status: "Active",
          description: "This pass includes all classes access, recovery axis, towel & locker.",
          discount: "10%",
          price: 1500,
        },
        {
          id: 2,
          name: "3-Day Pass",
          status: "Active",
          description: "This pass includes all classes access, recovery axis, towel & locker.",
          discount: "10%",
          price: 3375,
        },
        {
          id: 3,
          name: "7-Day Pass",
          status: "Active",
          description: "This pass includes all classes access, recovery axis, towel & locker.",
          discount: "10%",
          price: 6000,
        },
      ];
      // const res = await http.get(API_ENDPOINTS.KORA_PASSES.GET_LIST);
      // koraPasses.value = res.data;
    }
    catch (error: unknown) {
      console.error(error, "Get Kora Passes Error");
      throw error;
    }
    finally {
      loading.value = false;
    }
  };

  return {
    loading,
    koraPasses,
    getKoraPasses,
  };
});
