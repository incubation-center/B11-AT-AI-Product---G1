// Feature component — Product Form AI Step
'use client';

import { Input, Spinner } from '@heroui/react';
import { AlertCircle, Zap } from 'lucide-react';

interface ProductFormAiStepProps {
  aiQuestion: string | null;
  aiAnswer: string;
  onAiAnswerChange: (value: string) => void;
  isLoading: boolean;
  onSubmit: () => void;
}

export function ProductFormAiStep({
  aiQuestion,
  aiAnswer,
  onAiAnswerChange,
  isLoading,
}: ProductFormAiStepProps) {
  return (
    <div className="space-y-6">
      {/* AI Review Header */}
      <div className="rounded-lg border border-default-300 bg-default-50 p-5 flex items-start gap-3">
        <Zap className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-default-900">
            AI-Powered Product Review
          </p>
          <p className="text-xs text-default-600 mt-1">
            Answer a few quick questions to help our AI system optimize your
            product listing for better visibility and sales.
          </p>
        </div>
      </div>

      {/* Question & Answer */}
      {aiQuestion ? (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-4">
            <p className="text-sm font-medium text-default-900">{aiQuestion}</p>
          </div>
          <Input
            placeholder="Type your answer here..."
            aria-label="Answer to AI question"
            value={aiAnswer}
            onValueChange={onAiAnswerChange}
            isDisabled={isLoading}
            variant="bordered"
            radius="lg"
            size="lg"
            endContent={isLoading && <Spinner size="sm" color="current" />}
            classNames={{
              input: 'text-sm',
            }}
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8">
          <Spinner
            size="lg"
            color="current"
            label="Processing your product..."
          />
          <p className="text-sm text-default-500 mt-4">
            This may take a few moments...
          </p>
        </div>
      )}

      {/* Warning if no answer */}
      {aiQuestion && !aiAnswer.trim() && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-700">
            Please answer the question to continue.
          </p>
        </div>
      )}
    </div>
  );
}
