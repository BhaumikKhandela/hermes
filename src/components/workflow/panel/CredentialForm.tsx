"use client";

import { useCallback, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import type { CredentialSchema } from "@/lib/credentials/credentialSchemas";

type CredentialFormProps = {
  schema: CredentialSchema;
  onCreated: (credentialId: string) => void;
  onCancel: () => void;
};

export function CredentialForm({ schema, onCreated, onCancel }: CredentialFormProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [name, setName] = useState("");
  const [providerAccountId, setProviderAccountId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleChange = useCallback((key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    setError("");
    const missing = schema.fields.filter((f) => f.required && !values[f.key]);
    if (missing.length > 0) {
      setError(`Required fields: ${missing.map((f) => f.label).join(", ")}`);
      return;
    }
    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: schema.provider,
          authMethod: schema.authMethod,
          name: name.trim(),
          providerAccountId: providerAccountId.trim() || undefined,
          payload: values,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      onCreated(data.credential._id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }, [values, name, providerAccountId, schema, onCreated]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label>Credential Name</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. OpenAI Production"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Account Identifier (optional)</Label>
        <Input
          value={providerAccountId}
          onChange={(e) => setProviderAccountId(e.target.value)}
          placeholder="e.g. user@gmail.com"
        />
      </div>

      <Separator />

      {schema.fields.map((field) => (
        <div key={field.key} className="flex flex-col gap-1.5">
          <Label>{field.label}</Label>
          <Input
            type={field.type === "password" ? "password" : field.type === "number" ? "number" : "text"}
            placeholder={field.placeholder}
            value={values[field.key] || ""}
            onChange={(e) => handleChange(field.key, e.target.value)}
          />
        </div>
      ))}

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={saving} className="flex-1">
          {saving && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
          Create Credential
        </Button>
        <Button variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
