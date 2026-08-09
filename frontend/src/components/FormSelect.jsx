import React from 'react';

export default function FormSelect({
  label, name, value, onChange, options = [], placeholder = 'Select...', required, error
}) {
  return (
    <div className="mb-4">
      <label htmlFor={name} className="block text-sm font-medium text-text mb-1.5">
        {label} {required && <span className="text-loss">*</span>}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className={`w-full bg-background border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50 ${
          error ? 'border-loss' : 'border-border'
        }`}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-loss mt-1">{error}</p>}
    </div>
  );
}
