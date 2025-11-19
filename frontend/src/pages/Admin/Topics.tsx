import { useEffect, useState } from 'react';
import { ApiClient } from '@/lib/api';
import { Topic } from '@/types/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';

const AdminTopics = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  useEffect(() => {
    if (!isAdmin) return;
    loadTopics();
  }, [isAdmin]);

  const loadTopics = async () => {
    setLoading(true);
    try {
      const res = await ApiClient.getTopics();
      setTopics(res.data || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load topics');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const res = await ApiClient.createTopic({ name: newName.trim() });
      toast.success('Topic created');
      setNewName('');
      setTopics((t) => [res.data, ...t]);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create topic');
    }
  };

  const startEdit = (topic: Topic) => {
    setEditingId(topic._id);
    setEditingName(topic.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      const res = await ApiClient.updateTopic(editingId, { name: editingName.trim() });
      setTopics((t) => t.map((it) => (it._id === editingId ? res.data : it)));
      toast.success('Topic updated');
      cancelEdit();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update topic');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this topic? This will not remove it from existing communities.')) return;
    try {
      await ApiClient.deleteTopic(id);
      setTopics((t) => t.filter((it) => it._id !== id));
      toast.success('Topic deleted');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete topic');
    }
  };

  if (!isAdmin) {
    return <div className="p-6">You are not authorized to view this page.</div>;
  }

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-4">Manage Topics</h1>

      <div className="mb-6 flex gap-2">
        <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New topic name" />
        <Button onClick={handleCreate}>Create</Button>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="space-y-2">
          {topics.map((topic) => (
            <div key={topic._id} className="flex items-center justify-between gap-4 p-3 bg-card rounded">
              <div className="flex-1">
                {editingId === topic._id ? (
                  <Input value={editingName} onChange={(e) => setEditingName(e.target.value)} />
                ) : (
                  <div className="font-medium">{topic.name}</div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {editingId === topic._id ? (
                  <>
                    <Button size="sm" onClick={saveEdit}>Save</Button>
                    <Button variant="ghost" size="sm" onClick={cancelEdit}>Cancel</Button>
                  </>
                ) : (
                  <>
                    <Button size="sm" onClick={() => startEdit(topic)}>Edit</Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(topic._id)}>Delete</Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminTopics;
