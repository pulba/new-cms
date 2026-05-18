import React, { useState, useEffect, useMemo, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Plus, MoreHorizontal, Loader2, Search, Users, ShieldCheck, ShieldAlert, UserX,
  LogOut, Shield, UserPlus, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

interface UserAccount {
  id: string;
  uid: string | null;
  email: string;
  displayName: string | null;
  photoUrl: string | null;
  role: string | null;
  isActive: boolean | null;
  sessionVersion: number;
  lastLogin: string | null;
  createdAt: string | null;
}

// ─── Helpers (outside component to avoid recreation) ──────────────
const roleBadge = (role: string | null) => {
  const m: Record<string, string> = {
    admin: "bg-blue-50 text-blue-700 ring-blue-200",
    editor: "bg-purple-50 text-purple-700 ring-purple-200",
    operator: "bg-slate-100 text-slate-600 ring-slate-200",
  };
  return m[role || "operator"] || m.operator;
};

const formatDate = (d: string | null) => {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); }
  catch { return d; }
};

// ─── Memoized Row ─────────────────────────────────────────────────
const UserRow = memo(function UserRow({
  u, isSelfUser, isOwnerUser,
  onRoleChange, onRevoke, onSuspend, onReactivate,
}: {
  u: UserAccount;
  isSelfUser: boolean;
  isOwnerUser: boolean;
  onRoleChange: (u: UserAccount) => void;
  onRevoke: (u: UserAccount) => void;
  onSuspend: (u: UserAccount) => void;
  onReactivate: (u: UserAccount) => void;
}) {
  return (
    <TableRow className="hover:bg-blue-50/30 transition-colors group">
      <TableCell className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm ring-2 ring-slate-100 shrink-0">
            {u.photoUrl ? (
              <img src={u.photoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-blue-100 flex items-center justify-center text-blue-700 font-black text-sm">
                {(u.displayName || u.email).charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slate-900 text-sm truncate">{u.displayName || u.email.split("@")[0]}</p>
            <p className="text-xs text-slate-400 truncate">{u.email}</p>
          </div>
        </div>
      </TableCell>
      <TableCell className="px-4 py-4">
        {u.uid ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-50 text-green-700 ring-1 ring-green-200">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>Google Connected
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 ring-1 ring-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>Belum Login
          </span>
        )}
      </TableCell>
      <TableCell className="px-4 py-4">
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ring-1 ${roleBadge(u.role)}`}>
          {u.role || "operator"}
        </span>
      </TableCell>
      <TableCell className="px-4 py-4">
        {u.isActive ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>Aktif
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-50 text-red-600">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>Suspended
          </span>
        )}
      </TableCell>
      <TableCell className="px-4 py-4 text-xs text-slate-500 font-medium">{formatDate(u.lastLogin)}</TableCell>
      <TableCell className="px-4 py-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem disabled={isSelfUser || isOwnerUser} onClick={() => onRoleChange(u)}>
              <Shield className="h-4 w-4 mr-2" />Ubah Role
            </DropdownMenuItem>
            <DropdownMenuItem disabled={isSelfUser} onClick={() => onRevoke(u)}>
              <LogOut className="h-4 w-4 mr-2" />Paksa Logout
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {u.isActive ? (
              <DropdownMenuItem disabled={isSelfUser || isOwnerUser} className="text-red-600 focus:text-red-600"
                onClick={() => onSuspend(u)}>
                <UserX className="h-4 w-4 mr-2" />Nonaktifkan Akun
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem disabled={isSelfUser || isOwnerUser} className="text-emerald-600 focus:text-emerald-600"
                onClick={() => onReactivate(u)}>
                <RefreshCw className="h-4 w-4 mr-2" />Aktifkan Kembali
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
});

interface Props {
  currentUserId: string;
  ownerEmail: string;
  initialUsers?: UserAccount[];
}

export function UserManager({ currentUserId, ownerEmail, initialUsers }: Props) {
  const [userList, setUserList] = useState<UserAccount[]>(initialUsers || []);
  const [isLoading, setIsLoading] = useState(!initialUsers);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Add user modal
  const [addOpen, setAddOpen] = useState(false);
  const [addDisplayName, setAddDisplayName] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addRole, setAddRole] = useState("operator");
  const [isSaving, setIsSaving] = useState(false);

  // Role change modal
  const [roleTarget, setRoleTarget] = useState<UserAccount | null>(null);
  const [newRole, setNewRole] = useState("operator");

  // Confirm modal
  const [confirmAction, setConfirmAction] = useState<{ user: UserAccount; type: "suspend" | "reactivate" | "revoke" } | null>(null);
  const [isActing, setIsActing] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error();
      setUserList(await res.json());
    } catch {
      toast.error("Gagal memuat data pengguna");
    } finally {
      setIsLoading(false);
    }
  };

  // Only fetch on mount if no SSR data was provided
  useEffect(() => {
    if (!initialUsers) fetchUsers();
  }, []);

  // Stats
  const stats = useMemo(() => ({
    total: userList.length,
    admin: userList.filter(u => u.role === "admin").length,
    editorOp: userList.filter(u => u.role === "editor" || u.role === "operator").length,
    suspended: userList.filter(u => !u.isActive).length,
  }), [userList]);

  // Filtered list
  const filtered = useMemo(() => userList.filter(u => {
    const q = debouncedSearch.toLowerCase();
    const matchSearch = !q || u.email.toLowerCase().includes(q) || (u.displayName || "").toLowerCase().includes(q);
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    const matchStatus = statusFilter === "all" || (statusFilter === "active" ? u.isActive : !u.isActive);
    return matchSearch && matchRole && matchStatus;
  }), [userList, debouncedSearch, roleFilter, statusFilter]);

  // Guards (memoized)
  const isSelf = useCallback((u: UserAccount) => u.id === currentUserId, [currentUserId]);
  const isOwner = useCallback((u: UserAccount) => u.email.toLowerCase() === (ownerEmail || "").toLowerCase(), [ownerEmail]);

  // Row action callbacks (stable references for React.memo)
  const handleRowRoleChange = useCallback((u: UserAccount) => { setRoleTarget(u); setNewRole(u.role || "operator"); }, []);
  const handleRowRevoke = useCallback((u: UserAccount) => setConfirmAction({ user: u, type: "revoke" }), []);
  const handleRowSuspend = useCallback((u: UserAccount) => setConfirmAction({ user: u, type: "suspend" }), []);
  const handleRowReactivate = useCallback((u: UserAccount) => setConfirmAction({ user: u, type: "reactivate" }), []);

  // ─── Actions ────────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!addEmail.trim()) { toast.error("Email wajib diisi"); return; }
    setIsSaving(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: addEmail, role: addRole, displayName: addDisplayName.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Gagal"); return; }
      toast.success("Akun berhasil didaftarkan");
      setAddOpen(false); setAddDisplayName(""); setAddEmail(""); setAddRole("operator");
      fetchUsers();
    } catch { toast.error("Gagal mendaftarkan akun"); }
    finally { setIsSaving(false); }
  };

  const handleRoleChange = async () => {
    if (!roleTarget) return;
    setIsActing(true);
    try {
      const res = await fetch(`/api/users/${roleTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "updateRole", role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Gagal"); return; }
      toast.success("Role berhasil diubah");
      setRoleTarget(null); fetchUsers();
    } catch { toast.error("Gagal mengubah role"); }
    finally { setIsActing(false); }
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    setIsActing(true);
    const { user, type } = confirmAction;
    try {
      let res: Response;
      if (type === "revoke") {
        res = await fetch(`/api/users/${user.id}/revoke`, { method: "POST" });
      } else {
        res = await fetch(`/api/users/${user.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: type }),
        });
      }
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Gagal"); return; }
      const msgs = { suspend: "Akun dinonaktifkan", reactivate: "Akun diaktifkan kembali", revoke: "Sesi berhasil di-revoke" };
      toast.success(msgs[type]);
      setConfirmAction(null); fetchUsers();
    } catch { toast.error("Aksi gagal"); }
    finally { setIsActing(false); }
  };

  // Helpers moved outside component as pure functions (roleBadge, formatDate)

  // ─── Render ─────────────────────────────────────────────────────
  return (
    <div className="space-y-8 p-6 lg:p-8 bg-slate-50/30 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Pengguna & Akses</h2>
          <p className="text-slate-500 font-medium">Kelola akun admin, editor, dan operator CMS sekolah Anda.</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="bg-blue-700 hover:bg-blue-800 shadow-md h-11 px-6 rounded-xl gap-2 font-semibold">
          <UserPlus className="h-5 w-5" /> Daftarkan Akun
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {[
          { label: "Total Akun", value: stats.total, icon: Users, color: "bg-blue-50 text-blue-700" },
          { label: "Administrator", value: stats.admin, icon: ShieldCheck, color: "bg-emerald-50 text-emerald-600" },
          { label: "Editor & Operator", value: stats.editorOp, icon: Shield, color: "bg-purple-50 text-purple-600" },
          { label: "Suspended", value: stats.suspended, icon: ShieldAlert, color: "bg-red-50 text-red-600" },
        ].map(s => (
          <div key={s.label} className="bg-white p-5 lg:p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className={`w-12 h-12 flex items-center justify-center rounded-xl ${s.color}`}>
              <s.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
              <p className="text-2xl font-black text-slate-900">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3 bg-slate-50/30">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Cari email atau nama..." value={search} onChange={e => setSearch(e.target.value)}
                className="pl-9 h-10 bg-white border-slate-200 rounded-xl text-sm" />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[130px] h-10 rounded-xl text-sm"><SelectValue placeholder="Role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Role</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="operator">Operator</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px] h-10 rounded-xl text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <button onClick={fetchUsers} className="text-slate-400 hover:text-blue-600 p-2 rounded-lg hover:bg-slate-100 transition-colors" title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                <TableHead className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest text-slate-400">Pengguna</TableHead>
                <TableHead className="px-4 py-4 font-bold text-[10px] uppercase tracking-widest text-slate-400">Identitas</TableHead>
                <TableHead className="px-4 py-4 font-bold text-[10px] uppercase tracking-widest text-slate-400">Role</TableHead>
                <TableHead className="px-4 py-4 font-bold text-[10px] uppercase tracking-widest text-slate-400">Status</TableHead>
                <TableHead className="px-4 py-4 font-bold text-[10px] uppercase tracking-widest text-slate-400">Login Terakhir</TableHead>
                <TableHead className="px-4 py-4 w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="h-32 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" /></TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="h-32 text-center text-slate-400 font-medium">{search ? "Tidak ditemukan." : "Belum ada pengguna."}</TableCell></TableRow>
              ) : filtered.map(u => (
                <UserRow
                  key={u.id}
                  u={u}
                  isSelfUser={isSelf(u)}
                  isOwnerUser={isOwner(u)}
                  onRoleChange={handleRowRoleChange}
                  onRevoke={handleRowRevoke}
                  onSuspend={handleRowSuspend}
                  onReactivate={handleRowReactivate}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ─── Add User Modal ──────────────────────────────────────── */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[440px] rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Daftarkan Akun Baru</DialogTitle>
            <DialogDescription className="text-slate-500 font-medium">
              Akun akan dibuat dengan status aktif. Pengguna bisa login menggunakan Google setelah didaftarkan.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nama Tampilan</Label>
              <Input placeholder="Nama staf (opsional)" value={addDisplayName} onChange={e => setAddDisplayName(e.target.value)}
                className="rounded-xl h-11" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Email Google *</Label>
              <Input placeholder="nama@gmail.com" value={addEmail} onChange={e => setAddEmail(e.target.value)}
                className="rounded-xl h-11" type="email" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Role</Label>
              <Select value={addRole} onValueChange={setAddRole}>
                <SelectTrigger className="rounded-xl h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="operator">Operator</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setAddOpen(false)} className="rounded-xl font-bold text-slate-500">Batal</Button>
            <Button onClick={handleAdd} disabled={isSaving} className="bg-blue-700 hover:bg-blue-800 rounded-xl font-bold px-8">
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Daftarkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Role Change Modal ───────────────────────────────────── */}
      <Dialog open={!!roleTarget} onOpenChange={() => setRoleTarget(null)}>
        <DialogContent className="sm:max-w-[400px] rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Ubah Role</DialogTitle>
            <DialogDescription className="font-medium text-slate-500">
              {roleTarget?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger className="rounded-xl h-11"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="operator">Operator</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setRoleTarget(null)} className="rounded-xl font-bold text-slate-500">Batal</Button>
            <Button onClick={handleRoleChange} disabled={isActing} className="bg-blue-700 hover:bg-blue-800 rounded-xl font-bold px-8">
              {isActing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Confirm Action Modal ────────────────────────────────── */}
      <Dialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <DialogContent className="sm:max-w-[420px] rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className={`text-xl font-bold ${confirmAction?.type === "reactivate" ? "text-emerald-600" : "text-red-600"}`}>
              {confirmAction?.type === "suspend" && "Nonaktifkan Akun?"}
              {confirmAction?.type === "reactivate" && "Aktifkan Kembali?"}
              {confirmAction?.type === "revoke" && "Paksa Logout?"}
            </DialogTitle>
            <DialogDescription className="font-medium">
              {confirmAction?.type === "suspend" && `Akun ${confirmAction.user.email} akan dinonaktifkan dan semua sesi aktif akan di-revoke secara otomatis.`}
              {confirmAction?.type === "reactivate" && `Akun ${confirmAction?.user.email} akan diaktifkan kembali dan bisa login ulang.`}
              {confirmAction?.type === "revoke" && `Semua sesi aktif ${confirmAction?.user.email} di semua perangkat akan diputus. Akun tetap aktif.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2">
            <Button variant="ghost" onClick={() => setConfirmAction(null)} className="rounded-xl font-bold">Batal</Button>
            <Button onClick={handleConfirmAction} disabled={isActing}
              className={`rounded-xl font-bold px-8 ${confirmAction?.type === "reactivate" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}`}>
              {isActing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {confirmAction?.type === "suspend" && "Ya, Nonaktifkan"}
              {confirmAction?.type === "reactivate" && "Ya, Aktifkan"}
              {confirmAction?.type === "revoke" && "Ya, Logout Paksa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
