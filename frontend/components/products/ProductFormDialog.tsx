"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  type Product,
  answerProductDraft,
  confirmProductDraft,
  type ProductDraft,
  startProductDraft,
  updateProduct,
  uploadProductImage,
} from "@/lib/products";

interface ProductFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onSaved: (productId?: string) => void;
}

export function ProductFormDialog({
  isOpen,
  onOpenChange,
  product,
  onSaved,
}: ProductFormDialogProps) {
  const steps = [
    { value: "general", label: "General" },
    { value: "inventory", label: "Inventory" },
    { value: "media", label: "Media" },
    { value: "variants", label: "Variants" },
  ] as const;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<ProductDraft | null>(null);
  const [aiQuestion, setAiQuestion] = useState<string | null>(null);
  const [aiAnswer, setAiAnswer] = useState("");
  const [draftStarted, setDraftStarted] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [priceUsd, setPriceUsd] = useState("");
  const [priceKhr, setPriceKhr] = useState("");
  const [stock, setStock] = useState("");
  const [lowStock, setLowStock] = useState("");
  const [description, setDescription] = useState("");
  const [trackInventory, setTrackInventory] = useState(true);
  const [hasVariants, setHasVariants] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // Image Upload State
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState("general");

  // Populate form when opened
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setDraft(null);
      setAiQuestion(null);
      setAiAnswer("");
      setDraftStarted(false);
      setImageFile(null);
      setActiveTab("general");
      if (product) {
        setName(product.name);
        setCategory(product.category || "");
        setPriceUsd(product.base_price_usd || "");
        setPriceKhr(product.base_price_khr || "");
        setStock(product.stock_qty?.toString() || "0");
        setLowStock(product.low_stock_threshold?.toString() || "5");
        setDescription(product.description || "");
        setTrackInventory(product.track_inventory ?? true);
        setHasVariants(product.has_variants ?? false);
        setIsActive(product.is_active ?? true);
      } else {
        setName("");
        setCategory("");
        setPriceUsd("");
        setPriceKhr("");
        setStock("0");
        setLowStock("5");
        setDescription("");
        setTrackInventory(true);
        setHasVariants(false);
        setIsActive(true);
      }
    }
  }, [isOpen, product]);

  const currentStepIndex = steps.findIndex((step) => step.value === activeTab);
  const isFirstStep = currentStepIndex <= 0;
  const isLastStep = currentStepIndex === steps.length - 1;
  const isGeneralStepValid =
    name.trim().length > 0 &&
    category.trim().length > 0 &&
    priceUsd.trim().length > 0 &&
    priceKhr.trim().length > 0 &&
    description.trim().length > 0;
  const isInventoryStepValid =
    trackInventory ? stock.trim().length > 0 && lowStock.trim().length > 0 : true;
  const isMediaStepValid = imageFile !== null || (product?.image_urls?.length ?? 0) > 0;
  const canAdvance =
    activeTab === "general"
      ? isGeneralStepValid
      : activeTab === "inventory"
        ? isInventoryStepValid
        : activeTab === "media"
          ? isMediaStepValid
          : true;
  const isAiStep = activeTab === "ai";

  const goToPreviousStep = () => {
    if (isFirstStep) return;
    setActiveTab(steps[currentStepIndex - 1].value);
  };

  const goToNextStep = () => {
    if (isLastStep) return;
    setActiveTab(steps[currentStepIndex + 1].value);
  };

  const buildSeedPayload = () => ({
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

  const completeDraftConfirmation = async (currentDraftId: string) => {
    const confirmation = await confirmProductDraft({ draft_id: currentDraftId });
    let imageUploadError: string | null = null;

    if (imageFile && confirmation.product.id) {
      try {
        await uploadProductImage(confirmation.product.id, imageFile);
      } catch (err: unknown) {
        const uploadError = err as Error;
        imageUploadError = uploadError.message || "Image upload failed";
      }
    }

    onSaved(confirmation.product.id);
    onOpenChange(false);

    if (imageUploadError) {
      window.alert(`Product saved, but the image upload failed: ${imageUploadError}`);
    }
  };

  const handleSeedFlowContinue = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await startProductDraft(buildSeedPayload());
      setDraft(response.draft);
      setAiQuestion(response.next_question);
      setAiAnswer("");
      setDraftStarted(true);

      if (response.next_question) {
        setActiveTab("ai");
      } else if (response.draft?.id) {
        await completeDraftConfirmation(response.draft.id);
      }
    } catch (err: unknown) {
      const nextError = err as Error;
      setError(nextError.message || "Failed to start AI draft");
    } finally {
      setLoading(false);
    }
  };

  const handleAiSubmit = async () => {
    if (!draft?.id) return;

    if (aiQuestion && !aiAnswer.trim()) {
      setError("Please answer the AI question before continuing.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await answerProductDraft({
        draft_id: draft.id,
        answer: aiAnswer.trim(),
      });

      setDraft(response.draft);
      setAiQuestion(response.next_question);
      setAiAnswer("");

      if (!response.next_question && response.draft?.id) {
        await completeDraftConfirmation(response.draft.id);
      }
    } catch (err: unknown) {
      const nextError = err as Error;
      setError(nextError.message || "Failed to continue AI draft");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!product) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = buildSeedPayload();
      const currentProductId = product.id;

      await updateProduct(product.id, { ...payload, is_active: isActive });

      let imageUploadError: string | null = null;
      if (imageFile && currentProductId) {
        try {
          await uploadProductImage(currentProductId, imageFile);
        } catch (err: unknown) {
          const uploadError = err as Error;
          imageUploadError = uploadError.message || "Image upload failed";
        }
      }

      onSaved(currentProductId);
      onOpenChange(false);

      if (imageUploadError) {
        window.alert(`Product saved, but the image upload failed: ${imageUploadError}`);
      }
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || "Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] h-[90vh] sm:h-auto flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b shrink-0">
          <DialogTitle className="text-xl font-semibold text-slate-900">
            {product ? "Edit Product" : "New Product"}
          </DialogTitle>
        </DialogHeader>

        <form id="product-form" onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <div className="px-6 pt-4 shrink-0 bg-slate-50/50">
              <div className="mb-4">
                <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  <span>
                    {isAiStep ? "AI Review" : `Step ${currentStepIndex + 1} of ${steps.length}`}
                  </span>
                  <span>{isAiStep ? "Questions" : steps[currentStepIndex]?.label}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-[#002e6b] transition-all duration-300"
                    style={{ width: `${isAiStep ? 100 : ((currentStepIndex + 1) / steps.length) * 100}%` }}
                  />
                </div>
              </div>

              <TabsList className={`grid w-full rounded-xl bg-slate-100 p-1 ${isAiStep ? "grid-cols-1" : "grid-cols-4"}`}>
                {isAiStep ? (
                  <TabsTrigger
                    value="ai"
                    disabled
                    className="rounded-lg text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-[#002e6b] data-[state=active]:shadow-sm"
                  >
                    AI Review
                  </TabsTrigger>
                ) : null}
                {steps.map((step, index) => (
                  <TabsTrigger
                    key={step.value}
                    value={step.value}
                    disabled={isAiStep || index !== currentStepIndex}
                    className="rounded-lg text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-[#002e6b] data-[state=active]:shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {step.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-hide">
              {error && (
                <div className="mb-6 bg-rose-50 text-rose-600 p-4 rounded-xl text-sm border border-rose-100 font-medium">
                  {error}
                </div>
              )}

              <TabsContent value="general" className="m-0 space-y-6 focus-visible:outline-none focus-visible:ring-0">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">Product Name <span className="text-rose-500">*</span></Label>
                    <Input
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Classic White T-Shirt"
                      disabled={loading}
                      className="h-11 rounded-xl bg-slate-50 border-slate-200 focus:border-[#002e6b] focus:ring-[#002e6b]/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">Category</Label>
                    <Input
                      required
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="e.g. Apparel"
                      disabled={loading}
                      className="h-11 rounded-xl bg-slate-50 border-slate-200 focus:border-[#002e6b] focus:ring-[#002e6b]/20"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">Description</Label>
                  <textarea
                    required
                    className="flex min-h-[140px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm ring-offset-background placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#002e6b]/20 focus-visible:border-[#002e6b] disabled:cursor-not-allowed disabled:opacity-50 transition-colors resize-y"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide a detailed description of your product. You can use markdown or rich text features if supported later."
                    disabled={loading}
                  />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">Base Price (USD)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">$</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={priceUsd}
                        onChange={(e) => setPriceUsd(e.target.value)}
                        placeholder="0.00"
                        disabled={loading}
                        className="pl-7 h-11 rounded-xl bg-slate-50 border-slate-200 focus:border-[#002e6b] focus:ring-[#002e6b]/20 text-slate-900"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">Base Price (KHR)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">៛</span>
                      <Input
                        type="number"
                        min="0"
                        required
                        value={priceKhr}
                        onChange={(e) => setPriceKhr(e.target.value)}
                        placeholder="0"
                        disabled={loading}
                        className="pl-8 h-11 rounded-xl bg-slate-50 border-slate-200 focus:border-[#002e6b] focus:ring-[#002e6b]/20 text-slate-900"
                      />
                    </div>
                  </div>
                </div>

                {product && (
                  <div className="pt-4 mt-2 border-t border-slate-100 flex items-center space-x-3">
                    <Checkbox
                      id="isActive"
                      checked={isActive}
                      onCheckedChange={(c) => setIsActive(!!c)}
                      disabled={loading}
                      className="data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                    />
                    <div className="space-y-1 leading-none">
                      <Label htmlFor="isActive" className="text-sm font-semibold text-slate-700 cursor-pointer">
                        Active Product
                      </Label>
                      <p className="text-sm text-slate-500">
                        This product will be hidden from your storefront if deactivated.
                      </p>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="inventory" className="m-0 space-y-6 focus-visible:outline-none focus-visible:ring-0">
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 mb-6">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="trackInventory"
                      checked={trackInventory}
                      onCheckedChange={(c) => setTrackInventory(!!c)}
                      disabled={loading}
                      className="mt-1 data-[state=checked]:bg-[#002e6b] data-[state=checked]:border-[#002e6b]"
                    />
                    <div className="space-y-1">
                      <Label htmlFor="trackInventory" className="text-sm font-semibold text-slate-900 cursor-pointer">
                        Track Inventory
                      </Label>
                      <p className="text-sm text-slate-500 leading-relaxed max-w-xl">
                        When enabled, the system will automatically decrement stock when orders are placed and prevent overselling.
                      </p>
                    </div>
                  </div>
                </div>

                <div className={`grid gap-6 md:grid-cols-2 transition-opacity duration-200 ${!trackInventory ? 'opacity-50 pointer-events-none' : ''}`}>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">Total Stock Quantity</Label>
                    <Input
                      type="number"
                      min="0"
                      required={trackInventory}
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      placeholder="0"
                      disabled={loading || !trackInventory}
                      className="h-11 rounded-xl border-slate-200 focus:border-[#002e6b] focus:ring-[#002e6b]/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">Low Stock Threshold</Label>
                    <Input
                      type="number"
                      min="0"
                      required={trackInventory}
                      value={lowStock}
                      onChange={(e) => setLowStock(e.target.value)}
                      placeholder="5"
                      disabled={loading || !trackInventory}
                      className="h-11 rounded-xl border-slate-200 focus:border-[#002e6b] focus:ring-[#002e6b]/20"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="media" className="m-0 space-y-6 focus-visible:outline-none focus-visible:ring-0">
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-slate-700">Primary Product Image</Label>
                  <label htmlFor="image-upload" className="flex flex-col items-center justify-center w-full h-48 sm:h-64 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100/80 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-10 h-10 mb-3 text-slate-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2" />
                      </svg>
                      {imageFile ? (
                        <p className="mb-2 text-sm text-[#002e6b] font-semibold">{imageFile.name}</p>
                      ) : (
                        <p className="mb-2 text-sm text-slate-500 font-medium"><span className="font-semibold text-[#002e6b]">Click to upload</span> or drag and drop</p>
                      )}
                      <p className="text-xs text-slate-400 font-medium">PNG, JPG or WEBP (MAX. 5MB)</p>
                    </div>
                    <input
                      id="image-upload"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      disabled={loading}
                      onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    />
                  </label>
                  <p className="text-xs text-slate-500 pt-2 px-1">
                    Upload a high-quality, square image (1:1 aspect ratio) for best results. Additional images can be added after saving.
                  </p>
                  {!isMediaStepValid && (
                    <p className="text-sm font-medium text-rose-600">
                      A product image is required before you continue.
                    </p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="variants" className="m-0 space-y-6 focus-visible:outline-none focus-visible:ring-0">
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 flex items-start space-x-3">
                  <Checkbox
                    id="hasVariants"
                    checked={hasVariants}
                    onCheckedChange={(c) => setHasVariants(!!c)}
                    disabled={loading}
                    className="mt-1 data-[state=checked]:bg-[#002e6b] data-[state=checked]:border-[#002e6b]"
                  />
                  <div className="space-y-1">
                    <Label htmlFor="hasVariants" className="text-sm font-semibold text-slate-900 cursor-pointer">
                      This product has multiple options, like different sizes or colors
                    </Label>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      Enable this to configure options and set specific stock/prices for each individual variant.
                    </p>
                  </div>
                </div>

                {hasVariants ? (
                  <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-xl bg-slate-50/50">
                    <p className="text-sm text-slate-500 mb-4 text-center">
                      Variant matrix generation will be available after creating the initial product structure. Save to continue.
                    </p>
                  </div>
                ) : null}
              </TabsContent>

              <TabsContent value="ai" className="m-0 space-y-6 focus-visible:outline-none focus-visible:ring-0">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#002e6b]">
                    AI Product Draft
                  </p>
                  <p className="text-sm leading-relaxed text-slate-600">
                    This follows the same flow as Telegram: seed details first, then one AI follow-up question at a time, then final confirmation creates the product.
                  </p>
                </div>

                {aiQuestion ? (
                  <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
                    <div>
                      <p className="mb-2 text-sm font-semibold text-slate-900">Current AI question</p>
                      <p className="text-sm leading-relaxed text-slate-600">{aiQuestion}</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700">Your answer</Label>
                      <textarea
                        className="flex min-h-[140px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm ring-offset-background placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#002e6b]/20 focus-visible:border-[#002e6b] disabled:cursor-not-allowed disabled:opacity-50 transition-colors resize-y"
                        value={aiAnswer}
                        onChange={(event) => setAiAnswer(event.target.value)}
                        placeholder="Answer the AI follow-up question here"
                        disabled={loading}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                    <p className="text-sm font-medium text-emerald-700">
                      The draft is ready. Confirming will create the product and variants.
                    </p>
                  </div>
                )}
              </TabsContent>
            </div>

            <div className="p-6 shrink-0 bg-white border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                  className="font-medium text-slate-600 hover:text-slate-900 rounded-xl h-11 px-6 hover:bg-slate-100"
                >
                  Cancel
                </Button>

                {!isFirstStep && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={goToPreviousStep}
                    disabled={loading || isAiStep}
                    className="h-11 rounded-xl px-6 font-medium"
                  >
                    Back
                  </Button>
                )}
              </div>

              <Button
                type="button"
                onClick={
                  isAiStep
                    ? handleAiSubmit
                    : isLastStep
                      ? product
                        ? () => {
                            const form = document.getElementById("product-form");
                            if (form instanceof HTMLFormElement) {
                              form.requestSubmit();
                            }
                          }
                        : handleSeedFlowContinue
                      : goToNextStep
                }
                disabled={
                  loading ||
                  (!isAiStep && !isLastStep && !canAdvance) ||
                  (isAiStep && !!aiQuestion && !aiAnswer.trim())
                }
                className="font-semibold px-8 h-11 rounded-xl bg-[#002e6b] hover:bg-[#003d8f] text-white shadow-sm transition-all"
              >
                {isAiStep
                  ? loading
                    ? "Processing..."
                    : aiQuestion
                      ? "Continue AI"
                      : "Confirm Product"
                  : isLastStep
                    ? loading
                      ? "Saving..."
                      : product
                        ? "Save Product"
                        : draftStarted
                          ? "Continue"
                          : "Start AI Review"
                    : "Next"}
              </Button>
            </div>
          </Tabs>
        </form>
      </DialogContent>
    </Dialog>
  );
}
