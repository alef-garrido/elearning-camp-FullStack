import { useEffect, useState } from 'react';
import { ApiClient } from '@/lib/api';
import { Post, User } from '@/types/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { Trash2, Send } from 'lucide-react';

interface CommunityTimelineProps {
  communityId: string;
  communityOwnerId?: string;
}

export const CommunityTimeline = ({ communityId, communityOwnerId }: CommunityTimelineProps) => {
  const { user } = useAuth() as { user?: User | null };
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [newContent, setNewContent] = useState('');

  const loadPosts = async (p = 1) => {
    setLoading(true);
    try {
      const res = await ApiClient.getCommunityPosts(communityId, { page: p, limit: 10 });
      if (p === 1) setPosts(res.data);
      else setPosts(prev => [...prev, ...res.data]);
      // keep total for pagination
      if (res.pagination && typeof res.pagination.total === 'number') {
        setTotal(res.pagination.total);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts(1);
  }, [communityId]);

  const handleCreate = async () => {
    if (!user) {
      toast.error('Please log in to post');
      return;
    }
    if (!newContent.trim()) {
      toast.error('Please write something');
      return;
    }
    // optimistic UI: add temporary post
    const tempId = `tmp-${Date.now()}`;
    const tempPost: Post = {
      _id: tempId,
      community: communityId,
      user: user as any,
      content: newContent.trim(),
      attachments: [],
      createdAt: new Date().toISOString(),
    };

    setPosts(prev => [tempPost, ...prev]);
    setNewContent('');
    setTotal(prev => (prev !== null ? prev + 1 : prev));

    try {
      const res = await ApiClient.createPost(communityId, { content: tempPost.content });
      // replace temp post with real one
      setPosts(prev => prev.map(p => (p._id === tempId ? res.data : p)));
      toast.success('Post created');
    } catch (err: any) {
      // remove temp post
      setPosts(prev => prev.filter(p => p._id !== tempId));
      setTotal(prev => (prev !== null ? prev - 1 : prev));
      toast.error(err.message || 'Failed to create post');
    }
  };

  const handleDelete = async (postId: string) => {
    if (!user) return;
    if (!confirm('Delete this post?')) return;
    // optimistic remove
    const previous = posts;
    setPosts(prev => prev.filter(p => p._id !== postId));
    setTotal(prev => (prev !== null ? prev - 1 : prev));
    try {
      await ApiClient.deletePost(communityId, postId);
      toast.success('Post deleted');
    } catch (err: any) {
      // revert
      setPosts(previous);
      setTotal(prev => (prev !== null ? prev + 1 : prev));
      toast.error(err.message || 'Failed to delete post');
    }
  };

  const canDelete = (post: Post) => {
    if (!user) return false;
    const postUser = post.user as any;
    const postUserId = typeof postUser === 'string' ? postUser : postUser._id;
    return (
      user._id === postUserId ||
      user.role === 'admin' ||
      (!!communityOwnerId && user._id === communityOwnerId)
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Community Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        {user && (
          <div className="mb-4">
            <Textarea value={newContent} onChange={(e) => setNewContent(e.target.value)} placeholder="Share an update with your community" />
            <div className="flex justify-end mt-2">
              <Button onClick={handleCreate} disabled={!newContent.trim()}>
                <Send className="mr-2 h-4 w-4" /> Post
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {posts.length === 0 && <p className="text-muted-foreground">No posts yet.</p>}
          {posts.map(post => {
            const postUser = post.user as any;
            const name = typeof postUser === 'string' ? 'Member' : postUser.name || 'Member';
            const photoUrl = typeof postUser === 'string' ? undefined : postUser.photoUrl;
            return (
              <div key={post._id} className="flex items-start gap-3 p-3 border rounded">
                <div>
                  {photoUrl ? (
                    <img src={photoUrl} alt={name} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">{(name || 'U').charAt(0)}</div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{name}</div>
                    <div className="text-xs text-muted-foreground">{new Date(post.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="mt-2 text-sm whitespace-pre-wrap">{post.content}</div>
                </div>
                {canDelete(post) && (
                  <div>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(post._id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
          {/* Pagination / Load more */}
          {total !== null && posts.length < total && (
            <div className="flex justify-center mt-4">
              <Button onClick={async () => {
                const next = page + 1;
                setPage(next);
                await loadPosts(next);
              }} disabled={loading}>
                {loading ? 'Loading...' : 'Load more'}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CommunityTimeline;
