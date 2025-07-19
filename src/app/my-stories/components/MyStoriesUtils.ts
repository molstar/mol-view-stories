import { SessionItem, StoryItem } from '@/app/state/types';
import { SortField, SortDirection } from './MyStoriesTable';

export function filterItems(items: (SessionItem | StoryItem)[], query: string): (SessionItem | StoryItem)[] {
  if (!query.trim()) return items;
  const lowercaseQuery = query.toLowerCase();
  return items.filter(
    (item) =>
      item.title.toLowerCase().includes(lowercaseQuery) || item.description.toLowerCase().includes(lowercaseQuery)
  );
}

export function sortItems(
  items: (SessionItem | StoryItem)[],
  field: SortField,
  direction: SortDirection
): (SessionItem | StoryItem)[] {
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
      default:
        return 0;
    }

    if (aValue < bValue) return direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

export function getDeleteDialogProps(
  type: 'session' | 'story' | 'all' | 'all-sessions' | 'all-stories',
  title?: string,
  count?: number
): { title: string; description: string; confirmText: string } {
  if (type === 'all') {
    return {
      title: 'Delete All Content',
      description:
        'Are you sure you want to delete ALL your sessions and stories? This action cannot be undone and will permanently remove all your content.',
      confirmText: 'Delete All',
    };
  } else if (type === 'all-sessions') {
    const sessionCount = count || 0;
    return {
      title: 'Delete All Sessions',
      description: `Are you sure you want to delete ALL ${sessionCount} session${sessionCount === 1 ? '' : 's'}? This action cannot be undone and will permanently remove all your sessions.`,
      confirmText: 'Delete All Sessions',
    };
  } else if (type === 'all-stories') {
    const storyCount = count || 0;
    return {
      title: 'Delete All Stories',
      description: `Are you sure you want to delete ALL ${storyCount} stor${storyCount === 1 ? 'y' : 'ies'}? This action cannot be undone and will permanently remove all your stories.`,
      confirmText: 'Delete All Stories',
    };
  } else if (type === 'session') {
    return {
      title: 'Delete Session',
      description: `Are you sure you want to delete the session "${title}"? This action cannot be undone.`,
      confirmText: 'Delete Session',
    };
  } else {
    return {
      title: 'Delete Story',
      description: `Are you sure you want to delete the story "${title}"? This action cannot be undone.`,
      confirmText: 'Delete Story',
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
