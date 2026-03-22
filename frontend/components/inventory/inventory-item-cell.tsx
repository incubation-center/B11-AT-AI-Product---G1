'use client';

import React from 'react';
import { User } from '@heroui/react';

interface InventoryItemCellProps {
  name: string;
  category: string;
  image?: string;
}

export function InventoryItemCell({ name, category, image }: InventoryItemCellProps) {
  return (
    <User
      avatarProps={{ radius: "lg", src: image }}
      description={category}
      name={name}
    >
      {name}
    </User>
  );
}
