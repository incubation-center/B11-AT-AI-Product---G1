'use client';

import React from 'react';
import { Chip } from '@heroui/react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

interface InventoryStatusChipProps {
  stock: number;
  threshold: number;
}

const statusColorMap: Record<string, "warning" | "success" | "danger" | "default" | "primary" | "secondary" | undefined> = {
  low: "warning",
  healthy: "success",
  out: "danger",
};

export function InventoryStatusChip({ stock, threshold }: InventoryStatusChipProps) {
  const status = stock <= 0 ? "out" : stock <= threshold ? "low" : "healthy";
  const label = status === "out" ? "Out of Stock" : status === "low" ? "Low Stock" : "Healthy";
  const Icon = status === "healthy" ? CheckCircle2 : AlertTriangle;
  
  return (
    <Chip
      className="capitalize"
      color={statusColorMap[status]}
      size="sm"
      variant="flat"
      startContent={<Icon size={14} className="ml-1" />}
    >
      {label}
    </Chip>
  );
}
