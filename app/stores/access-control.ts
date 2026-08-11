import { defineStore } from "pinia";
import { ref } from "vue";

import type {
  AccessCard,
  AccessCardApiRecord,
  AccessControlQuery,
  AccessControlUserOption,
  CreateAccessCardPayload,
} from "~/types/access-card";
import type { AccessLog, AccessLogApiRecord } from "~/types/access-log";
import type { ApiResponse } from "~/types/api";

import { getHttp } from "~/composables/use-api";
import { API_ENDPOINTS } from "~/config/constants";
import { buildQueryString } from "~/utils/common";

function emptyResponse<T>(): ApiResponse<T[]> {
  return {
    data: [],
    meta: { page: 1, limit: 10, total: 0 },
  };
}

export const useAccessControlStore = defineStore("access-control", () => {
  const http = getHttp();
  const loading = ref(false);
  const accessCards = ref<ApiResponse<AccessCard[]>>(emptyResponse<AccessCard>());
  const accessLogs = ref<ApiResponse<AccessLog[]>>(emptyResponse<AccessLog>());
  const userOptions = ref<AccessControlUserOption[]>([]);

  async function fetchAccessCards(params: AccessControlQuery): Promise<void> {
    loading.value = true;
    try {
      const query = buildQueryString(params);
      const response = await http.get<ApiResponse<AccessCardApiRecord[]>>(`${API_ENDPOINTS.ACCESS_CONTROL.GET_CARDS}?${query}`);
      accessCards.value = {
        ...response,
        data: response.data.map(card => normalizeAccessCard(card)),
      };
    }
    finally {
      loading.value = false;
    }
  }

  async function fetchAccessCard(id: number): Promise<AccessCardApiRecord> {
    const response = await http.get<AccessCardApiRecord | { data: AccessCardApiRecord }>(API_ENDPOINTS.ACCESS_CONTROL.GET_CARD(id));
    return "data" in response ? response.data : response;
  }

  async function updateAccessCard(id: number, payload: CreateAccessCardPayload): Promise<void> {
    loading.value = true;
    try {
      await http.patch(API_ENDPOINTS.ACCESS_CONTROL.UPDATE_ACCESS_CARD(id), payload);
    }
    finally {
      loading.value = false;
    }
  }

  async function deleteAccessCard(id: number): Promise<void> {
    loading.value = true;
    try {
      await http.delete(API_ENDPOINTS.ACCESS_CONTROL.DELETE(id));
    }
    finally {
      loading.value = false;
    }
  }

  function normalizeAccessCard(card: AccessCardApiRecord): AccessCard {
    const name = card.fullName || "Unknown card holder";
    const initials = name
      .split(" ")
      .filter(Boolean)
      .map(part => part[0])
      .join("")
      .toUpperCase();
    const expiryDate = card.removeExpiration ? null : card.expiryDate || card.validUntil;
    const doors = card.doorAccess?.length
      ? card.doorAccess
      : card.doorNumbers.map(number => `Door ${number}`);

    return {
      id: card.id,
      client: { name, phone: card.phoneNumber || "", initials: initials || "?" },
      cardNumber: card.cardNumber,
      expiryDate,
      expiryLabel: expiryDate
        ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(expiryDate))
        : "Non-Expiry",
      doorAccess: doors[0] || "No Door Access",
      additionalDoors: doors.length > 1 ? doors.length - 1 : undefined,
      validity: card.validity,
    };
  }

  async function fetchAccessLogs(params: AccessControlQuery): Promise<void> {
    loading.value = true;
    try {
      const query = buildQueryString(params);
      const response = await http.get<ApiResponse<AccessLogApiRecord[]>>(`${API_ENDPOINTS.ACCESS_CONTROL.GET_LOGS}?${query}`);
      accessLogs.value = {
        ...response,
        data: response.data.map(log => normalizeAccessLog(log)),
      };
    }
    finally {
      loading.value = false;
    }
  }

  function normalizeAccessLog(log: AccessLogApiRecord): AccessLog {
    const [entryDate = "", entryTime = ""] = log.entryDateTime.split(" ");
    const initials = log.clientName
      .split(" ")
      .filter(Boolean)
      .map(part => part[0])
      .join("")
      .toUpperCase();

    return {
      ...log,
      client: { name: log.clientName, phone: "", initials: initials || "?" },
      entryDate,
      entryTime,
    };
  }

  async function fetchUserOptions(q?: string): Promise<void> {
    const query = buildQueryString(q?.trim() ? { q: q.trim() } : {});
    const response = await http.get<{ data?: AccessControlUserOption[] } | AccessControlUserOption[]>(`${API_ENDPOINTS.ACCESS_CONTROL.GET_USER}${query ? `?${query}` : ""}`);
    userOptions.value = Array.isArray(response) ? response : response.data ?? [];
  }

  async function createAccessCard(payload: CreateAccessCardPayload): Promise<void> {
    loading.value = true;
    try {
      await http.post(API_ENDPOINTS.ACCESS_CONTROL.POST, payload);
    }
    finally {
      loading.value = false;
    }
  }

  return {
    loading,
    accessCards,
    accessLogs,
    userOptions,
    fetchAccessCards,
    fetchAccessCard,
    updateAccessCard,
    deleteAccessCard,
    fetchAccessLogs,
    fetchUserOptions,
    createAccessCard,
  };
});
