import React from 'react';

export default function FormField({
  label, name, value, onChange, type = 'text', placeholder, required, error, step, min
}) {
  return (
    <div className="mb-4">
      <label htmlFor={name} className="block text-sm font-medium text-text mb-1.5">
        {label} {required && <span className="text-loss">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        step={step}
        min={min}
        className={`w-full bg-background border rounded-lg px-3 py-2 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 ${
          error ? 'border-loss' : 'border-border'
        }`}
      />
      {error && <p className="text-xs text-loss mt-1">{error}</p>}
    </div>
  );
}
