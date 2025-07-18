import { Session, StoryItem } from '@/app/state/types';
import { SortField, SortDirection } from './MyStoriesTable';

export function filterItems(items: (Session | StoryItem)[], query: string): (Session | StoryItem)[] {
  if (!query.trim()) return items;
  const lowercaseQuery = query.toLowerCase();
  return items.filter(
    (item) =>
      item.title.toLowerCase().includes(lowercaseQuery) || item.description.toLowerCase().includes(lowercaseQuery)
  );
}

export function sortItems(
  items: (Session | StoryItem)[],
  field: SortField,
  direction: SortDirection
): (Session | StoryItem)[] {
  return [...items].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (field) {
      case 'title':
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
        break;
      case 'created_at':
        aValue = new Date(a.created_at).getTime();
        bValue = new Date(b.created_at).getTime();
        break;
      case 'updated_at':
        aValue = new Date(a.updated_at).getTime();
        bValue = new Date(b.updated_at).getTime();
        break;
      case 'type':
        aValue = a.type;
        bValue = b.type;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

export function getDeleteDialogProps(
  type: 'session' | 'story' | 'all',
  title?: string
): { title: string; description: string; confirmText: string } {
  if (type === 'all') {
    return {
      title: 'Delete All Content',
      description:
        'Are you sure you want to delete ALL your sessions and stories? This action cannot be undone and will permanently remove all your content.',
      confirmText: 'Delete All',
    };
  } else if (type === 'session') {
    return {
      title: 'Delete Session',
      description: `Are you sure you want to delete the session "${title}"? This action cannot be undone.`,
      confirmText: 'Delete Session',
    };
  } else {
    return {
      title: 'Delete State',
      description: `Are you sure you want to delete the state "${title}"? This action cannot be undone.`,
      confirmText: 'Delete State',
    };
  }
}

export function getUsagePercentage(used: number, limit: number): number {
  if (limit === 0) return 0;
  return Math.min((used / limit) * 100, 100);
}

export function getUsageColor(percentage: number): string {
  if (percentage >= 90) return 'bg-red-500';
  if (percentage >= 75) return 'bg-yellow-500';
  return 'bg-green-500';
}
