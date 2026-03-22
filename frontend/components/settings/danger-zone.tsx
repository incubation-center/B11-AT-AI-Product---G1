'use client';

import React from 'react';
import { 
  Card, 
  CardBody, 
  Button, 
  Divider, 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter, 
  useDisclosure 
} from '@heroui/react';
import { ShieldAlert, LogOut, Trash2 } from 'lucide-react';

interface DangerZoneProps {
  onDeactivateStore: () => void;
  isDeactivatingStore: boolean;
  onDeactivateAccount: () => void;
  isDeactivatingAccount: boolean;
}

export function DangerZone({
  onDeactivateStore,
  isDeactivatingStore,
  onDeactivateAccount,
  isDeactivatingAccount
}: DangerZoneProps) {
  const { 
    isOpen: isDeactivateStoreOpen, 
    onOpen: onDeactivateStoreOpen, 
    onOpenChange: onDeactivateStoreChange 
  } = useDisclosure();
  
  const { 
    isOpen: isDeactivateAccountOpen, 
    onOpen: onDeactivateAccountOpen, 
    onOpenChange: onDeactivateAccountChange 
  } = useDisclosure();

  return (
    <div className="flex flex-col gap-6">
      <Card className="border-2 border-danger-100 bg-danger-50/20 shadow-none">
        <CardBody className="gap-6 p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex flex-col gap-1">
              <p className="text-md font-bold text-danger-600">Deactivate Store</p>
              <p className="text-small text-default-500 max-w-lg">
                Public visitors will no longer be able to see your store or products. You can reactivate it later.
              </p>
            </div>
            <Button 
              color="danger" 
              variant="flat" 
              startContent={<LogOut size={18} />}
              onPress={onDeactivateStoreOpen}
            >
              Deactivate Store
            </Button>
          </div>
          <Divider className="bg-danger-100" />
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex flex-col gap-1">
              <p className="text-md font-bold text-danger-700">Delete Account</p>
              <p className="text-small text-default-500 max-w-lg">
                This will permanently deactivate your account and access to all stores. This action is irreversible.
              </p>
            </div>
            <Button 
              color="danger" 
              variant="solid" 
              startContent={<Trash2 size={18} />}
              onPress={onDeactivateAccountOpen}
              isDisabled={isDeactivatingAccount}
            >
              Delete Account
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Confirmation Modals */}
      <Modal isOpen={isDeactivateStoreOpen} onOpenChange={onDeactivateStoreChange} placement="center">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Confirm Deactivation</ModalHeader>
              <ModalBody>
                Are you sure you want to deactivate your store? This will make your storefront inaccessible to public buyers until you reactivate it.
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>Cancel</Button>
                <Button 
                  color="danger" 
                  variant="flat" 
                  onPress={() => {
                    onDeactivateStore();
                    onClose();
                  }}
                  isLoading={isDeactivatingStore}
                >
                  Confirm Deactivate
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal isOpen={isDeactivateAccountOpen} onOpenChange={onDeactivateAccountChange} placement="center">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Account Deletion Request</ModalHeader>
              <ModalBody>
                This action is irreversible. You will lose access to your owner dashboard and all associated stores. Are you absolutely certain?
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>Wait, I'll stay</Button>
                <Button 
                  color="danger" 
                  onPress={() => {
                    onDeactivateAccount();
                    // Closing might not be needed if it redirects, but let's keep it safe
                  }}
                  isLoading={isDeactivatingAccount}
                >
                  Yes, Delete Forever
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
