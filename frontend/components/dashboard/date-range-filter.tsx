// Reusable UI primitive — no business logic

"use client";

import { ButtonGroup, Button } from "@heroui/react";
import type { DateRangeFilter } from "@/hooks/use-dashboard-metrics";

interface DateRangeFilterProps {
  selectedRange: DateRangeFilter;
  onRangeChange: (range: DateRangeFilter) => void;
}

const filterOptions: { label: string; value: DateRangeFilter }[] = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
];

export function DateRangeFilter({ selectedRange, onRangeChange }: DateRangeFilterProps) {
  return (
    <ButtonGroup variant="flat">
      {filterOptions.map((option) => (
        <Button
          key={option.value}
          onPress={() => onRangeChange(option.value)}
          color={selectedRange === option.value ? "primary" : "default"}
          className={selectedRange === option.value ? "font-semibold" : ""}
        >
          {option.label}
        </Button>
      ))}
    </ButtonGroup>
  );
}
