'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Session, State } from '@/app/state/types';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileText,
  Database,
  Edit,
  ExternalLink,
  Trash2,
  User,
  Globe,
  Lock,
} from 'lucide-react';
import Link from 'next/link';

export type SortField = 'title' | 'created_at' | 'updated_at' | 'type';
export type SortDirection = 'asc' | 'desc';

interface MyStoriesTableProps {
  items: (Session | State)[];
  showCreator?: boolean;
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  onEdit: (item: Session | State) => void;
  onDelete: (item: Session | State) => void;
}

export function MyStoriesTable({
  items,
  showCreator = false,
  sortField,
  sortDirection,
  onSort,
  onEdit,
  onDelete,
}: MyStoriesTableProps) {
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className='h-3 w-3' />;
    }
    return sortDirection === 'asc' ? <ArrowUp className='h-3 w-3' /> : <ArrowDown className='h-3 w-3' />;
  };

  const SortableTableHead = ({ field, children, className }: { field: SortField; children: React.ReactNode; className?: string }) => (
    <TableHead className={`cursor-pointer hover:bg-muted/50 text-sm ${className || ''}`} onClick={() => onSort(field)}>
      <div className='flex items-center gap-1'>
        {children}
        {getSortIcon(field)}
      </div>
    </TableHead>
  );

  if (items.length === 0) {
    return (
      <div className='text-center py-4 text-muted-foreground'>
        <p className='text-sm'>No items found</p>
        {!showCreator && (
          <p className='text-sm mt-1'>
            Create content from the{' '}
            <Link href='/builder' className='text-primary hover:underline'>
              Story Builder
            </Link>
          </p>
        )}
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className='h-8'>
          <SortableTableHead field='title' className='h-8 px-1 w-[20%]'>Title</SortableTableHead>
          <SortableTableHead field='type' className='h-8 px-1 w-[8%]'>Type</SortableTableHead>
          <TableHead className='h-8 px-1 w-[25%] text-sm'>Note</TableHead>
          <TableHead className='h-8 px-1 w-[8%] text-sm'>Visibility</TableHead>
          <SortableTableHead field='created_at' className='h-8 px-1 w-[10%]'>Created</SortableTableHead>
          <SortableTableHead field='updated_at' className='h-8 px-1 w-[10%]'>Updated</SortableTableHead>
          {showCreator && <TableHead className='h-8 px-1 w-[12%] text-sm'>Creator</TableHead>}
          <TableHead className='h-8 px-1 w-[7%] text-sm'>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id} className='h-9'>
            <TableCell className='font-medium px-1 py-0.5 truncate'>
              <div className='flex items-center gap-1'>
                {item.type === 'session' ? <FileText className='h-3 w-3 flex-shrink-0' /> : <Database className='h-3 w-3 flex-shrink-0' />}
                <span className='text-sm truncate'>{item.title}</span>
              </div>
            </TableCell>
            <TableCell className='px-1 py-0.5'>
              <Badge variant='outline' className='text-sm px-1.5 py-0.5'>{item.type}</Badge>
            </TableCell>
            <TableCell className='px-1 py-0.5 text-sm truncate max-w-0'>{item.description || '-'}</TableCell>
            <TableCell className='px-1 py-0.5'>
              <Badge variant={item.visibility === 'public' ? 'default' : 'secondary'} className='text-sm px-1.5 py-0.5'>
                {item.visibility === 'public' ? (
                  <Globe className='h-2 w-2 mr-0.5' />
                ) : (
                  <Lock className='h-2 w-2 mr-0.5' />
                )}
                {item.visibility}
              </Badge>
            </TableCell>
            <TableCell className='text-sm text-muted-foreground px-1 py-0.5 truncate'>
              {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
            </TableCell>
            <TableCell className='text-sm text-muted-foreground px-1 py-0.5 truncate'>
              {new Date(item.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
            </TableCell>
            {showCreator && (
              <TableCell className='text-sm px-1 py-0.5 truncate'>
                <div className='flex items-center gap-1'>
                  <User className='h-2 w-2 flex-shrink-0' />
                  <span className='truncate'>{item.creator.name}</span>
                </div>
              </TableCell>
            )}
            <TableCell className='px-1 py-0.5'>
              <div className='flex gap-0.5'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => onEdit(item)}
                  disabled={item.type === 'state' && item.visibility === 'private'}
                  className='h-6 w-6 p-0'
                  title={item.type === 'session' ? 'Edit' : 'Open'}
                >
                  {item.type === 'session' ? <Edit className='h-3 w-3' /> : <ExternalLink className='h-3 w-3' />}
                </Button>
                {!showCreator && (
                  <Button
                    variant='outline'
                    size='sm'
                    className='h-6 w-6 p-0 text-destructive hover:text-destructive'
                    onClick={() => onDelete(item)}
                    title='Delete'
                  >
                    <Trash2 className='h-3 w-3' />
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
} 