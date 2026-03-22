'use client';

import { Skeleton, Card, CardBody } from '@heroui/react';

export default function DashboardLoading() {
  return (
    <main className="flex flex-col gap-8 py-8">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <Skeleton className="h-10 w-64 rounded-lg mb-2" />
          <Skeleton className="h-4 w-96 rounded-lg" />
        </div>
        <Skeleton className="h-10 w-10 rounded-lg" />
      </div>

      {/* Metrics Section Skeleton */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-6 w-40 rounded-lg" />
          <Skeleton className="h-10 w-64 rounded-lg" />
        </div>

        {/* Metric Cards Grid */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardBody className="flex flex-col gap-3 p-6">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <Skeleton className="h-8 w-32 rounded-lg" />
                <Skeleton className="h-4 w-24 rounded-lg" />
              </CardBody>
            </Card>
          ))}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Recent Orders Skeleton */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <Skeleton className="h-6 w-40 rounded-lg" />
          <Card>
            <CardBody className="gap-4 p-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-10 w-20 rounded-lg" />
                  <Skeleton className="h-10 w-32 rounded-lg" />
                  <Skeleton className="h-10 w-24 rounded-lg" />
                </div>
              ))}
            </CardBody>
          </Card>
        </div>

        {/* Low Stock Skeleton */}
        <div className="flex flex-col gap-4">
          <Skeleton className="h-6 w-40 rounded-lg" />
          <Card>
            <CardBody className="gap-4 p-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-4 items-center">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 gap-2 flex flex-col">
                    <Skeleton className="h-4 w-24 rounded-lg" />
                    <Skeleton className="h-3 w-32 rounded-lg" />
                  </div>
                  <Skeleton className="h-8 w-20 rounded-lg" />
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      </div>
    </main>
  );
}
