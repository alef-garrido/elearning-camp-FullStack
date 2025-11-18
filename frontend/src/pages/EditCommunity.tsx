import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ApiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Community } from '@/types/api';
import { useAuth } from '@/hooks/use-auth';

const EditCommunity = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await ApiClient.getCommunity(id!);
        setCommunity(res.data);
        setName(res.data.name);
        setDescription(res.data.description);
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
    const isOwner = community.user === user._id || (typeof community.user === 'object' && (community.user as any)._id === user._id);
    if (!isOwner && !isAdmin) {
      toast.error('Not authorized to edit this community');
      navigate('/my-communities');
    }
  }, [community, user, isAdmin, navigate]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { name, description } as any;
      const res = await ApiClient.updateCommunity(id!, payload);
      toast.success('Community updated');
      navigate(`/communities/${res.data._id}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update community');
    } finally {
      setSaving(false);
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
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
                <Button variant="outline" onClick={() => navigate('/my-communities')}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EditCommunity;
