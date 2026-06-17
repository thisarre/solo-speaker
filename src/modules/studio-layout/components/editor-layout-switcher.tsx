"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { editorLayoutPresets } from "../editor-layout-presets";
import type { EditorLayoutPreset } from "../types";

const presets = Object.keys(editorLayoutPresets) as EditorLayoutPreset[];

export function EditorLayoutSwitcher({
  onReset,
  onSelect,
  value
}: {
  onReset: () => void;
  onSelect: (preset: EditorLayoutPreset) => void;
  value: EditorLayoutPreset;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="flex items-center gap-2">
        <span className="hidden font-mono text-[10.5px] uppercase tracking-[.12em] text-faint lg:inline">Disposition</span>
        <select
          className="studio-input h-8 rounded-[8px] border border-border bg-surface px-2.5 text-[12.5px] text-foreground outline-none focus:border-accent"
          onChange={(event) => onSelect(event.target.value as EditorLayoutPreset)}
          value={value}
        >
          {presets.map((preset) => (
            <option key={preset} value={preset}>
              {editorLayoutPresets[preset].label}
            </option>
          ))}
        </select>
      </label>
      <Button aria-label="Réinitialiser la disposition" onClick={onReset} size="icon" title="Réinitialiser la disposition" type="button" variant="quiet">
        <RotateCcw className="size-4" />
      </Button>
    </div>
  );
}
