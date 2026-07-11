"use client";

import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ToolConfigField, AuthMethod } from "@/lib/workflow-tools/types";

type ToolConfigFormProps = {
  fields: ToolConfigField[];
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
  authMethods?: AuthMethod[];
  selectedAuth?: string;
  onAuthChange?: (key: string) => void;
};

export function ToolConfigForm({
  fields,
  values,
  onChange,
  authMethods,
  selectedAuth,
  onAuthChange,
}: ToolConfigFormProps) {
  const visibleFields = authMethods && selectedAuth
    ? fields.filter((f) => !f.authGroup || f.authGroup === selectedAuth)
    : fields;

  return (
    <div className="flex flex-col gap-4">
      {authMethods && authMethods.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold text-[#111827]">Auth Method</label>
          <Select
            value={selectedAuth || authMethods[0]?.key || ""}
            onValueChange={(v) => onAuthChange?.(v)}
          >
            <SelectTrigger className="w-full rounded-xl bg-[#F5F5F5] border-[#E7E7E7]">
              <SelectValue placeholder="Select auth method" />
            </SelectTrigger>
            <SelectContent>
              {authMethods.map((m) => (
                <SelectItem key={m.key} value={m.key}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {authMethods.find((m) => m.key === selectedAuth)?.description && (
            <p className="text-xs text-[#6B7280]">
              {authMethods.find((m) => m.key === selectedAuth)?.description}
            </p>
          )}
        </div>
      )}

      {visibleFields.map((field) => (
        <FieldRenderer
          key={field.key}
          field={field}
          value={values[field.key] ?? field.defaultValue ?? ""}
          onChange={(v) => onChange(field.key, v)}
        />
      ))}
    </div>
  );
}

function FieldRenderer({
  field,
  value,
  onChange,
}: {
  field: ToolConfigField;
  value: any;
  onChange: (v: any) => void;
}) {
  switch (field.type) {
    case "boolean":
      return (
        <div className="flex items-center justify-between gap-2">
          <label className="text-[13px] font-semibold text-[#111827]">{field.label}</label>
          <Switch
            checked={!!value}
            onCheckedChange={(v) => onChange(v)}
            size="sm"
          />
        </div>
      );

    case "select":
      return (
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold text-[#111827]">{field.label}</label>
          <Select
            value={String(value)}
            onValueChange={(v) => onChange(v)}
          >
            <SelectTrigger className="w-full rounded-xl bg-[#F5F5F5] border-[#E7E7E7]">
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {field.description && (
            <p className="text-xs text-[#6B7280]">{field.description}</p>
          )}
        </div>
      );

    case "password":
      return (
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold text-[#111827]">{field.label}</label>
          <Input
            type="password"
            placeholder={field.placeholder}
            value={String(value)}
            onChange={(e) => onChange(e.target.value)}
            className="rounded-xl bg-[#F5F5F5] border-[#E7E7E7] focus:bg-white focus:ring-2 focus:ring-[rgba(91,92,235,0.15)]"
          />
          {field.description && (
            <p className="text-xs text-[#6B7280]">{field.description}</p>
          )}
        </div>
      );

    case "number":
      return (
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold text-[#111827]">{field.label}</label>
          <Input
            type="number"
            placeholder={field.placeholder}
            value={value === undefined || value === null ? "" : String(value)}
            onChange={(e) => onChange(e.target.value === "" ? field.defaultValue : Number(e.target.value))}
            className="rounded-xl bg-[#F5F5F5] border-[#E7E7E7] focus:bg-white focus:ring-2 focus:ring-[rgba(91,92,235,0.15)]"
          />
          {field.description && (
            <p className="text-xs text-[#6B7280]">{field.description}</p>
          )}
        </div>
      );

    default:
      return (
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold text-[#111827]">{field.label}</label>
          <Input
            type={field.type === "url" ? "url" : "text"}
            placeholder={field.placeholder}
            value={String(value)}
            onChange={(e) => onChange(e.target.value)}
            className="rounded-xl bg-[#F5F5F5] border-[#E7E7E7] focus:bg-white focus:ring-2 focus:ring-[rgba(91,92,235,0.15)]"
          />
          {field.description && (
            <p className="text-xs text-[#6B7280]">{field.description}</p>
          )}
        </div>
      );
  }
}
