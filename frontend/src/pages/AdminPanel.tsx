import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import {
  AuditLogEntry,
  UserAccount,
  getAuditLogs,
  listUsers,
  updateUserRole,
} from "../services/api";

const ROLES = ["viewer", "analyst", "admin"];

const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const [u, l] = await Promise.all([listUsers(), getAuditLogs()]);
      setUsers(u.data);
      setLogs(l.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to load admin data");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleRoleChange = async (userId: number, role: string) => {
    await updateUserRole(userId, role);
    await load();
  };

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-8 space-y-8">
        <header>
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <p className="text-slate-400 text-sm">User roles & audit trail</p>
        </header>

        {error && <p className="text-shield-danger text-sm">{error}</p>}

        <div className="bg-[var(--color-panel)] border border-[var(--color-border)] rounded-xl p-6">
          <h2 className="font-semibold mb-4">Users</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-[var(--color-border)]">
                <th className="pb-2">Name</th>
                <th className="pb-2">Email</th>
                <th className="pb-2">Role</th>
                <th className="pb-2">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-[var(--color-border)]/50">
                  <td className="py-2">{u.name}</td>
                  <td className="py-2">{u.email}</td>
                  <td className="py-2">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="bg-[var(--color-input)] border border-[var(--color-border)] rounded px-2 py-1 text-sm"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 text-slate-400">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-[var(--color-panel)] border border-[var(--color-border)] rounded-xl p-6">
          <h2 className="font-semibold mb-4">Audit Log</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-[var(--color-border)]">
                <th className="pb-2">Action</th>
                <th className="pb-2">User</th>
                <th className="pb-2">Detail</th>
                <th className="pb-2">Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-b border-[var(--color-border)]/50">
                  <td className="py-2 capitalize">{l.action.replace(/_/g, " ")}</td>
                  <td className="py-2 text-slate-400">{l.user_email || "—"}</td>
                  <td className="py-2 text-slate-400">{l.detail || "—"}</td>
                  <td className="py-2 text-slate-500">
                    {new Date(l.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-slate-500">
                    No audit entries yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;
