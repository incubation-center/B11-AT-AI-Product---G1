// Feature component — Product Variant Drawer
'use client';

import { useState, useCallback } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Divider,
  Chip,
  Avatar,
  Input,
  Switch,
  Tooltip,
  ScrollShadow,
} from '@heroui/react';
import {
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Layers,
  AlertCircle,
  PackageOpen,
} from 'lucide-react';
import type { Product, ProductVariant } from '@/lib/products';
import {
  createVariant,
  updateVariant,
  deactivateVariant,
  updateProduct,
} from '@/lib/products';

interface ProductVariantDrawerProps {
  product: Product | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onProductUpdated: () => void;
}

interface VariantFormState {
  size: string;
  color: string;
  priceUsd: string;
  priceKhr: string;
  stock: string;
}

const emptyForm = (): VariantFormState => ({
  size: '',
  color: '',
  priceUsd: '',
  priceKhr: '',
  stock: '0',
});

const variantToForm = (v: Partial<ProductVariant>): VariantFormState => ({
  size: v.size || '',
  color: v.color || '',
  priceUsd: v.price_override_usd || '',
  priceKhr: v.price_override_khr || '',
  stock: v.stock_qty?.toString() || '0',
});

export function ProductVariantDrawer({
  product,
  isOpen,
  onOpenChange,
  onProductUpdated,
}: ProductVariantDrawerProps) {
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [form, setForm] = useState<VariantFormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [togglingVariants, setTogglingVariants] = useState(false);

  // Local optimistic variant state so UI feels instant
  const [localVariants, setLocalVariants] = useState<ProductVariant[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Sync local variants from product whenever the drawer opens / product changes
  const initVariants = useCallback(() => {
    setLocalVariants((product?.variants as ProductVariant[]) || []);
    setInitialized(true);
    setEditingId(null);
    setForm(emptyForm());
    setError(null);
  }, [product]);

  if (!initialized && isOpen && product) {
    initVariants();
  }

  if (!isOpen || !product) return null;

  const variants = localVariants;
  const hasVariants = product.has_variants;

  const setField = (key: keyof VariantFormState, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleStartAdd = () => {
    setEditingId('new');
    setForm(emptyForm());
    setError(null);
  };

  const handleStartEdit = (v: ProductVariant) => {
    setEditingId(v.id);
    setForm(variantToForm(v));
    setError(null);
  };

  const handleCancel = () => {
    setEditingId(null);
    setError(null);
  };

  const handleSave = async () => {
    if (!form.size && !form.color) {
      setError('Please specify at least a size or colour.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        size: form.size || undefined,
        color: form.color || undefined,
        price_override_usd: form.priceUsd || null,
        price_override_khr: form.priceKhr || null,
        stock_qty: parseInt(form.stock, 10) || 0,
        is_active: true,
      };

      if (editingId === 'new') {
        const res = await createVariant(product.id, payload);
        setLocalVariants((prev) => [...prev, res.variant]);
      } else if (editingId) {
        const res = await updateVariant(editingId, payload);
        setLocalVariants((prev) =>
          prev.map((v) => (v.id === editingId ? res.variant : v)),
        );
      }
      setEditingId(null);
      setForm(emptyForm());
      onProductUpdated();
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to save variant');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (v: ProductVariant) => {
    if (!confirm(`Remove variant "${[v.size, v.color].filter(Boolean).join(' / ') || 'this variant'}"?`)) return;
    try {
      await deactivateVariant(v.id);
      setLocalVariants((prev) => prev.filter((x) => x.id !== v.id));
      onProductUpdated();
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to remove variant');
    }
  };

  const handleToggleVariants = async (enabled: boolean) => {
    setTogglingVariants(true);
    try {
      await updateProduct(product.id, { has_variants: enabled });
      onProductUpdated();
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to update product');
    } finally {
      setTogglingVariants(false);
    }
  };

  const variantLabel = (v: ProductVariant) =>
    [v.size, v.color].filter(Boolean).join(' / ') || 'Standard';

  const isEditing = editingId !== null;

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) setInitialized(false);
        onOpenChange(open);
      }}
      size="2xl"
      scrollBehavior="inside"
      classNames={{
        base: 'max-w-[680px] mx-0 sm:mx-auto sm:my-auto my-0 rounded-none sm:rounded-large min-h-full sm:min-h-0',
        wrapper: 'items-end sm:items-center justify-end sm:justify-center',
        body: 'p-0',
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            {/* Header */}
            <ModalHeader className="flex flex-col gap-0 pb-3 pt-4">
              <div className="flex items-center gap-3">
                <Avatar
                  src={product.image_urls?.[0] || undefined}
                  fallback={<PackageOpen size={18} />}
                  size="sm"
                  radius="sm"
                  className="flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{product.name}</p>
                  <p className="text-xs text-default-400 font-normal">
                    {product.category || 'Uncategorised'} &mdash; base ${product.base_price_usd || '—'}
                  </p>
                </div>
                <Chip
                  size="sm"
                  variant="flat"
                  color="secondary"
                  startContent={<Layers size={12} className="ml-1" />}
                >
                  Variant Manager
                </Chip>
              </div>
            </ModalHeader>

            <Divider />

            <ModalBody>
              <ScrollShadow className="px-6 py-5 space-y-5">

                {/* Enable Variants Toggle */}
                <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-default-50 border border-default-200">
                  <div>
                    <p className="text-sm font-semibold">Product has variants</p>
                    <p className="text-xs text-default-500 mt-0.5">
                      Enable to manage size, colour, or other options with individual prices &amp; stock.
                    </p>
                  </div>
                  <Switch
                    isSelected={hasVariants}
                    onValueChange={handleToggleVariants}
                    isDisabled={togglingVariants}
                    size="sm"
                    aria-label="Toggle product variants"
                  />
                </div>

                {hasVariants && (
                  <div className="space-y-4">
                    {/* Variant list header */}
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-default-700">
                        Variants
                        {variants.length > 0 && (
                          <span className="ml-2 text-default-400 font-normal">({variants.length})</span>
                        )}
                      </p>
                      {!isEditing && (
                        <Button
                          size="sm"
                          color="primary"
                          variant="flat"
                          startContent={<Plus size={14} />}
                          onPress={handleStartAdd}
                        >
                          Add Variant
                        </Button>
                      )}
                    </div>

                    {/* Error banner */}
                    {error && (
                      <div className="flex gap-2 p-3 rounded-lg bg-danger-50 border border-danger-200 text-danger-700">
                        <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                        <p className="text-xs">{error}</p>
                      </div>
                    )}

                    {/* Inline Add Form */}
                    {editingId === 'new' && (
                      <VariantInlineForm
                        form={form}
                        setField={setField}
                        onSave={handleSave}
                        onCancel={handleCancel}
                        saving={saving}
                        isNew
                      />
                    )}

                    {/* Variants List */}
                    {variants.length === 0 && editingId !== 'new' ? (
                      <div className="text-center py-10 border border-dashed border-default-300 rounded-xl bg-default-50">
                        <Layers size={32} className="mx-auto text-default-300 mb-2" />
                        <p className="text-sm text-default-500 font-medium">No variants yet</p>
                        <p className="text-xs text-default-400 mt-1">
                          Click <strong>Add Variant</strong> to create your first one.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {variants.map((v) =>
                          editingId === v.id ? (
                            <VariantInlineForm
                              key={v.id}
                              form={form}
                              setField={setField}
                              onSave={handleSave}
                              onCancel={handleCancel}
                              saving={saving}
                              isNew={false}
                            />
                          ) : (
                            <VariantRow
                              key={v.id}
                              variant={v}
                              label={variantLabel(v)}
                              onEdit={() => handleStartEdit(v)}
                              onDelete={() => handleDelete(v)}
                              disabled={isEditing}
                            />
                          ),
                        )}
                      </div>
                    )}
                  </div>
                )}

                {!hasVariants && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100">
                    <AlertCircle size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700">
                      Toggle <strong>Product has variants</strong> above to start managing sizes,
                      colours or other options for this product.
                    </p>
                  </div>
                )}
              </ScrollShadow>
            </ModalBody>

            <Divider />

            <ModalFooter className="py-3">
              <Button variant="bordered" size="sm" onPress={onClose}>
                Done
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

interface VariantRowProps {
  variant: ProductVariant;
  label: string;
  onEdit: () => void;
  onDelete: () => void;
  disabled: boolean;
}

function VariantRow({ variant, label, onEdit, onDelete, disabled }: VariantRowProps) {
  const hasPrice = !!variant.price_override_usd;
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-default-200 bg-content1 hover:bg-default-50 transition-colors group">
      {/* Color swatch if available */}
      {variant.color && (
        <div
          className="w-5 h-5 rounded-full border border-default-200 flex-shrink-0"
          style={{ background: variant.color.toLowerCase() }}
          title={variant.color}
        />
      )}

      {/* Label */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-default-400">
          {hasPrice ? `$${variant.price_override_usd}` : 'Base price'} &nbsp;·&nbsp; {variant.stock_qty} in stock
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Tooltip content="Edit variant">
          <Button
            isIconOnly
            size="sm"
            variant="light"
            isDisabled={disabled}
            onPress={onEdit}
            aria-label="Edit variant"
          >
            <Edit2 size={14} />
          </Button>
        </Tooltip>
        <Tooltip content="Remove variant" color="danger">
          <Button
            isIconOnly
            size="sm"
            variant="light"
            color="danger"
            isDisabled={disabled}
            onPress={onDelete}
            aria-label="Remove variant"
          >
            <Trash2 size={14} />
          </Button>
        </Tooltip>
      </div>
    </div>
  );
}

interface VariantInlineFormProps {
  form: VariantFormState;
  setField: (key: keyof VariantFormState, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  isNew: boolean;
}

function VariantInlineForm({
  form,
  setField,
  onSave,
  onCancel,
  saving,
  isNew,
}: VariantInlineFormProps) {
  return (
    <div className="p-4 rounded-xl border-2 border-primary-200 bg-primary-50/40 space-y-3">
      <p className="text-xs font-semibold text-primary-700">
        {isNew ? 'New Variant' : 'Edit Variant'}
      </p>
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Size"
          placeholder="e.g. M, L, XL"
          size="sm"
          variant="bordered"
          value={form.size}
          onValueChange={(v) => setField('size', v)}
        />
        <Input
          label="Colour"
          placeholder="e.g. Red, Navy"
          size="sm"
          variant="bordered"
          value={form.color}
          onValueChange={(v) => setField('color', v)}
        />
        <Input
          label="Price (USD)"
          placeholder="Leave blank = base price"
          size="sm"
          variant="bordered"
          type="number"
          startContent={<span className="text-default-400 text-xs">$</span>}
          value={form.priceUsd}
          onValueChange={(v) => setField('priceUsd', v)}
        />
        <Input
          label="Price (KHR)"
          placeholder="Leave blank = base price"
          size="sm"
          variant="bordered"
          type="number"
          value={form.priceKhr}
          onValueChange={(v) => setField('priceKhr', v)}
        />
        <Input
          label="Stock"
          size="sm"
          variant="bordered"
          type="number"
          value={form.stock}
          onValueChange={(v) => setField('stock', v)}
          className="col-span-2"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="light" onPress={onCancel} isDisabled={saving} startContent={<X size={13} />}>
          Cancel
        </Button>
        <Button size="sm" color="primary" onPress={onSave} isLoading={saving} startContent={!saving ? <Check size={13} /> : undefined}>
          {isNew ? 'Add' : 'Save'}
        </Button>
      </div>
    </div>
  );
}
