"use client";

import { useCallback } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/stores";
import { updateNodeCredential, updateNodeConfig } from "@/stores/agentBuilderSlice";

export function useNodeConfig(nodeId: string, onClose: () => void) {
  const dispatch = useDispatch<AppDispatch>();

  const save = useCallback(
    (config: Record<string, any>, credentialId?: string | null) => {
      if (credentialId !== undefined) {
        dispatch(updateNodeCredential({ id: nodeId, credentialId }));
      }
      dispatch(updateNodeConfig({ id: nodeId, config }));
      onClose();
    },
    [nodeId, dispatch, onClose],
  );

  return { save };
}