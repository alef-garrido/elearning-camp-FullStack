import { useEffect, useState } from 'react';
import { ApiClient } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import UserSearch from '@/components/UserSearch';

const AuditLogs = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const [action, setAction] = useState('');
  const [resourceType, setResourceType] = useState('');
  const [performedBy, setPerformedBy] = useState<string | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAdmin) navigate('/');
  }, [isAdmin, navigate]);

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const res = await ApiClient.getAuditLogs({ action: action || undefined, resourceType: resourceType || undefined, performedBy: performedBy || undefined, page: p, limit });
      setLogs(res.data || []);
      setTotal(res.pagination ? res.pagination.total : 0);
      setPage(p);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(1); }, []);

  const handleSelectUser = (user: any) => {
    setPerformedBy(user._id);
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Audit Logs</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
        <Input placeholder="Action (e.g. transfer_ownership)" value={action} onChange={(e:any) => setAction(e.target.value)} />
        <Input placeholder="Resource Type (e.g. Community)" value={resourceType} onChange={(e:any) => setResourceType(e.target.value)} />
        <div>
          <div className="text-sm mb-1">Performed By (admin)</div>
          <UserSearch onSelect={handleSelectUser} />
          {performedBy && <div className="text-sm text-muted-foreground mt-1">Filtering by user id: {performedBy}</div>}
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <Button onClick={() => load(1)} disabled={loading}>{loading ? 'Loading...' : 'Apply Filters'}</Button>
        <Button variant="outline" onClick={() => { setAction(''); setResourceType(''); setPerformedBy(null); load(1); }}>Reset</Button>
      </div>

      <div className="space-y-2">
        {logs.map((l:any) => (
          <div key={l._id} className="border rounded p-3">
            <div className="flex justify-between">
              <div>
                <div className="font-medium">{l.action} — {l.resourceType} {l.resourceId}</div>
                <div className="text-sm text-muted-foreground">By: {l.performedBy?.name || l.performedBy || 'unknown'} ({l.performedBy?.email || ''})</div>
                <div className="text-sm mt-2">When: {new Date(l.createdAt).toLocaleString()}</div>
              </div>
              <div className="text-sm text-muted-foreground">Prev: {JSON.stringify(l.previousValue)}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center mt-4">
        <div>Showing {logs.length} of {total}</div>
        <div className="flex gap-2">
          <Button onClick={() => load(Math.max(1, page - 1))} disabled={page === 1}>Previous</Button>
          <Button onClick={() => load(page + 1)} disabled={logs.length === 0 || (page * limit) >= total}>Next</Button>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
