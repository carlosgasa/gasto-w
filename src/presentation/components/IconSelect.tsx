import { useEffect, useRef, useState } from "react";
import { Icon, type IconName } from "../icons/Icon";
import "./IconSelect.css";

export interface IconSelectOption {
  value: string;
  label: string;
  icon: IconName;
  color?: string;
}

interface IconSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: IconSelectOption[];
  placeholder?: string;
  disabled?: boolean;
}

export function IconSelect({ value, onChange, options, placeholder, disabled }: IconSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;

    function handlePointer(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div className={`icon-select${disabled ? " is-disabled" : ""}`} ref={rootRef}>
      <button
        type="button"
        className="icon-select-trigger"
        onClick={() => !disabled && setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
      >
        {selected ? (
          <>
            <span className="icon-select-swatch" style={{ background: selected.color ?? "var(--primary)" }}>
              <Icon name={selected.icon} size={14} />
            </span>
            <span className="icon-select-label">{selected.label}</span>
          </>
        ) : (
          <span className="icon-select-placeholder">{placeholder ?? "Elige una opción"}</span>
        )}
        <span className="icon-select-caret" aria-hidden="true" />
      </button>

      {open && (
        <div className="icon-select-menu" role="listbox">
          {options.length === 0 && <div className="icon-select-empty">Sin opciones</div>}
          {options.map((option) => (
            <button
              type="button"
              key={option.value}
              role="option"
              aria-selected={option.value === value}
              className={`icon-select-option${option.value === value ? " is-selected" : ""}`}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              <span className="icon-select-swatch" style={{ background: option.color ?? "var(--primary)" }}>
                <Icon name={option.icon} size={14} />
              </span>
              <span className="icon-select-label">{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
