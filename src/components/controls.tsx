import { useEffect, useState } from 'react';
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
