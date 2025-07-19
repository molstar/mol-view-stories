'use client';

import { useAuth } from '@/app/providers';
import { SessionItem, StoryItem } from '@/app/state/types';
import { Header, Main } from '@/components/common';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { handleOAuthCallback } from '@/lib/auth-utils';
import { ChevronDown, Cloud, RefreshCw, Search, Share2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useMyStoriesData } from './useMyStoriesData';

// Import new components
import {
  AuthRequiredScreen,
  filterItems,
  getDeleteDialogProps,
  LoadingScreen,
  MyStoriesTable,
  SortDirection,
  SortField,
  sortItems,
} from './components';
import { PublishedStoryModal } from '@/components/story-builder/file-operations/PublishedStoryModal';

export default function MyStoriesPage() {
  const auth = useAuth();
  const router = useRouter();
  const myStories = useMyStoriesData(auth.isAuthenticated);
  const [isProcessingCallback, setIsProcessingCallback] = useState(false);
  const [callbackProcessed, setCallbackProcessed] = useState(false);
  const [hasOAuthCode, setHasOAuthCode] = useState(false);
  const [isRedirectingToBuilder, setIsRedirectingToBuilder] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState('sessions');

  // Filter and sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // State for confirmation dialogs
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    type: 'session' | 'story' | 'all' | 'all-sessions' | 'all-stories';
    id?: string;
    title?: string;
    count?: number;
  }>({ open: false, type: 'session' });

  const [isDeleting, setIsDeleting] = useState(false);

  // Check for OAuth code in URL params on client side
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hasCode = urlParams.has('code');
    setHasOAuthCode(hasCode);
  }, []);

  // Handle OAuth callback
  useEffect(() => {
    const processOAuthCallback = async () => {
      if (hasOAuthCode && !isProcessingCallback && !callbackProcessed && !auth.isAuthenticated) {
        setIsProcessingCallback(true);
        try {
          const result = await handleOAuthCallback();

          if (result && result.success) {
            setCallbackProcessed(true);

            if (result.redirectPath && result.redirectPath !== window.location.pathname) {
              setIsRedirectingToBuilder(true);
              router.push(result.redirectPath);
              return;
            }

            // If we're not redirecting, clear the redirecting state
            setIsRedirectingToBuilder(false);
          } else {
            // Reset so user can try again if needed
            setCallbackProcessed(false);
            setIsRedirectingToBuilder(false);
          }
        } catch {
          // Reset so user can try again if needed
          setCallbackProcessed(false);
          setIsRedirectingToBuilder(false);
        } finally {
          setIsProcessingCallback(false);
        }
      }
    };

    processOAuthCallback();
  }, [auth, callbackProcessed, isProcessingCallback, router]);

  // Debug auth state changes
  useEffect(() => {
    // Empty effect for debugging auth state changes
  }, [auth.isAuthenticated, auth.isLoading, auth.user, isProcessingCallback, hasOAuthCode, callbackProcessed, router]);

  // Filtered and sorted data based on active tab
  const filteredAndSortedSessions = useMemo(() => {
    const filtered = filterItems(myStories.sessions, searchQuery);
    return sortItems(filtered, sortField, sortDirection);
  }, [myStories.sessions, searchQuery, sortField, sortDirection]);

  const filteredAndSortedStories = useMemo(() => {
    const filtered = filterItems(myStories.stories, searchQuery);
    return sortItems(filtered, sortField, sortDirection);
  }, [myStories.stories, searchQuery, sortField, sortDirection]);

  // Get active data based on tab
  // const activeData = activeTab === 'stories' ? filteredAndSortedStories : filteredAndSortedSessions;
  // const activeDataType = activeTab === 'stories' ? 'stories' : 'sessions';
  // const activeIcon = activeTab === 'stories' ? Database : FileText;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleDeleteClick = (item: SessionItem | StoryItem) => {
    setDeleteConfirm({
      open: true,
      type: item.type,
      id: item.id,
      title: item.title,
    });
  };

  const handleDeleteAllSessionsClick = () => {
    setDeleteConfirm({
      open: true,
      type: 'all-sessions',
      count: myStories.sessions.length,
    });
  };

  const handleDeleteAllStoriesClick = () => {
    setDeleteConfirm({
      open: true,
      type: 'all-stories',
      count: myStories.stories.length,
    });
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      let success = false;

      if (deleteConfirm.type === 'all') {
        success = await myStories.handleDeleteAllContent();
      } else if (deleteConfirm.type === 'all-sessions') {
        success = await myStories.handleDeleteAllSessions();
      } else if (deleteConfirm.type === 'all-stories') {
        success = await myStories.handleDeleteAllStories();
      } else if (deleteConfirm.type === 'session' && deleteConfirm.id) {
        success = await myStories.handleDeleteSession(deleteConfirm.id);
      } else if (deleteConfirm.type === 'story' && deleteConfirm.id) {
        success = await myStories.handleDeleteStory(deleteConfirm.id);
      }

      if (success) {
        setDeleteConfirm({ open: false, type: 'session' });
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Show loading during auth initialization, callback processing, or if we have OAuth code but haven't processed it yet
  if (auth.isLoading || isProcessingCallback || (hasOAuthCode && !auth.isAuthenticated) || isRedirectingToBuilder) {
    return (
      <LoadingScreen
        isRedirectingToBuilder={isRedirectingToBuilder}
        isProcessingCallback={isProcessingCallback}
        hasOAuthCode={hasOAuthCode}
      />
    );
  }

  if (!auth.isAuthenticated) {
    return <AuthRequiredScreen />;
  }

  const dialogProps = getDeleteDialogProps(deleteConfirm.type, deleteConfirm.title, deleteConfirm.count);

  // Check if there's any content to delete
  const hasAnySessions = myStories.sessions.length > 0;
  const hasAnyStories = myStories.stories.length > 0;
  const hasAnyContent = hasAnySessions || hasAnyStories;

  return (
    <div className='flex flex-col h-screen'>
      <Header
        actions={
          <div className='flex gap-1'>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='outline'
                  size='sm'
                  disabled={myStories.loading || !hasAnyContent}
                  className='flex items-center gap-1 h-8 px-3 text-sm'
                >
                  Actions
                  <ChevronDown className='h-3 w-3' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem onClick={myStories.loadAllData} disabled={myStories.loading}>
                  <RefreshCw className='h-4 w-4 mr-2' />
                  Refresh
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleDeleteAllSessionsClick}
                  disabled={!hasAnySessions}
                  className='text-destructive'
                >
                  <Cloud className='h-4 w-4 mr-2' />
                  Delete All Saved Sessions ({myStories.sessions.length})
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDeleteAllStoriesClick}
                  disabled={!hasAnyStories}
                  className='text-destructive'
                >
                  <Share2 className='h-4 w-4 mr-2' />
                  Delete All Published Stories ({myStories.stories.length})
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      >
        My Stories
      </Header>
      <Main className='flex-1'>
        <section className='px-4 md:px-8 bg-background'>
          <div className='max-w-6xl mx-auto space-y-3'>
            {myStories.error && (
              <div className='bg-destructive/15 text-destructive px-3 py-2 rounded-lg text-base'>
                <strong className='font-medium'>Error: </strong>
                {myStories.error}
              </div>
            )}

            <div className='space-y-2'>
              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
                <div className='flex items-center gap-2'>
                  <TabsList>
                    <TabsTrigger
                      value='sessions'
                      className='flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-muted/80 transition-colors'
                    >
                      <Cloud className='h-4 w-4' />
                      Saved Sessions ({myStories.sessions.length})
                    </TabsTrigger>
                    <TabsTrigger
                      value='stories'
                      className='flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-muted/80 transition-colors'
                    >
                      <Share2 className='h-4 w-4' />
                      Published Stories ({myStories.stories.length})
                    </TabsTrigger>
                  </TabsList>

                  <div className='flex gap-2 items-center'>
                    {/* Search Bar - only show if there are items to search through */}

                    <div className='relative max-w-xs'>
                      <Search className='absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground' />
                      <Input
                        placeholder='Search by title or note...'
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className='pl-8 h-8 text-sm'
                      />
                    </div>
                    <div className='text-muted-foreground text-sm'>
                      Showing {filteredAndSortedSessions.length}{' '}
                      {filteredAndSortedSessions.length === 1 ? 'entry' : 'entries'}
                    </div>
                  </div>
                </div>

                <TabsContent value='stories' className='space-y-2'>
                  {myStories.loading ? (
                    <div className='text-center py-4 text-muted-foreground text-sm'>Loading content...</div>
                  ) : (
                    <MyStoriesTable
                      items={filteredAndSortedStories}
                      showCreator={false}
                      sortField={sortField}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                      onEdit={myStories.handleOpenInBuilder}
                      onDelete={handleDeleteClick}
                    />
                  )}
                </TabsContent>

                <TabsContent value='sessions' className='space-y-2'>
                  {myStories.loading ? (
                    <div className='text-center py-4 text-muted-foreground text-sm'>Loading content...</div>
                  ) : (
                    <MyStoriesTable
                      items={filteredAndSortedSessions}
                      showCreator={false}
                      sortField={sortField}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                      onEdit={myStories.handleOpenInBuilder}
                      onDelete={handleDeleteClick}
                    />
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </section>

        <PublishedStoryModal />

        {/* Confirmation Dialog */}
        <ConfirmDialog
          open={deleteConfirm.open}
          onOpenChange={(open) => setDeleteConfirm({ ...deleteConfirm, open })}
          title={dialogProps.title}
          description={dialogProps.description}
          confirmText={dialogProps.confirmText}
          onConfirm={handleConfirmDelete}
          isDestructive={true}
          isLoading={isDeleting}
        />
      </Main>
    </div>
  );
}
