"use client";

import { type ChangeEvent, type FocusEvent, useState } from "react";

type ProviderComboboxProps = {
  id: string;
  options: string[];
  disabled?: boolean;
  value?: string;
  defaultValue?: string;
  name?: string;
  label?: string;
  hideLabel?: boolean;
  inputClassName?: string;
  onChange?: (value: string) => void;
  onFocus?: () => void;
};

export function ProviderCombobox({
  id,
  options,
  disabled,
  value,
  defaultValue = "",
  name = "provider",
  label = "Provider",
  hideLabel,
  inputClassName = "min-h-12 w-full rounded-md border-0 bg-gray-100 px-4 text-base font-medium normal-case tracking-normal text-foreground shadow-none placeholder:text-gray-500 focus:border-2 focus:border-blue-500 focus:bg-white disabled:cursor-not-allowed disabled:opacity-70",
  onChange,
  onFocus
}: ProviderComboboxProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const currentValue = value ?? internalValue;
  const normalizedValue = currentValue.trim().toLowerCase();
  const suggestions = options.filter((option) => {
    const normalizedOption = option.toLowerCase();
    return normalizedOption !== normalizedValue && (!normalizedValue || normalizedOption.includes(normalizedValue));
  }).slice(0, 5);
  const showSuggestions = !disabled && isOpen && suggestions.length > 0;

  function setProvider(nextValue: string) {
    if (value === undefined) setInternalValue(nextValue);
    onChange?.(nextValue);
  }

  const closeOnBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setIsOpen(false);
  };

  const input = <input
    id={id}
    name={name}
    aria-label={hideLabel ? label : undefined}
    value={currentValue}
    autoComplete="off"
    disabled={disabled}
    onFocus={() => {
      onFocus?.();
      setIsOpen(true);
    }}
    onChange={(event: ChangeEvent<HTMLInputElement>) => {
      setProvider(event.target.value);
      setIsOpen(true);
    }}
    className={inputClassName}
  />;

  return <div className="relative" onBlur={closeOnBlur}>
    {hideLabel ? input : <label className="grid gap-2 text-xs font-extrabold uppercase tracking-wide text-foreground" htmlFor={id}>
      {label}
      <input
        id={id}
        name={name}
        value={currentValue}
        autoComplete="off"
        disabled={disabled}
        onFocus={() => {
          onFocus?.();
          setIsOpen(true);
        }}
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          setProvider(event.target.value);
          setIsOpen(true);
        }}
        className={inputClassName}
      />
    </label>}
    {showSuggestions ? <div className="absolute z-20 mt-1 grid max-h-48 w-full overflow-auto rounded-md border border-gray-200 bg-white p-1 shadow-lg">
      {suggestions.map((option) => <button key={option} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => { setProvider(option); setIsOpen(false); }} className="rounded px-3 py-2 text-left text-sm font-bold text-foreground hover:bg-blue-50">{option}</button>)}
    </div> : null}
  </div>;
}
