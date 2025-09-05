// src/components/form/date-picker/index.tsx - Versión mejorada

import { useEffect } from "react";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.css";

import Hook = flatpickr.Options.Hook;
import DateOption = flatpickr.Options.DateOption;
import Label from "./Label";
import { CalenderIcon } from "../../icons";

type PropsType = {
  id: string;
  mode?: "single" | "multiple" | "range" | "time";
  onChange?: Hook | Hook[];
  defaultDate?: DateOption;
  label?: string;
  placeholder?: string;
  disabled?: boolean; // ✅ NUEVA: Prop disabled
  options?: Partial<flatpickr.Options.Options>;
  className?: string;
};

export default function DatePicker({
  id,
  mode,
  onChange,
  label,
  defaultDate,
  placeholder,
  disabled = false, // ✅ NUEVA: Default false
  options = {},
  className = "",
}: PropsType) {
  useEffect(() => {
    // ✅ MEJORADO: Solo inicializar flatpickr si no está disabled
    if (disabled) return;

    const flatPickr = flatpickr(`#${id}`, {
      mode: mode || "single",
      static: true,
      monthSelectorType: "static",
      dateFormat: "Y-m-d",
      defaultDate,
      onChange,
      ...options,
    });

    return () => {
      if (!Array.isArray(flatPickr)) {
        flatPickr.destroy();
      }
    };
  }, [mode, onChange, id, defaultDate, options, disabled]); // ✅ Añadir disabled a deps

  return (
    <div>
      {label && <Label htmlFor={id}>{label}</Label>}

      <div className="relative">
        <input
          id={id}
          placeholder={placeholder}
          disabled={disabled} // ✅ NUEVA: Prop disabled en input
          className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:focus:border-brand-800 ${
            disabled 
              ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800' 
              : ''
          } ${className}`}
        />

        <span className={`absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400 ${
          disabled ? 'opacity-50' : ''
        }`}>
          <CalenderIcon className="size-6" />
        </span>
      </div>
    </div>
  );
}