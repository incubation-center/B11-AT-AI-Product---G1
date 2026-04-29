// Feature component — Product Form Variants Step
'use client';

import { useTranslations } from 'next-intl';
import {
  Checkbox,
  Button,
  Input,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Tooltip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from '@heroui/react';
import { AlertCircle, Plus, Trash2, Edit } from 'lucide-react';
import { useState } from 'react';
import type { ProductVariant } from '@/lib/products';

interface ProductFormVariantsStepProps {
  hasVariants: boolean;
  onHasVariantsChange: (value: boolean) => void;
  variants: Partial<ProductVariant>[];
  onVariantsChange: (variants: Partial<ProductVariant>[]) => void;
  isLoading: boolean;
}

export function ProductFormVariantsStep({
  hasVariants,
  onHasVariantsChange,
  variants,
  onVariantsChange,
  isLoading,
}: ProductFormVariantsStepProps) {
  const t = useTranslations('products.form.variants');
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [editingVariant, setEditingVariant] =
    useState<Partial<ProductVariant> | null>(null);

  // Local form state for new/editing variant
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [priceUsd, setPriceUsd] = useState('');
  const [priceKhr, setPriceKhr] = useState('');
  const [stock, setStock] = useState('0');

  const handleAddClick = () => {
    setEditingVariant(null);
    setSize('');
    setColor('');
    setPriceUsd('');
    setPriceKhr('');
    setStock('0');
    onOpen();
  };

  const handleEditClick = (variant: Partial<ProductVariant>) => {
    setEditingVariant(variant);
    setSize(variant.size || '');
    setColor(variant.color || '');
    setPriceUsd(variant.price_override_usd || '');
    setPriceKhr(variant.price_override_khr || '');
    setStock(variant.stock_qty?.toString() || '0');
    onOpen();
  };

  const handleSaveVariant = () => {
    const newVariant: Partial<ProductVariant> = {
      ...(editingVariant || {}),
      size: size || undefined,
      color: color || undefined,
      price_override_usd: priceUsd || null,
      price_override_khr: priceKhr || null,
      stock_qty: parseInt(stock, 10) || 0,
      is_active: true,
    };

    if (editingVariant) {
      onVariantsChange(
        variants.map((v) => (v === editingVariant ? newVariant : v)),
      );
    } else {
      onVariantsChange([...variants, newVariant]);
    }
    onOpenChange();
  };

  const handleDeleteVariant = (variant: Partial<ProductVariant>) => {
    onVariantsChange(variants.filter((v) => v !== variant));
  };

  return (
    <div className="space-y-6">
      <div className="bg-default-50 rounded-lg p-5 border border-default-200">
        <div className="flex items-start space-x-3">
          <Checkbox
            aria-label={t('hasVariantsAria')}
            isSelected={hasVariants}
            onValueChange={onHasVariantsChange}
            isDisabled={isLoading}
            classNames={{
              wrapper: 'mt-1',
            }}
          />
          <div className="space-y-1 flex-1">
            <p className="text-sm font-semibold text-default-900">
              {t('hasVariants')}
            </p>
            <p className="text-xs text-default-500">{t('hasVariantsHelp')}</p>
          </div>
        </div>
      </div>

      {hasVariants && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-default-900">
              {t('manageVariants')}
            </h3>
            <Button
              size="sm"
              color="primary"
              variant="flat"
              startContent={<Plus className="h-4 w-4" />}
              onPress={handleAddClick}
              isDisabled={isLoading}
            >
              {t('addVariant')}
            </Button>
          </div>

          {variants.length > 0 ? (
            <Table aria-label={t('tableAria')} removeWrapper>
              <TableHeader>
                <TableColumn>{t('columns.variant')}</TableColumn>
                <TableColumn>{t('columns.priceUsd')}</TableColumn>
                <TableColumn>{t('columns.stock')}</TableColumn>
                <TableColumn align="end">{t('columns.actions')}</TableColumn>
              </TableHeader>
              <TableBody>
                {variants.map((v, i) => (
                  <TableRow key={v.id || i}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {[v.size, v.color].filter(Boolean).join(' / ') ||
                            t('standard')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {v.price_override_usd
                        ? `$${v.price_override_usd}`
                        : t('basePrice')}
                    </TableCell>
                    <TableCell>{v.stock_qty ?? 0}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Tooltip content={t('editVariant')}>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={() => handleEditClick(v)}
                          >
                            <Edit className="h-4 w-4 text-default-400" />
                          </Button>
                        </Tooltip>
                        <Tooltip color="danger" content={t('deleteVariant')}>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={() => handleDeleteVariant(v)}
                          >
                            <Trash2 className="h-4 w-4 text-danger" />
                          </Button>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 bg-default-50 rounded-lg border border-dashed border-default-300">
              <p className="text-xs text-default-400">{t('empty')}</p>
            </div>
          )}
        </div>
      )}

      {/* Info Warning */}
      {!hasVariants && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 border border-blue-200">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">
              {t('infoTitle')}
            </p>
            <p className="text-xs text-blue-700 mt-1">{t('infoText')}</p>
          </div>
        </div>
      )}

      {/* Add/Edit Variant Modal */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="md">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                {editingVariant ? t('editVariantTitle') : t('addVariantTitle')}
              </ModalHeader>
              <ModalBody className="gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label={t('size')}
                    placeholder={t('sizePlaceholder')}
                    value={size}
                    onValueChange={setSize}
                    variant="bordered"
                  />
                  <Input
                    label={t('color')}
                    placeholder={t('colorPlaceholder')}
                    value={color}
                    onValueChange={setColor}
                    variant="bordered"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label={t('priceUsd')}
                    placeholder={t('overrideBasePrice')}
                    value={priceUsd}
                    onValueChange={setPriceUsd}
                    type="number"
                    variant="bordered"
                    startContent={
                      <span className="text-default-400 text-small">$</span>
                    }
                  />
                  <Input
                    label={t('priceKhr')}
                    placeholder={t('overrideBasePrice')}
                    value={priceKhr}
                    onValueChange={setPriceKhr}
                    type="number"
                    variant="bordered"
                  />
                </div>
                <Input
                  label={t('initialStock')}
                  value={stock}
                  onValueChange={setStock}
                  type="number"
                  variant="bordered"
                />
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  {t('cancel')}
                </Button>
                <Button color="primary" onPress={handleSaveVariant}>
                  {editingVariant ? t('update') : t('add')}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
