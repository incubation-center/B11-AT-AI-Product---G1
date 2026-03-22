'use client';

import React, { useState } from 'react';
import { 
  Button, 
  Tooltip, 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter,
  Input,
  useDisclosure
} from '@heroui/react';
import { Edit3, Package } from 'lucide-react';

interface InventoryActionsProps {
  name: string;
  currentStock: number;
  onUpdate: (newStock: number) => void;
}

export function InventoryActions({ name, currentStock, onUpdate }: InventoryActionsProps) {
  const {isOpen, onOpen, onOpenChange} = useDisclosure();
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
      <Tooltip content="Quick Update">
        <Button 
          isIconOnly 
          size="sm" 
          variant="light"
          onPress={onOpen}
        >
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
                Update Stock Level
              </ModalHeader>
              <ModalBody>
                <div className="flex flex-col gap-4 py-2">
                  <div className="flex items-center gap-3 p-3 bg-default-50 rounded-lg border border-default-100">
                    <div className="p-2 bg-primary-50 text-primary rounded-md">
                      <Package size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{name}</p>
                      <p className="text-xs text-default-500">Current stock: {currentStock}</p>
                    </div>
                  </div>
                  <Input
                    autoFocus
                    label="New Quantity"
                    placeholder="Enter stock amount"
                    type="number"
                    variant="bordered"
                    value={newStock}
                    onValueChange={setNewStock}
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="flat" onPress={onClose}>
                  Cancel
                </Button>
                <Button color="primary" onPress={() => handleUpdate(onClose)}>
                  Update Stock
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
