'use client';

import { useState } from 'react';
import { Header, Main } from '@/components/common';
import { useAuth } from '@/app/providers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Session, State } from '@/app/state/types';
import {
  ExternalLink,
  FileText,
  Database,
  Trash2,
  Calendar,
  User,
  Lock,
  Globe,
  Edit,
  AlertTriangle,
  BarChart3,
  Tag,
} from 'lucide-react';
import Link from 'next/link';
import { useMyStoriesData } from './useMyStoriesData';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export default function MyStoriesPage() {
  const auth = useAuth();
  const myStories = useMyStoriesData(auth.isAuthenticated);

  // State for confirmation dialogs
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    type: 'session' | 'state' | 'all';
    id?: string;
    title?: string;
  }>({ open: false, type: 'session' });
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter public items to ensure only truly public items are shown
  const filteredPublicSessions = myStories.publicSessions.filter((session) => session.visibility === 'public');
  const filteredPublicStates = myStories.publicStates.filter((state) => state.visibility === 'public');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDeleteClick = (item: Session | State) => {
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
      } else if (deleteConfirm.type === 'state' && deleteConfirm.id) {
        success = await myStories.handleDeleteState(deleteConfirm.id);
      }

      if (success) {
        setDeleteConfirm({ open: false, type: 'session' });
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const getDeleteDialogProps = () => {
    if (deleteConfirm.type === 'all') {
      return {
        title: 'Delete All Content',
        description:
          'Are you sure you want to delete ALL your sessions and states? This action cannot be undone and will permanently remove all your content.',
        confirmText: 'Delete All',
      };
    } else if (deleteConfirm.type === 'session') {
      return {
        title: 'Delete Session',
        description: `Are you sure you want to delete the session "${deleteConfirm.title}"? This action cannot be undone.`,
        confirmText: 'Delete Session',
      };
    } else {
      return {
        title: 'Delete State',
        description: `Are you sure you want to delete the state "${deleteConfirm.title}"? This action cannot be undone.`,
        confirmText: 'Delete State',
      };
    }
  };

  const ItemCard = ({ item, showCreator = false }: { item: Session | State; showCreator?: boolean }) => {
    return (
      <Card className='mb-4'>
        <CardHeader className='pb-3'>
          <div className='flex items-start justify-between'>
            <div className='flex-1'>
              <CardTitle className='text-lg flex items-center gap-2'>
                {item.type === 'session' ? <FileText className='h-5 w-5' /> : <Database className='h-5 w-5' />}
                {item.title}
                <Badge variant={item.visibility === 'public' ? 'default' : 'secondary'} className='ml-2'>
                  {item.visibility === 'public' ? (
                    <Globe className='h-3 w-3 mr-1' />
                  ) : (
                    <Lock className='h-3 w-3 mr-1' />
                  )}
                  {item.visibility}
                </Badge>
              </CardTitle>
              {item.description && <CardDescription className='mt-1'>{item.description}</CardDescription>}
              {item.tags && Array.isArray(item.tags) && item.tags.length > 0 && (
                <div className='flex items-center gap-1 mt-2 flex-wrap'>
                  <Tag className='h-3 w-3 text-muted-foreground' />
                  {item.tags.map((tag, index) => (
                    <Badge key={index} variant='outline' className='text-xs px-2 py-0.5'>
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className='flex items-center gap-4 text-sm text-muted-foreground'>
            <div className='flex items-center gap-1'>
              <Calendar className='h-4 w-4' />
              {formatDate(item.created_at)}
            </div>
            {showCreator && (
              <div className='flex items-center gap-1'>
                <User className='h-4 w-4' />
                {item.creator.name}
              </div>
            )}
            <Badge variant='outline'>{item.type}</Badge>
          </div>
        </CardHeader>
        <CardContent className='pt-0'>
          <div className='flex gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => myStories.handleOpenInBuilder(item)}
              disabled={item.type === 'state' && item.visibility === 'private'}
              className='flex items-center gap-1'
            >
              {item.type === 'session' ? <Edit className='h-4 w-4' /> : <ExternalLink className='h-4 w-4' />}
              {item.type === 'session' ? 'Open in Builder' : 'Open in Molstar'}
            </Button>
            {!showCreator && (
              <Button
                variant='outline'
                size='sm'
                className='flex items-center gap-1 text-destructive hover:text-destructive'
                onClick={() => handleDeleteClick(item)}
              >
                <Trash2 className='h-4 w-4' />
                Delete
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // const formatBytes = (bytes: number) => {
  //   if (bytes === 0) return '0 Bytes';
  //   const k = 1024;
  //   const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  //   const i = Math.floor(Math.log(bytes) / Math.log(k));
  //   return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  // };

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === 0) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const QuotaCard = ({
    title,
    used,
    limit,
    unit = '',
    icon: Icon,
  }: {
    title: string;
    used: number;
    limit: number;
    unit?: string;
    icon: React.ComponentType<{ className?: string }>;
  }) => {
    const percentage = getUsagePercentage(used, limit);
    const colorClass = getUsageColor(percentage);

    return (
      <Card>
        <CardContent className='p-4'>
          <div className='flex items-center justify-between mb-2'>
            <div className='flex items-center gap-2'>
              <Icon className='h-4 w-4 text-muted-foreground' />
              <span className='text-sm font-medium'>{title}</span>
            </div>
            <span className='text-xs text-muted-foreground'>
              {used.toLocaleString()}
              {unit} / {limit.toLocaleString()}
              {unit}
            </span>
          </div>
          <div className='space-y-2'>
            <div className='w-full bg-muted rounded-full h-2'>
              <div
                className={`h-2 rounded-full transition-all duration-300 ${colorClass}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className='flex justify-between text-xs text-muted-foreground'>
              <span>{percentage.toFixed(1)}% used</span>
              <span>{limit - used} remaining</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (auth.isLoading) {
    return (
      <div className='flex flex-col h-screen'>
        <Header>My Stories</Header>
        <Main>
          <div className='flex items-center justify-center h-full'>
            <div className='text-center'>
              <div className='text-lg text-muted-foreground'>Loading...</div>
            </div>
          </div>
        </Main>
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return (
      <div className='flex flex-col h-screen'>
        <Header>My Stories</Header>
        <Main>
          <div className='flex items-center justify-center h-full'>
            <Card className='w-full max-w-md'>
              <CardHeader className='text-center'>
                <CardTitle>Authentication Required</CardTitle>
                <CardDescription>Please log in to view your stories and sessions</CardDescription>
              </CardHeader>
              <CardContent className='text-center'>
                <p className='text-sm text-muted-foreground'>
                  Use the login button in the top navigation to sign in with Life Science AAI.
                </p>
              </CardContent>
            </Card>
          </div>
        </Main>
      </div>
    );
  }

  return (
    <div className='flex flex-col h-screen'>
      <Header>My Stories</Header>
      <Main>
        <div className='space-y-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-2xl font-bold'>My Stories</h1>
              <p className='text-muted-foreground'>Manage your sessions and shared stories</p>
            </div>
            <div className='flex gap-2'>
              <Button
                variant='destructive'
                onClick={handleDeleteAllClick}
                disabled={myStories.loading || (myStories.sessions.length === 0 && myStories.states.length === 0)}
                className='flex items-center gap-1'
              >
                <AlertTriangle className='h-4 w-4' />
                Delete All
              </Button>
              <Button onClick={myStories.loadAllData} disabled={myStories.loading}>
                {myStories.loading ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
          </div>

          {myStories.error && (
            <div className='bg-destructive/15 text-destructive px-4 py-3 rounded-lg'>
              <strong className='font-medium'>Error: </strong>
              {myStories.error}
            </div>
          )}

          <Tabs defaultValue='my-content' className='w-full'>
            <TabsList className='grid w-full grid-cols-3'>
              <TabsTrigger value='my-content'>My Content</TabsTrigger>
              <TabsTrigger value='public-content'>Public Content</TabsTrigger>
              <TabsTrigger value='storage'>Storage</TabsTrigger>
            </TabsList>

            <TabsContent value='my-content' className='space-y-6'>
              <div className='grid gap-6 md:grid-cols-2'>
                <div>
                  <h2 className='text-xl font-semibold mb-4 flex items-center gap-2'>
                    <FileText className='h-5 w-5' />
                    My Sessions ({myStories.sessions.length})
                  </h2>
                  {myStories.loading ? (
                    <div className='text-center py-8 text-muted-foreground'>Loading sessions...</div>
                  ) : myStories.sessions.length === 0 ? (
                    <Card>
                      <CardContent className='text-center py-8'>
                        <FileText className='h-12 w-12 mx-auto text-muted-foreground/50 mb-4' />
                        <p className='text-muted-foreground'>No sessions found</p>
                        <p className='text-sm text-muted-foreground mt-1'>
                          Create sessions from the{' '}
                          <Link href='/builder' className='text-primary hover:underline'>
                            Story Builder
                          </Link>
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className='space-y-4'>
                      {myStories.sessions.map((session) => (
                        <ItemCard key={session.id} item={session} />
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h2 className='text-xl font-semibold mb-4 flex items-center gap-2'>
                    <Database className='h-5 w-5' />
                    Shared Stories ({myStories.states.length})
                  </h2>
                  {myStories.loading ? (
                    <div className='text-center py-8 text-muted-foreground'>Loading states...</div>
                  ) : myStories.states.length === 0 ? (
                    <Card>
                      <CardContent className='text-center py-8'>
                        <Database className='h-12 w-12 mx-auto text-muted-foreground/50 mb-4' />
                        <p className='text-muted-foreground'>No states found</p>
                        <p className='text-sm text-muted-foreground mt-1'>
                          Export states from the{' '}
                          <Link href='/builder' className='text-primary hover:underline'>
                            Story Builder
                          </Link>
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className='space-y-4'>
                      {myStories.states.map((state) => (
                        <ItemCard key={state.id} item={state} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value='public-content' className='space-y-6'>
              <div className='grid gap-6 md:grid-cols-2'>
                <div>
                  <h2 className='text-xl font-semibold mb-4 flex items-center gap-2'>
                    <Globe className='h-5 w-5' />
                    Public Sessions ({filteredPublicSessions.length})
                  </h2>
                  {myStories.loading ? (
                    <div className='text-center py-8 text-muted-foreground'>Loading public sessions...</div>
                  ) : filteredPublicSessions.length === 0 ? (
                    <Card>
                      <CardContent className='text-center py-8'>
                        <Globe className='h-12 w-12 mx-auto text-muted-foreground/50 mb-4' />
                        <p className='text-muted-foreground'>No public sessions found</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className='space-y-4'>
                      {filteredPublicSessions.map((session) => (
                        <ItemCard key={session.id} item={session} showCreator />
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h2 className='text-xl font-semibold mb-4 flex items-center gap-2'>
                    <Globe className='h-5 w-5' />
                    Public States ({filteredPublicStates.length})
                  </h2>
                  {myStories.loading ? (
                    <div className='text-center py-8 text-muted-foreground'>Loading public states...</div>
                  ) : filteredPublicStates.length === 0 ? (
                    <Card>
                      <CardContent className='text-center py-8'>
                        <Globe className='h-12 w-12 mx-auto text-muted-foreground/50 mb-4' />
                        <p className='text-muted-foreground'>No public states found</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className='space-y-4'>
                      {filteredPublicStates.map((state) => (
                        <ItemCard key={state.id} item={state} showCreator />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value='storage' className='space-y-6'>
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <BarChart3 className='h-5 w-5' />
                    Storage Statistics & Quota
                  </CardTitle>
                  <CardDescription>View your storage usage and limits</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='space-y-6'>
                    {/* Current Statistics */}
                    <div>
                      <h3 className='text-sm font-medium mb-3'>Current Usage</h3>
                      <div className='grid gap-4 md:grid-cols-3'>
                        <div className='text-center'>
                          <div className='text-2xl font-bold'>
                            {myStories.sessions.length + myStories.states.length}
                          </div>
                          <div className='text-sm text-muted-foreground'>Total Items</div>
                        </div>
                        <div className='text-center'>
                          <div className='text-2xl font-bold'>{myStories.sessions.length}</div>
                          <div className='text-sm text-muted-foreground'>Sessions</div>
                        </div>
                        <div className='text-center'>
                          <div className='text-2xl font-bold'>{myStories.states.length}</div>
                          <div className='text-sm text-muted-foreground'>States</div>
                        </div>
                      </div>
                    </div>

                    {/* Quota Information */}
                    {myStories.quotaLoading ? (
                      <div className='text-center py-8 text-muted-foreground'>Loading quota information...</div>
                    ) : myStories.quotaError ? (
                      <div className='bg-destructive/15 text-destructive px-4 py-3 rounded-lg'>
                        <strong className='font-medium'>Error loading quota: </strong>
                        {myStories.quotaError}
                      </div>
                    ) : myStories.quota ? (
                      <div>
                        <div className='flex items-center justify-between mb-3'>
                          <h3 className='text-sm font-medium'>Account Limits</h3>
                          <Button variant='outline' size='sm' onClick={myStories.loadQuota}>
                            Refresh
                          </Button>
                        </div>

                        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-2'>
                          <QuotaCard
                            title='Sessions'
                            used={myStories.quota?.sessions?.current ?? 0}
                            limit={myStories.quota?.sessions?.limit ?? 0}
                            icon={FileText}
                          />
                          <QuotaCard
                            title='States'
                            used={myStories.quota?.states?.current ?? 0}
                            limit={myStories.quota?.states?.limit ?? 0}
                            icon={Database}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className='text-center py-8 text-muted-foreground'>
                        <p>Quota information not available</p>
                        <Button variant='outline' size='sm' className='mt-2' onClick={myStories.loadQuota}>
                          Load Quota
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Confirmation Dialog */}
        <ConfirmDialog
          open={deleteConfirm.open}
          onOpenChange={(open) => setDeleteConfirm({ ...deleteConfirm, open })}
          title={getDeleteDialogProps().title}
          description={getDeleteDialogProps().description}
          confirmText={getDeleteDialogProps().confirmText}
          onConfirm={handleConfirmDelete}
          isDestructive={true}
          isLoading={isDeleting}
        />
      </Main>
    </div>
  );
}
