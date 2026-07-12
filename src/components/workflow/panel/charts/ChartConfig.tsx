"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";
import { useNodeConfig } from "@/hooks/useNodeConfig";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "@/components/ui/combobox";
import { CredentialForm } from "@/components/workflow/panel/CredentialForm";
import { getCredentialSchema } from "@/lib/credentials/credentialSchemas";
import type { CredentialMetadata } from "@/lib/credentials/types";

const CHART_TYPE_OPTIONS = [
  { value: "pie", label: "Pie", icon: "◔" },
  { value: "doughnut", label: "Doughnut", icon: "◕" },
  { value: "line", label: "Line", icon: "╱" },
  { value: "bar", label: "Bar", icon: "▯" },
  { value: "radar", label: "Radar", icon: "⬡" },
  { value: "polarArea", label: "Polar Area", icon: "◎" },
  { value: "bubble", label: "Bubble", icon: "⬤" },
] as const;

const SIMPLE_CHART_TYPES = new Set(["pie", "doughnut", "radar", "polarArea"]);
const MULTI_DATASET_CHART_TYPES = new Set(["line", "bar"]);
const BUBBLE_CHART_TYPE = "bubble";

export function ChartConfig({
  nodeId,
  credentialId: existingCredentialId,
  config: existingConfig,
  credentials: externalCredentials,
  loading: externalLoading,
  onClose,
}: {
  nodeId: string;
  credentialId: string | null | undefined;
  config: Record<string, any>;
  credentials: CredentialMetadata[];
  loading: boolean;
  onClose: () => void;
}) {
  const { save } = useNodeConfig(nodeId, onClose);

  const [chartType, setChartType] = useState(existingConfig?.chartType || "pie");
  const [creds, setCreds] = useState<CredentialMetadata[]>(externalCredentials);
  const [selectedId, setSelectedId] = useState<string | null>(existingCredentialId || null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(externalLoading);
  const [localConfig, setLocalConfig] = useState<Record<string, any>>({
    ...existingConfig,
  });

  useEffect(() => {
    setLoading(true);
    fetch("/api/credentials?provider=quickchart")
      .then((r) => r.json())
      .then((data) => {
        const filtered = (data.credentials || []).filter(
          (c: CredentialMetadata) =>
            c.provider === "quickchart" && c.authMethod === "apiKey",
        );
        setCreds(filtered);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleChange = useCallback((key: string, value: any) => {
    setLocalConfig((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = useCallback(() => {
    const config = {
      ...localConfig,
      chartType,
    };
    save(config, selectedId);
  }, [localConfig, chartType, selectedId, save]);

  const selectedCred = creds.find((c) => c._id === selectedId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <Label className="text-[13px] font-semibold text-[#111827]">
          QuickChart API Key
          <span className="text-[11px] font-normal text-[#6B7280] ml-1">(optional)</span>
        </Label>
        <Combobox
          value={selectedId || ""}
          onValueChange={(val) => setSelectedId(val || null)}
        >
          <ComboboxInput
            placeholder="No API key (rate limited)"
            className="w-full rounded-xl bg-[#F5F5F5] border-[#E7E7E7]"
          />
          <ComboboxContent>
            <ComboboxList>
              {loading && <div className="p-2 text-sm text-[#6B7280]">Loading...</div>}
              <ComboboxEmpty>No credentials found</ComboboxEmpty>
              {creds.map((c) => (
                <ComboboxItem key={c._id} value={c._id}>
                  <div className="flex flex-col">
                    <span>{c.name}</span>
                  </div>
                  <Badge
                    variant={c.status === "active" ? "default" : "destructive"}
                    className="ml-auto text-[10px]"
                  >
                    {c.status}
                  </Badge>
                </ComboboxItem>
              ))}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>

        {selectedCred && (
          <div className="flex items-center gap-2 text-xs text-[#6B7280] mt-1">
            <Badge variant="outline" className="text-[10px] rounded-full">quickchart</Badge>
            <span>API Key</span>
          </div>
        )}

        {!selectedId && (
          <div className="flex items-start gap-2 mt-1 p-2 rounded-lg bg-[#FEF3C7] border border-[#FDE68A]">
            <AlertCircle size={14} className="text-[#F59E0B] shrink-0 mt-0.5" />
            <p className="text-[11px] text-[#92400E] leading-relaxed">
              Without an API key you may experience rate limiting on the free QuickChart tier.{" "}
              <a
                href="https://quickchart.io/pricing"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-medium"
              >
                Learn more
              </a>
            </p>
          </div>
        )}

        {!showCreateForm ? (
          <Button
            variant="outline"
            size="sm"
            className="w-full rounded-xl mt-1"
            onClick={() => setShowCreateForm(true)}
          >
            Add QuickChart API Key
          </Button>
        ) : (
          <CredentialForm
            schema={getCredentialSchema("quickchart" as any, "apiKey" as any)!}
            onCreated={(id) => {
              setShowCreateForm(false);
              setSelectedId(id);
              setCreds((prev) => [...prev, { _id: id } as CredentialMetadata]);
            }}
            onCancel={() => setShowCreateForm(false)}
          />
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-[13px] font-semibold text-[#111827]">Chart Type</Label>
        <div className="flex flex-wrap gap-2">
          {CHART_TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setChartType(opt.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                chartType === opt.value
                  ? "bg-[#5B5CEB] text-white border-[#5B5CEB]"
                  : "bg-white text-[#374151] border-[#E7E7E7] hover:border-[#5B5CEB]"
              }`}
            >
              <span>{opt.icon}</span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-[13px] font-semibold text-[#111827]">Title</Label>
        <Input
          value={localConfig.title || ""}
          onChange={(e) => handleChange("title", e.target.value)}
          placeholder="My Chart"
          className="rounded-xl bg-[#F5F5F5] border-[#E7E7E7] focus:bg-white focus:ring-2 focus:ring-[rgba(91,92,235,0.15)]"
        />
      </div>

      {SIMPLE_CHART_TYPES.has(chartType) && (
        <>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-semibold text-[#111827]">Labels (JSON array)</Label>
            <Textarea
              value={localConfig.labels || ""}
              onChange={(e) => handleChange("labels", e.target.value)}
              placeholder='["Q1", "Q2", "Q3", "Q4"]'
              rows={2}
              className="min-h-[50px] resize-y rounded-xl bg-[#F5F5F5] border-[#E7E7E7] font-mono text-sm focus:bg-white focus:ring-2 focus:ring-[rgba(91,92,235,0.15)]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-semibold text-[#111827]">Data (JSON array)</Label>
            <Textarea
              value={localConfig.data || ""}
              onChange={(e) => handleChange("data", e.target.value)}
              placeholder="[30, 50, 20, 40]"
              rows={2}
              className="min-h-[50px] resize-y rounded-xl bg-[#F5F5F5] border-[#E7E7E7] font-mono text-sm focus:bg-white focus:ring-2 focus:ring-[rgba(91,92,235,0.15)]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-semibold text-[#111827]">
              Colors (optional, JSON array)
            </Label>
            <Textarea
              value={localConfig.colors || ""}
              onChange={(e) => handleChange("colors", e.target.value)}
              placeholder='["#FF6384", "#36A2EB", "#FFCE56"]'
              rows={2}
              className="min-h-[50px] resize-y rounded-xl bg-[#F5F5F5] border-[#E7E7E7] font-mono text-sm focus:bg-white focus:ring-2 focus:ring-[rgba(91,92,235,0.15)]"
            />
          </div>
        </>
      )}

      {MULTI_DATASET_CHART_TYPES.has(chartType) && (
        <>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-semibold text-[#111827]">Labels (JSON array)</Label>
            <Textarea
              value={localConfig.labels || ""}
              onChange={(e) => handleChange("labels", e.target.value)}
              placeholder='["Jan", "Feb", "Mar"]'
              rows={2}
              className="min-h-[50px] resize-y rounded-xl bg-[#F5F5F5] border-[#E7E7E7] font-mono text-sm focus:bg-white focus:ring-2 focus:ring-[rgba(91,92,235,0.15)]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-semibold text-[#111827]">Datasets (JSON array of {label, data})</Label>
            <Textarea
              value={localConfig.datasets || ""}
              onChange={(e) => handleChange("datasets", e.target.value)}
              placeholder='[{"label": "Sales", "data": [30, 50, 20]}, {"label": "Expenses", "data": [20, 30, 40]}]'
              rows={3}
              className="min-h-[80px] resize-y rounded-xl bg-[#F5F5F5] border-[#E7E7E7] font-mono text-sm focus:bg-white focus:ring-2 focus:ring-[rgba(91,92,235,0.15)]"
            />
          </div>
        </>
      )}

      {chartType === "bubble" && (
        <div className="flex flex-col gap-1.5">
          <Label className="text-[13px] font-semibold text-[#111827]">Data (JSON array of {x, y, r})</Label>
          <Textarea
            value={localConfig.data || ""}
            onChange={(e) => handleChange("data", e.target.value)}
            placeholder='[{"x": 10, "y": 20, "r": 5}, {"x": 15, "y": 10, "r": 8}]'
            rows={3}
            className="min-h-[80px] resize-y rounded-xl bg-[#F5F5F5] border-[#E7E7E7] font-mono text-sm focus:bg-white focus:ring-2 focus:ring-[rgba(91,92,235,0.15)]"
          />
        </div>
      )}

      {chartType === "line" || chartType === "bar" ? null : (
        chartType !== "bubble" && !SIMPLE_CHART_TYPES.has(chartType) ? null : null
      )}

      <div className="flex flex-col gap-1.5">
        <Label className="text-[13px] font-semibold text-[#111827]">Dataset Label</Label>
        <Input
          value={localConfig.datasetLabel || ""}
          onChange={(e) => handleChange("datasetLabel", e.target.value)}
          placeholder="Values"
          className="rounded-xl bg-[#F5F5F5] border-[#E7E7E7] focus:bg-white focus:ring-2 focus:ring-[rgba(91,92,235,0.15)]"
        />
      </div>

      <div className="flex gap-3">
        <div className="flex flex-col gap-1.5 flex-1">
          <Label className="text-[13px] font-semibold text-[#111827]">Width</Label>
          <Input
            type="number"
            value={localConfig.width ?? 600}
            onChange={(e) => handleChange("width", parseInt(e.target.value) || 600)}
            className="rounded-xl bg-[#F5F5F5] border-[#E7E7E7] focus:bg-white focus:ring-2 focus:ring-[rgba(91,92,235,0.15)]"
          />
        </div>
        <div className="flex flex-col gap-1.5 flex-1">
          <Label className="text-[13px] font-semibold text-[#111827]">Height</Label>
          <Input
            type="number"
            value={localConfig.height ?? 400}
            onChange={(e) => handleChange("height", parseInt(e.target.value) || 400)}
            className="rounded-xl bg-[#F5F5F5] border-[#E7E7E7] focus:bg-white focus:ring-2 focus:ring-[rgba(91,92,235,0.15)]"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button onClick={handleSave} className="flex-1 rounded-xl bg-[#5B5CEB] hover:bg-[#4C4DDA] text-white">
          Save
        </Button>
        <Button variant="ghost" onClick={onClose} className="rounded-xl text-[#6B7280] hover:text-[#111827] hover:bg-[#F5F5F5]">
          Cancel
        </Button>
      </div>
    </div>
  );
}
