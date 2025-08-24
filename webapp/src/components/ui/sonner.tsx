'use client';

import { useTheme } from 'next-themes';
import { Toaster as Sonner, ToasterProps } from 'sonner';

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className='toaster group'
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          // Custom style for description text to make it more readable
          '--description-text': 'var(--foreground)',
        } as React.CSSProperties
      }
      toastOptions={{
        style: {
          // Make description text darker and more readable
          '--description-color': 'var(--foreground)',
        } as React.CSSProperties,
        classNames: {
          description: 'text-foreground opacity-90 font-medium',
          actionButton: 'action-button-below',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
