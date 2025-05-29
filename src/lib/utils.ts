import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export class SingleTaskQueue {
  private queue: (() => Promise<void>)[] = [];

  run(fn: () => Promise<void>) {
    if (this.queue.length < 2) {
      this.queue.push(fn);
    } else {
      this.queue[this.queue.length - 1] = fn;
    }
    if (this.queue.length === 1) {
      this.next();
    }
  }

  private async next() {
    while (this.queue.length > 0) {
      try {
        const fn = this.queue[0];
        await fn();
      } catch (e) {
        console.error('Error in SingleTaskQueue execution:', e);
      } finally {
        this.queue.shift();
      }
    }
  }
}
