import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ApiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Community, User } from '@/types/api';
import { useAuth } from '@/hooks/use-auth';
import UserSearch from '@/components/UserSearch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const EditCommunity = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [topicsInput, setTopicsInput] = useState('');
  const [hasMentorship, setHasMentorship] = useState(false);
  const [hasLiveEvents, setHasLiveEvents] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [publishersInput, setPublishersInput] = useState('');
  

  useEffect(() => {
    const load = async () => {
      try {
        const res = await ApiClient.getCommunity(id!);
          setCommunity(res.data);
          setName(res.data.name);
          setDescription(res.data.description);
          setWebsite(res.data.website || '');
          setPhone(res.data.phone || '');
          setEmail(res.data.email || '');
          setAddress(res.data.address || '');
          setTopicsInput(Array.isArray(res.data.topics) ? res.data.topics.join(', ') : (res.data.topics || ''));
          setHasMentorship(!!res.data.hasMentorship);
          setHasLiveEvents(!!res.data.hasLiveEvents);
          setIsPaid(!!res.data.isPaid);
          setPublishersInput('');
      } catch (err: any) {
        toast.error(err.message || 'Failed to load community');
        navigate('/my-communities');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate]);

  useEffect(() => {
    if (!community || !user) return;
    const communityUserId = typeof community.user === 'object' ? (community.user as any)._id : community.user;
    const isOwner = communityUserId === user._id;
    if (!isOwner && !isAdmin) {
      toast.error('Not authorized to edit this community');
      navigate('/my-communities');
    }
  }, [community, user, isAdmin, navigate]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = {
        name,
        description,
        website: website || undefined,
        phone: phone || undefined,
        email: email || undefined,
        address: address || undefined,
        hasMentorship,
        hasLiveEvents,
        isPaid
      };

      if (topicsInput && topicsInput.trim().length > 0) {
        payload.topics = topicsInput.split(',').map((t) => t.trim()).filter(Boolean);
      }

      if (publishersInput && publishersInput.trim().length > 0) {
        // The backend stores the community owner as `user`. We don't persist per-community publishers/admins.
        // If you need to make someone the owner, do that manually or via a dedicated admin endpoint.
        // Here we ignore publishersInput on update to avoid changing ownership patterns.
      }

      const res = await ApiClient.updateCommunity(id!, payload);
      toast.success('Community updated');
      navigate(`/communities/${res.data._id}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update community');
    } finally {
      setSaving(false);
    }
  };

  // Admin-only: transfer ownership
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [pendingNewOwner, setPendingNewOwner] = useState<User | null>(null);
  const handleSelectNewOwner = (u: User) => {
    // Open confirmation dialog by setting pending new owner
    setPendingNewOwner(u);
  };

  const handleConfirmTransfer = async () => {
    if (!id || !pendingNewOwner) return;
    setTransferring(true);
    try {
      await ApiClient.updateCommunity(id, { user: pendingNewOwner._id } as any);
      toast.success('Ownership transferred');
      const res = await ApiClient.getCommunity(id);
      setCommunity(res.data);
      setTransferOpen(false);
      setPendingNewOwner(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to transfer ownership');
    } finally {
      setTransferring(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-background"><div className="container py-8 px-4"><div className="h-64 rounded-xl bg-muted animate-pulse mb-6" /></div></div>;

  if (!community) return <div className="min-h-screen bg-background"><div className="container py-12 px-4 text-center"><p className="text-muted-foreground">Community not found</p></div></div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 sm:py-12 px-4">
        <h1 className="text-3xl font-bold mb-4">Edit Community</h1>
        <Card>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="h-32" />
              </div>
              <div>
                <Label htmlFor="website">Website</Label>
                <Input id="website" value={website} onChange={(e) => setWebsite(e.target.value)} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
                </div>
              </div>
              <div>
                <Label htmlFor="topics">Topics (comma separated)</Label>
                <Input id="topics" value={topicsInput} onChange={(e) => setTopicsInput(e.target.value)} />
              </div>
              <div className="flex gap-4 items-center">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={hasMentorship} onChange={(e) => setHasMentorship(e.target.checked)} />
                  <span>Has Mentorship</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={hasLiveEvents} onChange={(e) => setHasLiveEvents(e.target.checked)} />
                  <span>Has Live Events</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={isPaid} onChange={(e) => setIsPaid(e.target.checked)} />
                  <span>Is Paid</span>
                </label>
              </div>
              <div>
                <Label htmlFor="publishers">Publishers (note)</Label>
                <Input id="publishers" value={publishersInput} onChange={(e) => setPublishersInput(e.target.value)} disabled />
                <p className="text-sm text-muted-foreground">The community owner (publisher) is stored as the community `user`. Per-community publisher/admin lists are not used.</p>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
                <Button variant="outline" onClick={() => navigate('/my-communities')}>Cancel</Button>
                {isAdmin && (
                  <Button variant="ghost" onClick={() => setTransferOpen(!transferOpen)}>
                    {transferOpen ? 'Close transfer' : 'Transfer ownership'}
                  </Button>
                )}
              </div>
              {transferOpen && isAdmin && (
                <div className="mt-4">
                  <h3 className="font-medium mb-2">Transfer Ownership (admin)</h3>
                  <UserSearch onSelect={handleSelectNewOwner} excludeUserId={typeof community?.user === 'object' ? (community?.user as any)?._id : community?.user} />
                  {transferring && <div className="text-sm text-muted-foreground mt-2">Transferring...</div>}

                  {/* Confirmation dialog shown when an admin selects a new owner */}
                  <AlertDialog open={!!pendingNewOwner} onOpenChange={(open) => { if (!open) setPendingNewOwner(null); }}>
                    <AlertDialogTrigger asChild>
                      {/* Hidden trigger - dialog controlled by `pendingNewOwner` state */}
                      <div />
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Ownership Transfer</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to transfer ownership of <strong>{community?.name}</strong> to <strong>{pendingNewOwner?.name} ({pendingNewOwner?.email})</strong>? This action will change the community owner.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="flex justify-end gap-3">
                        <AlertDialogCancel onClick={() => setPendingNewOwner(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmTransfer} className="bg-destructive hover:bg-destructive/90">
                          {transferring ? 'Transferring...' : 'Confirm Transfer'}
                        </AlertDialogAction>
                      </div>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EditCommunity;
