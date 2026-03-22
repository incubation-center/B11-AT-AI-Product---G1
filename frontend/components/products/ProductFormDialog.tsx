// Feature component — Product Form Dialog
'use client';

import { useEffect, useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Tabs,
  Tab,
  Divider,
  Progress,
} from '@heroui/react';
import type { Product } from '@/lib/products';
import {
  startProductDraft,
  answerProductDraft,
  confirmProductDraft,
  updateProduct,
  uploadProductImage,
} from '@/lib/products';
import { ProductFormGeneralStep } from './product-form-general-step';
import { ProductFormInventoryStep } from './product-form-inventory-step';
import { ProductFormMediaStep } from './product-form-media-step';
import { ProductFormVariantsStep } from './product-form-variants-step';
import { ProductFormAiStep } from './product-form-ai-step';
import type { ProductDraft, AiDraftResponse, AiConfirmResponse } from '@/types';
import { AlertCircle } from 'lucide-react';

interface ProductFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onSaved: (productId?: string) => void;
}

const TABS = {
  GENERAL: 'general',
  INVENTORY: 'inventory',
  MEDIA: 'media',
  VARIANTS: 'variants',
  AI: 'ai',
};

export function ProductFormDialog({
  isOpen,
  onOpenChange,
  product,
  onSaved,
}: ProductFormDialogProps) {
  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [priceUsd, setPriceUsd] = useState('');
  const [priceKhr, setPriceKhr] = useState('');
  const [stock, setStock] = useState('');
  const [lowStock, setLowStock] = useState('');
  const [description, setDescription] = useState('');
  const [trackInventory, setTrackInventory] = useState(true);
  const [hasVariants, setHasVariants] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  // UI State
  const [activeTab, setActiveTab] = useState(TABS.GENERAL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AI Draft State
  const [draft, setDraft] = useState<ProductDraft | null>(null);
  const [aiQuestion, setAiQuestion] = useState<string | null>(null);
  const [aiAnswer, setAiAnswer] = useState('');

  useEffect(() => {
    if (isOpen) {
      resetForm();
      if (product) {
        populateFromProduct(product);
      }
    }
  }, [isOpen, product]);

  const resetForm = () => {
    setError(null);
    setName('');
    setCategory('');
    setPriceUsd('');
    setPriceKhr('');
    setStock('0');
    setLowStock('5');
    setDescription('');
    setTrackInventory(true);
    setHasVariants(false);
    setIsActive(true);
    setImageFiles([]);
    setActiveTab(TABS.GENERAL);
    setDraft(null);
    setAiQuestion(null);
    setAiAnswer('');
  };

  const populateFromProduct = (prod: Product) => {
    setName(prod.name);
    setCategory(prod.category || '');
    setPriceUsd(prod.base_price_usd || '');
    setPriceKhr(prod.base_price_khr || '');
    setStock(prod.stock_qty?.toString() || '0');
    setLowStock(prod.low_stock_threshold?.toString() || '5');
    setDescription(prod.description || '');
    setTrackInventory(prod.track_inventory ?? true);
    setHasVariants(prod.has_variants ?? false);
    setIsActive(prod.is_active ?? true);
  };

  const isGeneralValid =
    name.trim() &&
    category.trim() &&
    priceUsd.trim() &&
    priceKhr.trim() &&
    description.trim();
  const isMediaValid =
    imageFiles.length > 0 || (product?.image_urls?.length ?? 0) > 0;

  const buildPayload = () => ({
    name,
    category: category || undefined,
    description: description || undefined,
    base_price_usd: priceUsd ? parseFloat(priceUsd) : undefined,
    base_price_khr: priceKhr ? parseFloat(priceKhr) : undefined,
    stock_qty: stock ? parseInt(stock, 10) : 0,
    low_stock_threshold: lowStock ? parseInt(lowStock, 10) : 5,
    track_inventory: trackInventory,
    has_variants: hasVariants,
  });

  const handleStartAi = async () => {
    if (!isGeneralValid) {
      setError('Please fill all general product details first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res: AiDraftResponse = await startProductDraft(buildPayload());
      setDraft(res.draft);
      setAiQuestion(res.next_question);
      setAiAnswer('');
      setActiveTab(TABS.AI);

      if (!res.next_question && res.draft?.id) {
        await completeDraft(res.draft.id);
      }
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'Failed to start AI');
    } finally {
      setLoading(false);
    }
  };

  const handleAiAnswer = async () => {
    if (!draft?.id || !aiAnswer.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res: AiDraftResponse = await answerProductDraft({
        draft_id: draft.id,
        answer: aiAnswer.trim(),
      });

      setDraft(res.draft);
      setAiQuestion(res.next_question);
      setAiAnswer('');

      if (!res.next_question && res.draft?.id) {
        await completeDraft(res.draft.id);
      }
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'Failed to answer');
    } finally {
      setLoading(false);
    }
  };

  const completeDraft = async (draftId: string) => {
    try {
      const res: AiConfirmResponse = await confirmProductDraft({
        draft_id: draftId,
      });

      let uploadError: string | null = null;
      if (imageFiles.length > 0 && res.product.id) {
        try {
          for (const file of imageFiles) {
            await uploadProductImage(res.product.id, file);
          }
        } catch (err: unknown) {
          const e = err as Error;
          uploadError = e.message || 'Image upload failed';
        }
      }

      onSaved(res.product.id);
      onOpenChange(false);

      if (uploadError) {
        window.alert(`Saved product, but image failed: ${uploadError}`);
      }
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'Failed to confirm');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    setLoading(true);
    setError(null);

    try {
      const payload = buildPayload();
      await updateProduct(product.id, { ...payload, is_active: isActive });

      let uploadError: string | null = null;
      if (imageFiles.length > 0) {
        try {
          for (const file of imageFiles) {
            await uploadProductImage(product.id, file);
          }
        } catch (err: unknown) {
          const e = err as Error;
          uploadError = e.message || 'Image upload failed';
        }
      }

      onSaved(product.id);
      onOpenChange(false);

      if (uploadError) {
        window.alert(`Saved product, but image failed: ${uploadError}`);
      }
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const isAiMode = activeTab === TABS.AI;
  const progressValue = isAiMode
    ? 100
    : ((Object.keys(TABS).slice(0, 4).indexOf(activeTab) + 1) / 4) * 100;

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="2xl"
      scrollBehavior="inside"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <h2 id="modal-title">
                {product ? 'Edit Product' : 'Create Product'}
              </h2>
              <p
                id="modal-description"
                className="text-default-500 font-normal"
              >
                {product
                  ? 'Update your product details and inventory'
                  : 'Add a new product with AI assistance'}
              </p>
            </ModalHeader>

            <Divider />

            <ModalBody className="py-6">
              {error && (
                <div className="flex gap-3 p-4 rounded-lg bg-danger-50 border border-danger-200">
                  <AlertCircle className="h-5 w-5 text-danger-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-danger-700">{error}</p>
                </div>
              )}

              <Progress
                value={progressValue}
                className="mb-4"
                color={isAiMode ? 'warning' : 'primary'}
                aria-label="Form progress"
              />

              {isAiMode ? (
                <ProductFormAiStep
                  aiQuestion={aiQuestion}
                  aiAnswer={aiAnswer}
                  onAiAnswerChange={setAiAnswer}
                  isLoading={loading}
                  onSubmit={handleAiAnswer}
                />
              ) : (
                <form id="product-form" onSubmit={handleSave}>
                  <Tabs
                    selectedKey={activeTab}
                    onSelectionChange={(k) => setActiveTab(String(k))}
                    aria-label="Product form sections"
                  >
                    <Tab key={TABS.GENERAL} title="General">
                      <ProductFormGeneralStep
                        name={name}
                        onNameChange={setName}
                        category={category}
                        onCategoryChange={setCategory}
                        description={description}
                        onDescriptionChange={setDescription}
                        priceUsd={priceUsd}
                        onPriceUsdChange={setPriceUsd}
                        priceKhr={priceKhr}
                        onPriceKhrChange={setPriceKhr}
                        isLoading={loading}
                      />
                    </Tab>

                    <Tab key={TABS.INVENTORY} title="Inventory">
                      <ProductFormInventoryStep
                        trackInventory={trackInventory}
                        onTrackInventoryChange={setTrackInventory}
                        stock={stock}
                        onStockChange={setStock}
                        lowStock={lowStock}
                        onLowStockChange={setLowStock}
                        isLoading={loading}
                      />
                    </Tab>

                    <Tab key={TABS.MEDIA} title="Media">
                      <ProductFormMediaStep
                        imageFiles={imageFiles}
                        onImageFilesChange={setImageFiles}
                        hasExistingImage={
                          (product?.image_urls?.length ?? 0) > 0
                        }
                        isLoading={loading}
                        isValid={!!isMediaValid}
                      />
                    </Tab>

                    <Tab key={TABS.VARIANTS} title="Variants">
                      <ProductFormVariantsStep
                        hasVariants={hasVariants}
                        onHasVariantsChange={setHasVariants}
                        isLoading={loading}
                      />
                    </Tab>
                  </Tabs>
                </form>
              )}
            </ModalBody>

            <Divider />

            <ModalFooter className="gap-2">
              <Button variant="bordered" onPress={onClose} isDisabled={loading}>
                Cancel
              </Button>

              {!isAiMode && !product && (
                <Button
                  color="primary"
                  onPress={handleStartAi}
                  isLoading={loading}
                  isDisabled={!isGeneralValid}
                >
                  Start AI Review
                </Button>
              )}

              {!isAiMode && product && (
                <Button
                  color="primary"
                  form="product-form"
                  type="submit"
                  isLoading={loading}
                  isDisabled={!isGeneralValid}
                >
                  Save
                </Button>
              )}

              {isAiMode && (
                <Button
                  color="primary"
                  onPress={handleAiAnswer}
                  isLoading={loading}
                  isDisabled={!aiAnswer.trim()}
                >
                  {aiQuestion ? 'Continue' : 'Confirm'}
                </Button>
              )}
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
