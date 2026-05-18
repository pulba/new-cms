import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Trash2,
  Loader2,
  Mail,
  MailOpen,
  Calendar,
  User,
  Search,
  Archive,
  ArchiveRestore,
  Phone,
  ArrowLeft,
  CheckCircle2,
  MessageCircle,
  Send
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface InboxMessage {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  isRead: boolean;
  isArchived: boolean;
  createdAt: string;
}

export function InboxMasterDetail() {
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Selection
  const [selectedMsg, setSelectedMsg] = useState<InboxMessage | null>(null);

  // Actions states
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [replyText, setReplyText] = useState("");

  const fetchMessages = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/inbox");
      const data = await res.json();
      setMessages(data);
    } catch {
      toast.error("Gagal memuat pesan masuk");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleSelect = async (msg: InboxMessage) => {
    setSelectedMsg(msg);
    if (!msg.isRead) {
      try {
        await fetch(`/api/inbox/${msg.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isRead: true }),
        });
        
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, isRead: true } : m))
        );
      } catch (err) {
        console.error("Failed to mark as read", err);
      }
    }
  };

  const toggleArchive = async (msg: InboxMessage) => {
    setIsActionLoading(true);
    try {
      const newStatus = !msg.isArchived;
      await fetch(`/api/inbox/${msg.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: newStatus }),
      });
      
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, isArchived: newStatus } : m))
      );
      
      if (selectedMsg?.id === msg.id) {
        setSelectedMsg({ ...msg, isArchived: newStatus });
      }
      
      toast.success(newStatus ? "Pesan diarsipkan" : "Pesan dipindahkan ke Inbox");
    } catch {
      toast.error("Gagal memperbarui status pesan");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/inbox/${deleteId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Pesan dihapus");
        if (selectedMsg?.id === deleteId) setSelectedMsg(null);
        fetchMessages();
      } else {
        toast.error("Gagal menghapus");
      }
    } catch {
      toast.error("Gagal menghapus pesan");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const filteredMessages = messages.filter((m) => {
    // Tab filtering
    if (activeTab === "unread") if (m.isRead || m.isArchived) return false;
    if (activeTab === "archived") if (!m.isArchived) return false;
    if (activeTab === "all") if (m.isArchived) return false; // Default 'all' shows non-archived

    // Search filtering
    const searchLower = search.toLowerCase();
    return (
      m.name.toLowerCase().includes(searchLower) ||
      m.email.toLowerCase().includes(searchLower) ||
      m.subject.toLowerCase().includes(searchLower) ||
      m.message.toLowerCase().includes(searchLower)
    );
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const formatDateShort = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    if (days === 1) return "Kemarin";
    if (days < 7) return date.toLocaleDateString("id-ID", { weekday: "short" });
    return date.toLocaleDateString("id-ID", { month: "short", day: "numeric" });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      
      {/* Top Header / Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b p-4 gap-4 bg-slate-50/50">
        <div className="flex items-center gap-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
            <TabsList className="bg-slate-200/50 h-9 p-0.5 rounded-lg">
              <TabsTrigger value="all" className="rounded-md px-4 py-1.5 text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-blue-900">
                Semua
              </TabsTrigger>
              <TabsTrigger value="unread" className="rounded-md px-4 py-1.5 text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-blue-900">
                Belum Dibaca
              </TabsTrigger>
              <TabsTrigger value="archived" className="rounded-md px-4 py-1.5 text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-blue-900">
                Arsip
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Cari pesan, pengirim, atau subjek..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 bg-white border-slate-300 rounded-xl text-sm focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        
        {/* LEFT COLUMN: Message List */}
        <div className={cn(
          "w-full md:w-[380px] border-r flex flex-col transition-all duration-300 bg-white z-10",
          selectedMsg ? "hidden md:flex" : "flex"
        )}>
          <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center p-12 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="text-xs text-slate-400 font-medium">Memuat pesan...</p>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-8 w-8 text-slate-300" />
                </div>
                <p className="text-sm font-bold text-slate-900">Tidak ada pesan</p>
                <p className="text-xs text-slate-500 mt-1">Inbox Anda sedang bersih.</p>
              </div>
            ) : (
              filteredMessages.map((msg) => (
                <button
                  key={msg.id}
                  onClick={() => handleSelect(msg)}
                  className={cn(
                    "w-full text-left p-4 hover:bg-slate-50/80 transition-all border-l-4",
                    selectedMsg?.id === msg.id 
                      ? "bg-blue-50/50 border-l-blue-600 shadow-[inset_0_0_10px_rgba(37,99,235,0.02)]" 
                      : "border-l-transparent",
                    !msg.isRead && "bg-blue-50/30"
                  )}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={cn(
                      "text-sm truncate pr-2",
                      !msg.isRead ? "font-bold text-slate-900" : "font-semibold text-slate-700"
                    )}>
                      {msg.name}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 shrink-0 uppercase tracking-tighter">
                      {formatDateShort(msg.createdAt)}
                    </span>
                  </div>
                  <div className={cn(
                    "text-xs truncate mb-1",
                    !msg.isRead ? "font-bold text-blue-700" : "font-medium text-slate-500"
                  )}>
                    {msg.subject || "(Tanpa Subjek)"}
                  </div>
                  <p className={cn(
                    "text-xs line-clamp-1",
                    !msg.isRead ? "text-slate-700 font-medium" : "text-slate-400 font-normal"
                  )}>
                    {msg.message}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Reader */}
        <div className={cn(
          "flex-1 flex flex-col bg-slate-50/30 min-w-0 transition-all duration-300",
          !selectedMsg ? "hidden md:flex" : "flex"
        )}>
          {selectedMsg ? (
            <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
              
              {/* Reader Toolbar */}
              <div className="flex items-center justify-between px-6 py-4 border-b bg-white shrink-0">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden -ml-2 h-8 w-8"
                    onClick={() => setSelectedMsg(null)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 px-3 text-xs font-bold rounded-lg border-slate-300 hover:bg-slate-50 gap-2"
                      onClick={() => toggleArchive(selectedMsg)}
                      disabled={isActionLoading}
                    >
                      {selectedMsg.isArchived ? (
                        <>
                          <ArchiveRestore className="h-4 w-4 text-blue-600" />
                          Pindahkan ke Inbox
                        </>
                      ) : (
                        <>
                          <Archive className="h-4 w-4 text-slate-500" />
                          Arsipkan
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 px-3 text-xs font-bold rounded-lg border-slate-300 hover:bg-red-50 hover:text-red-600 hover:border-red-100 gap-2"
                      onClick={() => setDeleteId(selectedMsg.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Hapus
                    </Button>
                  </div>
                </div>
              </div>

              {/* Reader Content */}
              <div className="flex-1 overflow-y-auto p-6 md:p-10">
                <div className="max-w-3xl mx-auto">
                  
                  {/* Subject Header */}
                  <div className="mb-8">
                    <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight mb-4">
                      {selectedMsg.subject || "(Tanpa Subjek)"}
                    </h2>
                    
                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                      <div className="w-12 h-12 rounded-xl bg-blue-900 flex items-center justify-center text-white font-bold text-lg shrink-0">
                        {getInitials(selectedMsg.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                          <span className="font-bold text-slate-900 truncate">{selectedMsg.name}</span>
                          <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border">
                            {new Date(selectedMsg.createdAt).toLocaleString("id-ID", {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                          <a href={`mailto:${selectedMsg.email}`} className="text-blue-600 hover:underline flex items-center gap-1.5 font-medium">
                            <Mail className="h-3.5 w-3.5" />
                            {selectedMsg.email}
                          </a>
                          {selectedMsg.phone && (
                            <a href={`tel:${selectedMsg.phone}`} className="text-slate-500 hover:text-slate-700 flex items-center gap-1.5 font-medium">
                              <Phone className="h-3.5 w-3.5" />
                              {selectedMsg.phone}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Message Text */}
                  <div className="bg-white p-8 md:p-10 rounded-2xl border border-slate-100 shadow-sm min-h-[300px]">
                    <div className="prose prose-slate max-w-none">
                      <p className="whitespace-pre-wrap text-[16px] leading-[1.8] text-slate-700">
                        {selectedMsg.message}
                      </p>
                    </div>
                  </div>

                  {/* Reply Compose Section */}
                  <div className="mt-8 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm font-bold text-slate-900">Balas via WhatsApp</span>
                    </div>
                    <div className="p-4">
                      <Textarea
                        placeholder="Tulis balasan Anda di sini..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        rows={4}
                        className="border-slate-300 rounded-xl resize-none focus:ring-emerald-500 focus:border-emerald-500 text-[15px] leading-relaxed"
                      />
                      <div className="flex items-center justify-between mt-4">
                        <p className="text-[11px] text-slate-400">
                          {selectedMsg.phone
                            ? `Akan dikirim ke ${selectedMsg.phone}`
                            : "⚠️ Pengirim tidak menyertakan nomor HP"}
                        </p>
                        <Button
                          className="bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold gap-2 px-6 shadow-sm"
                          disabled={!replyText.trim() || !selectedMsg.phone}
                          onClick={() => {
                            let phone = selectedMsg.phone || '';
                            phone = phone.replace(/[^0-9]/g, '');
                            if (phone.startsWith('0')) phone = '62' + phone.slice(1);
                            const text = encodeURIComponent(`Halo ${selectedMsg.name},\n\n${replyText}\n\n---\n_Balasan untuk: ${selectedMsg.subject}_`);
                            window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
                          }}
                        >
                          <Send className="h-4 w-4" />
                          Kirim via WhatsApp
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Footer */}
                  <div className="mt-6 flex items-center justify-center">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                      <CheckCircle2 size={14} className="text-emerald-500" />
                      Pesan diterima dengan aman via Website Sekolah
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-300 p-8 animate-in fade-in duration-700">
              <div className="w-24 h-24 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-6">
                <MailOpen className="h-10 w-10 text-slate-200" />
              </div>
              <p className="text-lg font-bold text-slate-900">Pilih Pesan</p>
              <p className="text-sm text-slate-500 mt-1 max-w-[240px] text-center leading-relaxed">
                Pilih pesan di kolom kiri untuk melihat detail komunikasi lengkap.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="rounded-2xl border-none">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">Hapus Pesan?</DialogTitle>
            <DialogDescription className="text-slate-500">
              Pesan ini akan dihapus secara permanen dari database. Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2">
            <Button variant="ghost" onClick={() => setDeleteId(null)} className="rounded-xl font-bold">
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 rounded-xl font-bold gap-2 px-6"
            >
              {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
              Ya, Hapus Permanen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
