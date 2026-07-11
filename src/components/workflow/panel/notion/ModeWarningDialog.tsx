"use client";

import { Button } from "@/components/ui/button";

type LossyConversionDialogProps = {
  unsupportedFeatures: string[];
  onCancel: () => void;
  onConvertAnyway: () => void;
};

type UnsupportedTransitionDialogProps = {
  unsupportedFeatures: string[];
  onStay: () => void;
  onSwitchAnyway: () => void;
};

export function LossyConversionDialog({
  unsupportedFeatures,
  onCancel,
  onConvertAnyway,
}: LossyConversionDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl border border-[#E7E7E7] p-5 max-w-sm w-full mx-3">
        <h3 className="text-sm font-semibold text-[#111827] mb-2">
          Some content will be simplified
        </h3>
        <p className="text-xs text-[#6B7280] mb-3">
          The following features will be simplified or lost:
        </p>
        <ul className="text-xs text-[#6B7280] space-y-1 mb-4 list-disc pl-4">
          {unsupportedFeatures.map((f, i) => (
            <li key={i}>{f}</li>
          ))}
        </ul>
        <div className="flex gap-2">
          <Button
            onClick={onCancel}
            className="flex-1 rounded-xl text-xs"
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            onClick={onConvertAnyway}
            className="flex-1 rounded-xl text-xs"
          >
            Convert anyway
          </Button>
        </div>
      </div>
    </div>
  );
}

export function UnsupportedTransitionDialog({
  unsupportedFeatures,
  onStay,
  onSwitchAnyway,
}: UnsupportedTransitionDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl border border-[#E7E7E7] p-5 max-w-sm w-full mx-3">
        <h3 className="text-sm font-semibold text-[#111827] mb-2">
          This conversion is not supported
        </h3>
        <p className="text-xs text-[#6B7280] mb-3">
          This content cannot be converted to the selected format.
        </p>
        <ul className="text-xs text-[#6B7280] space-y-1 mb-4 list-disc pl-4">
          {unsupportedFeatures.map((f, i) => (
            <li key={i}>{f}</li>
          ))}
        </ul>
        <div className="flex gap-2">
          <Button
            onClick={onStay}
            className="flex-1 rounded-xl text-xs"
            variant="outline"
          >
            Stay in current mode
          </Button>
          <Button
            onClick={onSwitchAnyway}
            className="flex-1 rounded-xl text-xs"
          >
            Switch anyway
          </Button>
        </div>
      </div>
    </div>
  );
}
