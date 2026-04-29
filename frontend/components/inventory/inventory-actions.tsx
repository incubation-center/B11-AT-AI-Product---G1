'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Button,
  Tooltip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  useDisclosure,
} from '@heroui/react';
import { Edit3, Package } from 'lucide-react';

interface InventoryActionsProps {
  name: string;
  currentStock: number;
  onUpdate: (newStock: number) => void;
}

export function InventoryActions({
  name,
  currentStock,
  onUpdate,
}: InventoryActionsProps) {
  const t = useTranslations('inventory');
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [newStock, setNewStock] = useState(String(currentStock));

  const handleUpdate = (onClose: () => void) => {
    const val = Number(newStock);
    if (!isNaN(val)) {
      onUpdate(val);
      onClose();
    }
  };

  return (
    <div className="relative flex justify-end items-center gap-2">
      <Tooltip content={t('quickUpdate')}>
        <Button isIconOnly size="sm" variant="light" onPress={onOpen}>
          <Edit3 size={18} className="text-default-400" />
        </Button>
      </Tooltip>

      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        placement="center"
        backdrop="blur"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {t('updateStockLevel')}
              </ModalHeader>
              <ModalBody>
                <div className="flex flex-col gap-4 py-2">
                  <div className="flex items-center gap-3 p-3 bg-default-50 rounded-lg border border-default-100">
                    <div className="p-2 bg-primary-50 text-primary rounded-md">
                      <Package size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{name}</p>
                      <p className="text-xs text-default-500">
                        {t('currentStock', { value: currentStock })}
                      </p>
                    </div>
                  </div>
                  <Input
                    autoFocus
                    label={t('newQuantity')}
                    placeholder={t('enterStockAmount')}
                    type="number"
                    variant="bordered"
                    value={newStock}
                    onValueChange={setNewStock}
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="flat" onPress={onClose}>
                  {t('cancel')}
                </Button>
                <Button color="primary" onPress={() => handleUpdate(onClose)}>
                  {t('updateStock')}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
