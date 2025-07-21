'use client';

import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SessionItem, StoryItem } from '@/app/state/types';
import { ArrowUpDown, ArrowUp, ArrowDown, Share2, Cloud, Edit, ExternalLink, Trash2, User } from 'lucide-react';

export type SortField = 'title' | 'created_at' | 'updated_at';
export type SortDirection = 'asc' | 'desc';

interface MyStoriesTableProps {
  items: (SessionItem | StoryItem)[];
  showCreator?: boolean;
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  onEdit: (item: SessionItem | StoryItem) => void;
  onDelete: (item: SessionItem | StoryItem) => void;
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

  const SortableTableHead = ({
    field,
    children,
    className,
  }: {
    field: SortField;
    children: React.ReactNode;
    className?: string;
  }) => (
    <TableHead
      className={`px-2 h-8 cursor-pointer hover:bg-muted/50 text-sm ${className || ''}`}
      onClick={() => onSort(field)}
    >
      <div className='flex items-center gap-1'>
        {children}
        {getSortIcon(field)}
      </div>
    </TableHead>
  );

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: '2-digit',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow className='h-8 border-b-2'>
              <SortableTableHead field='title' className='h-8 px-1 w-[25%]'>
                Title
              </SortableTableHead>
              <TableHead className='h-8 px-2 w-[35%] text-sm'>Note</TableHead>
              <SortableTableHead field='created_at' className='w-[15%]'>
                Created
              </SortableTableHead>
              <SortableTableHead field='updated_at' className='w-[15%]'>
                Updated
              </SortableTableHead>
              {showCreator && <TableHead className='h-8 px-2 w-[12%] text-sm'>Creator</TableHead>}
              <TableHead className='h-8 px-2 w-[10%] text-sm'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={showCreator ? 6 : 5} 
                  className="text-center py-8 text-muted-foreground text-sm"
                >
                  No items found
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id} className='h-9'>
                  <TableCell className='font-medium px-2 py-2 truncate'>
                    <div className='flex items-center gap-1'>
                      {item.type === 'session' ? (
                        <Cloud className='h-3 w-3 flex-shrink-0' />
                      ) : (
                        <Share2 className='h-3 w-3 flex-shrink-0' />
                      )}
                      <span className='text-sm truncate'>{item.title}</span>
                    </div>
                  </TableCell>
                  <TableCell className='px-2 py-2 text-sm truncate max-w-0'>{item.description || ''}</TableCell>
                  <TableCell className='text-sm text-muted-foreground px-2 py-2 truncate'>
                    {formatDateTime(item.created_at)}
                  </TableCell>
                  <TableCell className='text-sm text-muted-foreground px-2 py-2 truncate'>
                    {formatDateTime(item.updated_at)}
                  </TableCell>
                  {showCreator && (
                    <TableCell className='text-sm px-2 py-2 truncate'>
                      <div className='flex items-center gap-1'>
                        <User className='h-2 w-2 flex-shrink-0' />
                        <span className='truncate'>{item.creator.name}</span>
                      </div>
                    </TableCell>
                  )}
                  <TableCell className='px-2 py-1'>
                    <div className='flex gap-1'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => onEdit(item)}
                        disabled={false}
                        title={item.type === 'session' ? 'Edit' : 'Open'}
                      >
                        {item.type === 'session' ? (
                          <>
                            <Edit className='h-3 w-3' />
                            Edit
                          </>
                        ) : (
                          <>
                            <ExternalLink className='h-3 w-3' />
                            View
                          </>
                        )}
                      </Button>
                      {!showCreator && (
                        <Button
                          variant='outline'
                          size='sm'
                          className='text-destructive hover:text-destructive'
                          onClick={() => onDelete(item)}
                          title='Delete'
                        >
                          <Trash2 className='h-3 w-3' />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
