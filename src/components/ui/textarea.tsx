import * as React from 'react';

import {cn} from '../../lib/utils';

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
  ({className, ...props}, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[40px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-none overflow-hidden', // Added resize-none and overflow-hidden
          className
        )}
        ref={ref}
        rows={1} // Default to 1 row
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export {Textarea};
