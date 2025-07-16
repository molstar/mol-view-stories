import { useEffect, useState, useCallback } from 'react';
import { Input } from './ui/input';

export function StatefulInput({
  id,
  value,
  placeholder,
  onChange,
}: {
  id?: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  const [current, setCurrent] = useState(value);
  useEffect(() => {
    setCurrent(value);
  }, [value]);
  return (
    <Input
      id={id}
      value={current}
      placeholder={placeholder}
      onChange={(e) => {
        setCurrent(e.target.value);
      }}
      onBlur={() => {
        onChange(current);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.currentTarget.blur();
        }
      }}
    />
  );
}

// Immediate update version - changes are applied on every keystroke
export function ImmediateInput({
  id,
  value,
  placeholder,
  onChange,
}: {
  id?: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <Input
      id={id}
      value={value}
      placeholder={placeholder}
      onChange={(e) => {
        onChange(e.target.value);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.currentTarget.blur();
        }
      }}
    />
  );
}

// Debounced version - changes are applied after a short delay
export function DebouncedInput({
  id,
  value,
  placeholder,
  onChange,
  delay = 300,
}: {
  id?: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  delay?: number;
}) {
  const [current, setCurrent] = useState(value);
  
  useEffect(() => {
    setCurrent(value);
  }, [value]);

  // Debounced onChange handler
  const debouncedOnChange = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (newValue: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          onChange(newValue);
        }, delay);
      };
    })(),
    [onChange, delay]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setCurrent(newValue);
    debouncedOnChange(newValue);
  };

  const handleBlur = () => {
    // Immediate update on blur to ensure consistency
    onChange(current);
  };

  return (
    <Input
      id={id}
      value={current}
      placeholder={placeholder}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          onChange(current);
          e.currentTarget.blur();
        }
      }}
    />
  );
}
