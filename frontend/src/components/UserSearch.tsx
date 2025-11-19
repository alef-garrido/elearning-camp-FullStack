import React, { useEffect, useMemo, useState } from 'react';
import { ApiClient } from '@/lib/api';
import { User } from '@/types/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type Props = {
  onSelect: (user: User) => void;
  excludeUserId?: string;
};

const UserSearch: React.FC<Props> = ({ onSelect, excludeUserId }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        // Load first page with a reasonably large limit. Admins can refine with the search box.
        const res = await ApiClient.getUsers({ page: 1, limit: 200 } as any);
        if (!mounted) return;
        setUsers(res.data || []);
      } catch (e) {
        // swallow; parent should handle errors if necessary
        console.error('Failed to load users for search', e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (excludeUserId && u._id === excludeUserId) return false;
      if (!q) return true;
      return (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
    }).slice(0, 50);
  }, [users, query, excludeUserId]);

  return (
    <div>
      <div className="mb-2">
        <Input placeholder="Search users by name or email" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      <div className="max-h-60 overflow-auto border rounded-md p-2 bg-card">
        {loading && <div className="text-sm text-muted-foreground">Loading users...</div>}
        {!loading && filtered.length === 0 && <div className="text-sm text-muted-foreground">No users found</div>}
        {!loading && filtered.map((u) => (
          <div key={u._id} className="flex items-center justify-between gap-2 py-2 border-b last:border-b-0">
            <div>
              <div className="font-medium">{u.name}</div>
              <div className="text-sm text-muted-foreground">{u.email} • {u.role}</div>
            </div>
            <div>
              <Button size="sm" onClick={() => onSelect(u)}>Select</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserSearch;
