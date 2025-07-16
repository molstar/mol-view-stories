'use client';

import { useState, useEffect, useMemo } from 'react';
import { Header, Main } from '@/components/common';
import { useAuth } from '@/app/providers';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Session, StoryItem } from '@/app/state/types';
import { AlertTriangle, FileText, Search } from 'lucide-react';
import Link from 'next/link';
import { useMyStoriesData } from './useMyStoriesData';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { handleOAuthCallback, handlePopupCallback } from '@/lib/auth-utils';
import { useRouter } from 'next/navigation';

// Import new components
import { 
  MyStoriesTable, 
  LoadingScreen, 
  AuthRequiredScreen,
  filterItems, 
  sortItems, 
  getDeleteDialogProps,
  SortField, 
  SortDirection 
} from './components';
import { LoginButton } from '@/components/login';

export default function MyStoriesPage() {
  const auth = useAuth();
  const router = useRouter();
  const myStories = useMyStoriesData(auth.isAuthenticated);
  const [isProcessingCallback, setIsProcessingCallback] = useState(false);
  const [callbackProcessed, setCallbackProcessed] = useState(false);
  const [hasOAuthCode, setHasOAuthCode] = useState(false);
  const [isRedirectingToBuilder, setIsRedirectingToBuilder] = useState(false);

  // Filter and sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // State for confirmation dialogs
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    type: 'session' | 'story' | 'all';
    id?: string;
    title?: string;
  }>({ open: false, type: 'session' });
  const [isDeleting, setIsDeleting] = useState(false);

  // Check for OAuth callback URL after mount to avoid hydration issues
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hasCode = urlParams.has('code');
    setHasOAuthCode(hasCode);
    
    // Check if this is a popup window with OAuth callback
    if (hasCode && window.opener) {
      // This is a popup callback - handle it and close
      handlePopupCallback();
      return;
    }
    
    // Early check: if we have OAuth code and likely came from builder, show redirecting state
    if (hasCode) {
      try {
        const savedRedirectPath = sessionStorage.getItem('post_login_redirect');
        if (savedRedirectPath?.startsWith('/builder')) {
          setIsRedirectingToBuilder(true);
        }
      } catch {
        // sessionStorage might not be available
      }
    }
  }, []);

  // Handle OAuth callback if present
  useEffect(() => {
    const processOAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      
      // Only process if we have a code and haven't processed it yet
      if (code && !callbackProcessed && !isProcessingCallback) {
        setIsProcessingCallback(true);
        setCallbackProcessed(true);
        
        try {
          const result = await handleOAuthCallback();
          
          if (result.success) {
            // Refresh the auth state after successful token exchange
            await auth.refreshAuth();
            
            // Check if user should be redirected back to builder
            if (result.redirectPath?.startsWith('/builder')) {
              // Redirect back to builder if that's where they logged in from
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

  // Filtered and sorted data
  const filteredAndSortedSessions = useMemo(() => {
    const filtered = filterItems(myStories.sessions, searchQuery);
    return sortItems(filtered, sortField, sortDirection);
  }, [myStories.sessions, searchQuery, sortField, sortDirection]);

  const filteredAndSortedStories = useMemo(() => {
    const filtered = filterItems(myStories.stories, searchQuery);
    return sortItems(filtered, sortField, sortDirection);
  }, [myStories.stories, searchQuery, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleDeleteClick = (item: Session | StoryItem) => {
    setDeleteConfirm({
      open: true,
      type: item.type,
      id: item.id,
      title: item.title,
    });
  };

  const handleDeleteAllClick = () => {
    setDeleteConfirm({
      open: true,
      type: 'all',
    });
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      let success = false;

      if (deleteConfirm.type === 'all') {
        success = await myStories.handleDeleteAllContent();
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

  const dialogProps = getDeleteDialogProps(deleteConfirm.type, deleteConfirm.title);

  return (
    <div className='flex flex-col h-screen'>
      <Header 
        hideAutoLogin={true}
        actions={
          <div className='flex gap-1'>
            <Button
              variant='destructive'
              size='sm'
              onClick={handleDeleteAllClick}
              disabled={myStories.loading || (myStories.sessions.length === 0 && myStories.stories.length === 0)}
              className='flex items-center gap-1 h-8 px-3 text-sm'
            >
              <AlertTriangle className='h-3 w-3' />
              Delete All
            </Button>
            <Button 
              size='sm' 
              onClick={myStories.loadAllData} 
              disabled={myStories.loading}
              className='h-8 px-3 text-sm'
            >
              {myStories.loading ? 'Refreshing...' : 'Refresh'}
            </Button>
            <LoginButton />
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
              <div className='flex items-center justify-between'>
                <h2 className='text-xl font-semibold flex items-center gap-2'>
                  <FileText className='h-4 w-4' />
                  Found {filteredAndSortedSessions.length + filteredAndSortedStories.length} items
                </h2>
              </div>
              
              {/* Search Bar - only show if there are items to search through */}
              {(myStories.sessions.length > 0 || myStories.stories.length > 0) && (
                <div className='relative max-w-xs'>
                  <Search className='absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground' />
                  <Input
                    placeholder='Search by title or note...'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className='pl-8 h-8 text-sm'
                  />
                </div>
              )}

              {myStories.loading ? (
                <div className='text-center py-4 text-muted-foreground text-sm'>Loading content...</div>
              ) : (filteredAndSortedSessions.length === 0 && filteredAndSortedStories.length === 0) ? (
                <div className='max-w-2xl mx-auto'>
                  <Card>
                    <CardContent className='text-center py-4'>
                      <FileText className='h-6 w-6 mx-auto text-muted-foreground/50 mb-2' />
                      <p className='text-muted-foreground text-sm'>No content found</p>
                      <p className='text-sm text-muted-foreground mt-1'>
                        Create content from the{' '}
                        <Link href='/builder' className='text-primary hover:underline'>
                          Story Builder
                        </Link>
                      </p>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <MyStoriesTable 
                  items={[...filteredAndSortedSessions, ...filteredAndSortedStories]} 
                  showCreator={false}
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                  onEdit={myStories.handleOpenInBuilder}
                  onDelete={handleDeleteClick}
                />
              )}
            </div>
          </div>
        </section>

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
