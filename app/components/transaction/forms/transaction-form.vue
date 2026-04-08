<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import * as z from "zod";

import { useNotification } from "~/composables/use-notification";
import { useTransactionsStore } from "~/stores/transaction";
import { getApiErrorMessage } from "~/utils/error";

type Props = {
  communityOptions?: Array<{ label: string; value: string }>;
  billableOptions?: Array<{ label: string; value: string; billableData?: any }>;
};

const props = withDefaults(defineProps<Props>(), {
  communityOptions: () => [],
  billableOptions: () => [],
});

const emit = defineEmits<{
  cancel: [];
}>();

const transactionsStore = useTransactionsStore();
const { success, error: showError } = useNotification();

const formRef = ref<InstanceType<typeof UForm> | null>(null);

const loading = ref(false);

const itemSchema = z.object({
  description: z.string().min(1, "Please select an item"),
});

const schema = z.object({
  communityId: z.number({ message: "Please select a community" }).min(1, "Please select a community"),
  referenceDate: z.string().min(1, "Bill date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  remarks: z.string().optional(),
  items: z.array(itemSchema).min(1, "At least one item is required"),
  taxType: z.string().optional(),
}).refine((data) => {
  if (!data.referenceDate || !data.dueDate)
    return true;
  const referenceDate = new Date(data.referenceDate);
  const dueDate = new Date(data.dueDate);
  return dueDate >= referenceDate;
}, {
  message: "Due date must be equal to or greater than bill date",
  path: ["dueDate"],
});

type Schema = z.output<typeof schema>;

const state = reactive<Partial<Schema>>({
  communityId: "",
  referenceDate: "",
  dueDate: "",
  remarks: "",
  items: [],
  taxType: "no-tax",
});

const invoiceItems = ref([
  {
    id: 1,
    item_type: "BILLABLE_ITEM",
    billable_item_id: "",
    description: "",
    quantity: 1,
    unit_price: 0,
    line_total: 0,
  },
]);

const taxOptions = [
  { label: "No Tax", value: "no-tax" },
  { label: "VAT 13%", value: "vat-13" },
];

const subtotal = computed(() => {
  return invoiceItems.value.reduce((sum, item) => sum + (item.line_total || 0), 0);
});

const vatAmount = computed(() => {
  if (!state.taxType || state.taxType === "no-tax")
    return 0;
  const vatMatch = state.taxType.match(/vat-(\d+)/);
  if (!vatMatch?.[1])
    return 0;
  const vatPercent = Number.parseFloat(vatMatch[1]);
  return (subtotal.value * vatPercent) / 100;
});

const total = computed(() => subtotal.value + vatAmount.value);

function updateItemAmount(item: any): void {
  item.line_total = (item.quantity * item.unit_price);
}

function calculateItemAmount(item: any): void {
  updateItemAmount(item);
}

const billableDataMap = computed(() => {
  const map = new Map<string, any>();
  props.billableOptions.forEach((option) => {
    if (option.billableData) {
      map.set(option.label, option.billableData);
    }
  });
  return map;
});

function handleBillableSelection(item: any, selectedLabel: string): void {
  const billableData = billableDataMap.value.get(selectedLabel);
  if (billableData) {
    item.description = billableData.name ?? billableData.description ?? selectedLabel;
    item.unit_price = Number(billableData.amount) || 0;
    item.billable_item_id = billableData.id ?? billableData.billable_item_id;
    calculateItemAmount(item);
  }
}

function handleItemDetailsChange(item: any, value: string): void {
  handleBillableSelection(item, value);
}

const itemDetailsOptions = computed(() =>
  props.billableOptions.map(opt => ({ label: opt.label, value: opt.label })),
);

async function validateForm(): Promise<void> {
  try {
    state.items = [...invoiceItems.value];
    await formRef.value?.validate();
  }
  catch {
    // Form validation errors are shown inline
  }
}

function resetForm(): void {
  state.communityId = "";
  state.referenceDate = "";
  state.dueDate = "";
  state.remarks = "";
  state.items = [];
  state.taxType = "no-tax";
  invoiceItems.value = [
    {
      id: 1,
      item_type: "BILLABLE_ITEM",
      billable_item_id: "",
      description: "",
      quantity: 1,
      unit_price: 0,
      line_total: 0,
    },
  ];
  formRef.value?.clear();
}

async function handleSubmit(): Promise<void> {
  state.items = [...invoiceItems.value];
  try {
    await formRef.value?.validate();
  }
  catch {
    return;
  }
  try {
    loading.value = true;
    const payload = {
      community_id: Number(state.communityId),
      reference_date: state.referenceDate,
      due_date: state.dueDate,
      remarks: state.remarks,
      items: state.items,
      subtotal: subtotal.value || 0,
      tax_total: vatAmount.value || 0,
      discount_total: 0,
      total_amount: total.value || 0,
    };
    await transactionsStore.createTransaction(payload);
    success({ message: "Invoice created successfully" });
    resetForm();
  }
  catch (error: unknown) {
    showError({ message: getApiErrorMessage(error, "Failed to create invoice") });
  }
  finally {
    loading.value = false;
  }
}

function handleCancel(): void {
  emit("cancel");
}
</script>

<template>
  <div class="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
    <UForm
      ref="formRef"
      :state="state"
      :schema="schema"
      :validate-on="['input', 'change', 'blur']"
      class="flex flex-col"
    >
      <div class="bg-linear-to-r from-primary/5 via-primary/3 to-transparent border-b border-border/60 p-4 sm:p-6 lg:p-8">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="flex flex-col gap-2">
            <div class="flex items-center gap-3">
              <div class="flex flex-col gap-0">
                <h1 class="text-2xl font-bold text-foreground uppercase">
                  New
                </h1>
                <p class="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Transaction
                </p>
              </div>
            </div>
          </div>

          <div class="flex flex-col gap-3 lg:items-end">
            <div class="flex flex-col gap-3 w-full lg:w-auto lg:min-w-[280px]">
              <div class="flex flex-col gap-1.5 sm:flex-row sm:justify-between sm:items-center">
                <span class="text-sm font-medium text-muted-foreground">Ref Date</span>
                <base-date-picker
                  v-model="state.referenceDate"
                  name="referenceDate"
                  placeholder="Select date"
                  class="w-full sm:w-40"
                  required
                  :no-of-months="1"
                  @update:model-value="validateForm"
                />
              </div>
              <div class="flex flex-col gap-1.5 sm:flex-row sm:justify-between sm:items-center">
                <span class="text-sm font-medium text-muted-foreground">Due Date</span>
                <base-date-picker
                  v-model="state.dueDate"
                  name="dueDate"
                  placeholder="Select due date"
                  class="w-full sm:w-40"
                  :no-of-months="1"
                  @update:model-value="validateForm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="p-4 sm:p-6 lg:p-8 border-b border-border/60">
        <div class="flex flex-col gap-3 w-full max-w-md">
          <div class="flex items-center gap-2 mb-1">
            <h3 class="text-sm font-semibold text-foreground uppercase tracking-wide">
              Bill To
            </h3>
          </div>
          <base-select-searchable
            v-model="state.communityId"
            name="communityId"
            placeholder="Type to search or select a community"
            :options="props.communityOptions"
            required
          />
        </div>
      </div>

      <div class="p-4 sm:p-6 lg:p-8 border-b border-border/60">
        <div class="flex flex-col gap-3">
          <div class="flex items-center gap-2 mb-1">
            <h3 class="text-sm font-semibold text-foreground uppercase tracking-wide">
              Items
            </h3>
          </div>
          <div class="border border-border/60 rounded-lg overflow-hidden bg-card w-full overflow-x-auto">
            <table class="w-full min-w-[520px] table-fixed">
              <thead class="bg-muted/50">
                <tr>
                  <th class="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider w-[35%] min-w-[140px]">
                    Item Details
                  </th>
                  <th class="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider w-[12%] min-w-[70px]">
                    Qty
                  </th>
                  <th class="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider w-[12%] min-w-[70px]">
                    Rate
                  </th>
                  <th class="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider w-[14%] min-w-[80px]">
                    Amount
                  </th>
                  <th class="w-[12%] min-w-[60px]" />
                </tr>
              </thead>
              <tbody class="divide-y divide-border">
                <tr
                  v-for="(item, index) in invoiceItems"
                  :key="item.id"
                  class="hover:bg-muted/30 transition-colors"
                >
                  <td class="px-3 sm:px-4 py-4 align-top">
                    <div class="min-h-[44px] flex items-center min-w-0">
                      <base-select
                        v-model="item.description"
                        :name="`items.${index}.description`"
                        placeholder="Type or click to select an item"
                        :options="itemDetailsOptions"
                        class="w-full"
                        @update:model-value="(value) => handleItemDetailsChange(item, value)"
                      />
                    </div>
                  </td>
                  <td class="px-3 sm:px-4 py-4 align-top">
                    <div class="min-h-[44px] flex items-center">
                      <base-input
                        :model-value="1"
                        :name="`items.${index}.quantity`"
                        type="number"
                        class="w-full"
                        readonly
                        disabled
                      />
                    </div>
                  </td>
                  <td class="px-3 sm:px-4 py-4 align-top">
                    <div class="min-h-[44px] flex items-center">
                      <base-input
                        v-model.number="item.unit_price"
                        :name="`items.${index}.unit_price`"
                        type="number"
                        class="w-full"
                        readonly
                        disabled
                      />
                    </div>
                  </td>
                  <td class="px-3 sm:px-4 py-4 align-top">
                    <div class="min-h-[44px] flex items-center">
                      <span class="text-sm font-medium text-foreground">{{ item.line_total.toFixed(2) }}</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="p-4 sm:p-6 lg:p-8 bg-muted/20">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-end">
          <div class="lg:col-span-2 flex flex-col gap-4">
            <UFormField
              name="remarks"
              :ui="{
                error: 'mt-1 text-red-500 text-xs',
              }"
            >
              <template #label>
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-sticky-note" class="w-4 h-4 text-muted-foreground" />
                  <span class="text-sm font-medium text-foreground">Internal Remarks</span>
                </div>
              </template>
              <UTextarea
                v-model="state.remarks"
                placeholder="Add internal notes or reminders"
                variant="outline"
                class="w-full"
                size="lg"
                :rows="4"
                :ui="{
                  base: 'bg-transparent',
                }"
              />
            </UFormField>
          </div>

          <div class="flex flex-col gap-4">
            <h3 class="text-sm font-semibold text-foreground uppercase tracking-wide mb-2">
              Summary
            </h3>
            <div class="border border-border/60 rounded-lg p-6 bg-card shadow-sm">
              <div class="flex justify-between items-center pb-3 mb-3 border-b border-border/40">
                <span class="text-sm font-medium text-muted-foreground">Sub Total</span>
                <span class="text-sm font-semibold text-foreground">{{ subtotal.toFixed(2) }}</span>
              </div>

              <div class="flex flex-col gap-3 pb-3 mb-3 border-b border-border/40">
                <div class="flex flex-wrap justify-between items-center gap-2">
                  <span class="text-sm font-medium text-muted-foreground">Tax</span>
                  <base-select
                    v-model="state.taxType"
                    name="taxType"
                    placeholder="Select tax"
                    :options="taxOptions"
                    class="w-28 shrink-0 h-9 text-sm"
                  />
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-xs text-muted-foreground">Tax Amount</span>
                  <span class="text-sm font-semibold text-foreground">{{ vatAmount.toFixed(2) }}</span>
                </div>
              </div>

              <div class="flex justify-between items-center pt-4 mt-3">
                <span class="text-base font-bold text-foreground">Total (NPR)</span>
                <span class="text-xl font-bold text-primary">{{ total.toFixed(2) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-col-reverse sm:flex-row justify-end gap-3 p-4 sm:p-6 lg:p-8 border-t border-border/60 bg-card">
        <base-button
          variant="outline"
          class="w-full sm:w-auto"
          @click="handleCancel"
        >
          Cancel
        </base-button>
        <base-button
          :loading="loading"
          class="w-full sm:w-auto"
          @click="handleSubmit"
        >
          Create
        </base-button>
      </div>
    </UForm>
  </div>
</template>
