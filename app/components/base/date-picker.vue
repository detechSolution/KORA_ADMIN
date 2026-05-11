<script setup lang="ts">
import type {
  CalendarDateTime,
  ZonedDateTime,
} from "@internationalized/date";

import { CalendarDate, DateFormatter, getLocalTimeZone } from "@internationalized/date";
import { computed, ref, toRef } from "vue";

import { ICONS } from "~/config/icons";

// Type definitions
type DateValueType = CalendarDate | CalendarDateTime | ZonedDateTime;

type DateRangeType = {
  start: DateValueType | null;
  end?: DateValueType | null;
};

type StringDateRangeType = {
  start: string | null;
  end?: string | null;
};

type ModelValueType = DateValueType | DateValueType[] | DateRangeType | null | string;

type OutputValueType = string | string[] | StringDateRangeType | null;

type Props = {
  name: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  modelValue?: OutputValueType;
  disabled?: boolean;
  readonly?: boolean;
  inputBgPrimary?: boolean;
  multiple?: boolean;
  range?: boolean;
  locale?: string;
  dateFormat?: Intl.DateTimeFormatOptions;
  numberOfMonths?: number;
  maxDate?: string;
  minDate?: string;
  noOfMonths?: number;
};

const props = withDefaults(defineProps<Props>(), {
  label: "",
  required: false,
  placeholder: "Select date",
  disabled: false,
  readonly: false,
  inputBgPrimary: false,
  multiple: false,
  range: false,
  locale: "en-US",
  dateFormat: () => ({ dateStyle: "medium" } as Intl.DateTimeFormatOptions),
  numberOfMonths: 2,
  maxDate: undefined,
  minDate: undefined,
  noOfMonths: 2,
});

const emit = defineEmits<{
  "update:modelValue": [value: OutputValueType];
}>();

// Optimized date formatter - created once and reused
const dateFormatter = computed(() =>
  new DateFormatter(props.locale, props.dateFormat),
);

// Type guards - optimized for performance
function isValidDateValue(value: unknown): value is DateValueType {
  return Boolean(value && typeof value === "object" && "toDate" in (value as object));
}

function isDateRange(value: unknown): value is DateRangeType {
  return Boolean(value && typeof value === "object" && "start" in (value as object));
}

// Convert DateValue to YYYY-MM-DD string format
function dateToString(date: DateValueType): string {
  try {
    const year = date.year.toString();
    const month = date.month.toString().padStart(2, "0");
    const day = date.day.toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  catch (error) {
    console.warn("Date to string conversion error:", error, date);
    return "";
  }
}

// Convert string (YYYY-MM-DD) back to CalendarDate
function stringToDate(dateString: string): CalendarDate | null {
  try {
    const [year, month, day] = dateString.split("-").map(Number);
    if (year && month && day) {
      return new CalendarDate(year, month, day);
    }
    return null;
  }
  catch (error) {
    console.warn("String to date conversion error:", error, dateString);
    return null;
  }
}

// Centralized date formatting for display with error handling
function formatDate(date: DateValueType): string {
  try {
    return dateFormatter.value.format(date.toDate(getLocalTimeZone()));
  }
  catch (error) {
    console.warn("Date formatting error:", error, date);
    return "";
  }
}

// Convert internal calendar values to string format for output
function convertToStringFormat(value: ModelValueType): OutputValueType {
  if (!value)
    return null;

  try {
    // Range mode: convert { start, end } to string format
    if (props.range && isDateRange(value)) {
      const result: StringDateRangeType = {
        start: value.start && isValidDateValue(value.start) ? dateToString(value.start) : null,
      };

      if (value.end && isValidDateValue(value.end)) {
        result.end = dateToString(value.end);
      }

      return result;
    }

    // Multiple mode: convert array to string array
    if (props.multiple && Array.isArray(value)) {
      const validDates = value.filter(isValidDateValue);
      return validDates.map(dateToString);
    }

    // Single date mode: convert to string
    if (isValidDateValue(value)) {
      return dateToString(value);
    }

    return null;
  }
  catch (error) {
    console.warn("String conversion error:", error);
    return null;
  }
}

// Convert string format back to calendar values for internal use
function convertFromStringFormat(value: OutputValueType): ModelValueType {
  if (!value)
    return null;

  try {
    // Handle string range object
    if (props.range && typeof value === "object" && "start" in value) {
      const rangeValue = value as StringDateRangeType;
      const result: DateRangeType = {
        start: rangeValue.start ? stringToDate(rangeValue.start) : null,
      };

      if (rangeValue.end) {
        result.end = stringToDate(rangeValue.end);
      }

      return result;
    }

    // Handle string array (multiple mode)
    if (props.multiple && Array.isArray(value)) {
      return value.map(stringToDate).filter(Boolean) as DateValueType[];
    }

    // Handle single string date
    if (typeof value === "string") {
      return stringToDate(value);
    }

    return null;
  }
  catch (error) {
    console.warn("Calendar conversion error:", error);
    return null;
  }
}

// Optimized model value handling
const modelValue = toRef(props, "modelValue");

const internalValue = computed({
  get: () => {
    // Convert string format back to calendar format for internal use
    return convertFromStringFormat(modelValue.value as OutputValueType);
  },
  set: (value: ModelValueType) => {
    // Convert calendar format to string format for output
    const stringValue = convertToStringFormat(value);
    emit("update:modelValue", stringValue);
  },
});

// Optimized display value computation
const displayValue = computed(() => {
  const value = internalValue.value;
  if (!value)
    return "";

  try {
    // Range mode: { start, end } object structure
    if (props.range && isDateRange(value)) {
      if (!value.start || !isValidDateValue(value.start))
        return "";

      const startFormatted = formatDate(value.start);

      if (value.end && isValidDateValue(value.end)) {
        return `${startFormatted} - ${formatDate(value.end)}`;
      }

      return startFormatted;
    }

    // Multiple mode: array of dates
    if (props.multiple && Array.isArray(value)) {
      const validDates = value.filter(isValidDateValue);
      return validDates.length > 0 ? validDates.map(formatDate).join(", ") : "";
    }

    // Single date mode
    if (isValidDateValue(value)) {
      return formatDate(value);
    }

    return "";
  }
  catch (error) {
    console.warn("Display value computation error:", error);
    return "";
  }
});

// Computed UI classes for better performance
const inputClasses = computed(() => ({
  root: "focus:ring-0",
  base: "ring-stone-300 placeholder:text-stone-400",
}));

const calendarClasses = computed(() => ({
  root: "bg-card border border-border",
  base: "ring-stone-300 placeholder:text-stone-400",
}));

const formFieldClasses = computed(() => ({
  error: "mt-1 text-red-500 text-xs",
  base: "ring-stone-300 placeholder:text-stone-400",
}));

const popoverOpen = ref(false);

function shouldClosePicker(value: any): boolean {
  if (props.range) {
    return Boolean(
      value
      && typeof value === "object"
      && "start" in value
      && value.start
      && value.end,
    );
  }

  if (props.multiple)
    return false;

  return Boolean(value);
}

function handleCalendarChange(value: any): void {
  if (shouldClosePicker(value))
    popoverOpen.value = false;
}

// Calendar value with proper typing - ensures we only pass calendar types, not strings
const calendarValue = computed({
  get: () => {
    const value = internalValue.value;
    // Filter out string types (shouldn't happen, but TypeScript needs this)
    if (typeof value === "string") {
      return null;
    }
    // Convert DateRangeType to match UCalendar's expected format (null -> undefined)
    if (value && typeof value === "object" && "start" in value) {
      const range = value as DateRangeType;
      return {
        start: range.start || undefined,
        end: range.end || undefined,
      };
    }
    return value as DateValueType | DateValueType[] | null;
  },
  set: (value: any) => {
    // Convert back to our internal format
    if (value && typeof value === "object" && "start" in value) {
      internalValue.value = {
        start: value.start || null,
        end: value.end || null,
      } as DateRangeType;
    }
    else {
      internalValue.value = value;
    }
  },
});

// Convert max/min date strings to CalendarDate
const maxCalendarDate = computed(() => {
  if (!props.maxDate)
    return undefined;
  const date = stringToDate(props.maxDate);
  return date || undefined;
});

const minCalendarDate = computed(() => {
  if (!props.minDate)
    return undefined;
  const date = stringToDate(props.minDate);
  return date || undefined;
});
</script>

<template>
  <UPopover v-model:open="popoverOpen">
    <UFormField
      :label="label"
      :name="name"
      :required="required"
      :ui="formFieldClasses"
    >
      <UInput
        :model-value="displayValue"
        type="text"
        :placeholder="placeholder"
        :required="required"
        :disabled="disabled"
        readonly
        :trailing-icon="ICONS.CALENDAR"
        variant="outline"
        class="w-full cursor-pointer"
        size="lg"
        :ui="inputClasses"
      />
    </UFormField>

    <template #content>
      <UCalendar
        v-model="calendarValue"
        class="p-2"
        :number-of-months="noOfMonths"
        :range="range"
        :multiple="multiple"
        :max-value="maxCalendarDate"
        :min-value="minCalendarDate"
        :ui="calendarClasses"
        @update:model-value="handleCalendarChange"
      />
    </template>
  </UPopover>
</template>
