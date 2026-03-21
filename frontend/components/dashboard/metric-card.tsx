// Feature component — Dashboard domain

import { Card, CardBody, Spinner } from "@heroui/react";
import React from "react";

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  isLoading?: boolean;
}

export function MetricCard({
  icon,
  label,
  value,
  change,
  changeType = "neutral",
  isLoading = false,
}: MetricCardProps) {
  const changeColorMap = {
    positive: "text-success",
    negative: "text-danger",
    neutral: "text-default-500",
  };

  return (
    <Card className="backdrop-blur-md bg-content1/80 shadow-md" shadow="none">
      <CardBody className="flex flex-col gap-3 p-6">
        <div className="flex items-start justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-content2">
            {icon}
          </div>
          {change && (
            <span className={`text-sm font-semibold ${changeColorMap[changeType]}`}>
              {changeType === "negative" && "-"}
              {change}
            </span>
          )}
        </div>

        {isLoading ? (
          <Spinner size="sm" color="primary" />
        ) : (
          <>
            <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
            <p className="text-sm text-default-500">{label}</p>
          </>
        )}
      </CardBody>
    </Card>
  );
}
