'use client';

import React from 'react';
import { Card, CardBody, Skeleton } from '@heroui/react';

export default function OrdersLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-32 rounded-lg" />
        <Skeleton className="h-4 w-64 rounded-lg" />
      </div>

      <Card shadow="sm">
        <CardBody className="p-4 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <Skeleton className="h-10 w-1/3 rounded-lg" />
            <Skeleton className="h-10 w-24 rounded-lg" />
          </div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
