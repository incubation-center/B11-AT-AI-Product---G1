'use client';

import React from 'react';
import {
  Input,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Selection,
} from '@heroui/react';
import { Search, ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface InventoryTableHeaderProps {
  filterValue: string;
  onFilterChange: (value: string) => void;
  statusFilter: Selection;
  onStatusFilterChange: (selection: Selection) => void;
  totalItems: number;
  onRowsPerPageChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export function InventoryTableHeader({
  filterValue,
  onFilterChange,
  statusFilter,
  onStatusFilterChange,
  totalItems,
  onRowsPerPageChange,
}: InventoryTableHeaderProps) {
  const t = useTranslations('inventory');
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between gap-3 items-end">
        <Input
          isClearable
          className="w-full sm:max-w-[44%]"
          placeholder={t('searchPlaceholder')}
          startContent={<Search className="text-default-300" />}
          value={filterValue}
          onClear={() => onFilterChange('')}
          onValueChange={onFilterChange}
        />
        <div className="flex gap-3">
          <Dropdown>
            <DropdownTrigger className="hidden sm:flex">
              <Button
                endContent={<ChevronDown className="text-small" />}
                variant="flat"
              >
                {t('status')}
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              disallowEmptySelection
              aria-label={t('tableColumnsAria')}
              closeOnSelect={false}
              selectedKeys={statusFilter}
              selectionMode="multiple"
              onSelectionChange={onStatusFilterChange}
            >
              <DropdownItem key="healthy" className="capitalize">
                {t('healthy')}
              </DropdownItem>
              <DropdownItem key="low" className="capitalize">
                {t('lowStock')}
              </DropdownItem>
              <DropdownItem key="out" className="capitalize">
                {t('outOfStock')}
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-default-400 text-small">
          {t('totalItems', { count: totalItems })}
        </span>
        <label className="flex items-center text-default-400 text-small">
          {t('rowsPerPage')}
          <select
            className="bg-transparent outline-none text-default-400 text-small"
            onChange={onRowsPerPageChange}
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
        </label>
      </div>
    </div>
  );
}
