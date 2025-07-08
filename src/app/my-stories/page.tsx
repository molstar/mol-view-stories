'use client';

import { useEffect, useState, useCallback } from 'react';
import { Header, Main } from '@/components/common';
import { useAuth } from '@/app/providers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Session, State } from '@/app/state/types';
import { ExternalLink, FileText, Database, Trash2, Calendar, User, Lock, Globe, Edit } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { authenticatedFetch } from '@/lib/auth-utils';

// Extended session interface that may include story data
interface SessionWithData extends Session {
  data?: unknown;
}

export default function MyStoriesPage() {
  const auth = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [publicSessions, setPublicSessions] = useState<Session[]>([]);
  const [publicStates, setPublicStates] = useState<State[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (endpoint: string, isPublic: boolean = false) => {
    if (!auth.isAuthenticated) {
      setError('Please log in to view your stories');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const url = isPublic 
        ? `https://mol-view-stories.dyn.cloud.e-infra.cz/api/public/${endpoint}s`
        : `https://mol-view-stories.dyn.cloud.e-infra.cz/api/${endpoint}`;

      const response = await authenticatedFetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch ${endpoint}s: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (endpoint === 'session') {
        if (isPublic) {
          setPublicSessions(data);
        } else {
          setSessions(data);
        }
      } else {
        if (isPublic) {
          setPublicStates(data);
        } else {
          setStates(data);
        }
      }
    } catch (err) {
      console.error(`Error fetching ${endpoint}s:`, err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast.error(`Failed to load ${endpoint}s`);
    } finally {
      setLoading(false);
    }
  }, [auth.isAuthenticated]);

  const loadAllData = useCallback(() => {
    fetchData('session', false);
    fetchData('state', false);
    fetchData('session', true);
    fetchData('state', true);
  }, [fetchData]);

  useEffect(() => {
    if (auth.isAuthenticated) {
      loadAllData();
    }
  }, [auth.isAuthenticated, loadAllData]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleOpenInBuilder = async (item: Session | State) => {
    try {
      // For sessions, try to load story data into the builder
      if (item.type === 'session') {
        // Check if the session already contains story data
        const sessionItem = item as SessionWithData;
        
        if (sessionItem.data) {
          // Session already has story data, use it directly
          sessionStorage.setItem('restore_app_state', JSON.stringify({
            story: sessionItem.data,
            currentView: { type: 'story-options', subview: 'story-metadata' },
            timestamp: Date.now(),
          }));
          
          // Navigate to the builder
          window.location.href = '/builder';
        } else {
          // Fallback: try to fetch session data if not available
          if (!auth.isAuthenticated) {
            toast.error('Authentication required');
            return;
          }

          const response = await authenticatedFetch(`https://mol-view-stories.dyn.cloud.e-infra.cz/api/session/${item.id}/data.js`);

          if (!response.ok) {
            throw new Error(`Failed to fetch session data: ${response.statusText}`);
          }

          const sessionResponse = await response.json();
          const storyData = sessionResponse.data;
          
          if (storyData) {
            sessionStorage.setItem('restore_app_state', JSON.stringify({
              story: storyData,
              currentView: { type: 'story-options', subview: 'story-metadata' },
              timestamp: Date.now(),
            }));
            
            window.location.href = '/builder';
          } else {
            throw new Error('No story data found in session');
          }
        }
      } else if (item.type === 'state') {
        // For states, open in external MVS Stories viewer (states are MVS data, not story format)
        const url = `https://molstar.org/demos/mvs-stories/?story-url=https://mol-view-stories.dyn.cloud.e-infra.cz/api/${item.type}/${item.id}`;
        window.open(url, '_blank');
      } else {
        toast.error('Unknown item type');
      }
    } catch (err) {
      console.error('Error opening item:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to open item');
    }
  };

  const ItemCard = ({ item, showCreator = false }: { item: Session | State; showCreator?: boolean }) => (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {item.type === 'session' ? <FileText className="h-5 w-5" /> : <Database className="h-5 w-5" />}
              {item.title}
              <Badge variant={item.visibility === 'public' ? 'default' : 'secondary'} className="ml-2">
                {item.visibility === 'public' ? <Globe className="h-3 w-3 mr-1" /> : <Lock className="h-3 w-3 mr-1" />}
                {item.visibility}
              </Badge>
            </CardTitle>
            {item.description && (
              <CardDescription className="mt-1">{item.description}</CardDescription>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {formatDate(item.created_at)}
          </div>
          {showCreator && (
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              {item.creator.name}
            </div>
          )}
          <Badge variant="outline">{item.type}</Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenInBuilder(item)}
            className="flex items-center gap-1"
          >
            {item.type === 'session' ? <Edit className="h-4 w-4" /> : <ExternalLink className="h-4 w-4" />}
            {item.type === 'session' ? 'Open in Builder' : 'Open in MVS'}
          </Button>
          {!showCreator && (
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1 text-destructive hover:text-destructive"
              disabled
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (auth.isLoading) {
    return (
      <div className='flex flex-col h-screen'>
        <Header>My Stories</Header>
        <Main>
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-lg text-muted-foreground">Loading...</div>
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
          <div className="flex items-center justify-center h-full">
            <Card className="w-full max-w-md">
              <CardHeader className="text-center">
                <CardTitle>Authentication Required</CardTitle>
                <CardDescription>Please log in to view your stories and sessions</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground">
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
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">My Stories</h1>
              <p className="text-muted-foreground">
                Manage your molecular visualization stories and sessions
              </p>
            </div>
            <Button onClick={loadAllData} disabled={loading}>
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>

          {error && (
            <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-lg">
              <strong className="font-medium">Error: </strong>
              {error}
            </div>
          )}

          <Tabs defaultValue="my-content" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="my-content">My Content</TabsTrigger>
              <TabsTrigger value="public-content">Public Content</TabsTrigger>
              <TabsTrigger value="storage">Storage</TabsTrigger>
            </TabsList>

            <TabsContent value="my-content" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    My Sessions ({sessions.length})
                  </h2>
                  {loading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading sessions...</div>
                  ) : sessions.length === 0 ? (
                    <Card>
                      <CardContent className="text-center py-8">
                        <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                        <p className="text-muted-foreground">No sessions found</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Create sessions from the{' '}
                          <Link href="/" className="text-primary hover:underline">
                            Story Builder
                          </Link>
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {sessions.map((session) => (
                        <ItemCard key={session.id} item={session} />
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    My States ({states.length})
                  </h2>
                  {loading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading states...</div>
                  ) : states.length === 0 ? (
                    <Card>
                      <CardContent className="text-center py-8">
                        <Database className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                        <p className="text-muted-foreground">No states found</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Export states from the{' '}
                          <Link href="/" className="text-primary hover:underline">
                            Story Builder
                          </Link>
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {states.map((state) => (
                        <ItemCard key={state.id} item={state} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="public-content" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Public Sessions ({publicSessions.length})
                  </h2>
                  {loading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading public sessions...</div>
                  ) : publicSessions.length === 0 ? (
                    <Card>
                      <CardContent className="text-center py-8">
                        <Globe className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                        <p className="text-muted-foreground">No public sessions found</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {publicSessions.map((session) => (
                        <ItemCard key={session.id} item={session} showCreator />
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Public States ({publicStates.length})
                  </h2>
                  {loading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading public states...</div>
                  ) : publicStates.length === 0 ? (
                    <Card>
                      <CardContent className="text-center py-8">
                        <Globe className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                        <p className="text-muted-foreground">No public states found</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {publicStates.map((state) => (
                        <ItemCard key={state.id} item={state} showCreator />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="storage" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Storage Statistics</CardTitle>
                  <CardDescription>View your storage usage and limits</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{sessions.length + states.length}</div>
                        <div className="text-sm text-muted-foreground">Total Items</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{sessions.length}</div>
                        <div className="text-sm text-muted-foreground">Sessions</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{states.length}</div>
                        <div className="text-sm text-muted-foreground">States</div>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground text-center">
                      Detailed storage statistics will be available in a future update
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </Main>
    </div>
  );
}
