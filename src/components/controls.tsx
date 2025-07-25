import { useEffect, useState, useCallback, useRef } from 'react';
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
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setCurrent(value);
  }, [value]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setCurrent(newValue);

      // Clear previous timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        onChange(newValue);
      }, delay);
    },
    [onChange, delay]
  );

  const handleBlur = useCallback(() => {
    // Immediate update on blur to ensure consistency
    onChange(current);
  }, [onChange, current]);

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
