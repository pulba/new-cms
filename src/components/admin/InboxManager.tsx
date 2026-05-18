import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Trash2, Loader2, Mail, MailOpen, Calendar, User, Search } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

interface InboxMessage {
  id: number;
  name: string;
  email: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export function InboxManager() {
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Read message dialog
  const [selectedMsg, setSelectedMsg] = useState<InboxMessage | null>(null);

  // Delete states
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const markAsRead = async (msg: InboxMessage) => {
    setSelectedMsg(msg);
    if (!msg.isRead) {
      try {
        await fetch(`/api/inbox/${msg.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isRead: true }),
        });
        
        // Update local state silently
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, isRead: true } : m))
        );
      } catch {
        console.error("Failed to mark as read");
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/inbox/${deleteId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Pesan dihapus");
        setSelectedMsg(null); // Close read dialog if open
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

  const filteredMessages = messages.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      m.message.toLowerCase().includes(search.toLowerCase())
  );

  const unreadCount = messages.filter(m => !m.isRead).length;

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-140px)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            Pesan Masuk 
            {unreadCount > 0 && (
              <Badge variant="destructive" className="rounded-full px-2">
                {unreadCount} Baru
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground text-sm">
            Kelola pesan atau pertanyaan dari pengunjung website.
          </p>
        </div>
        
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama, email, pesan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Messages Layout */}
      <div className="flex-1 border rounded-md overflow-hidden bg-background shadow-sm flex flex-col md:flex-row min-h-0">
        
        {/* Left List */}
        <div className="w-full md:w-1/3 border-r flex flex-col min-h-0">
          <div className="p-3 bg-muted/50 border-b font-medium text-sm flex items-center justify-between shrink-0">
            <span>Daftar Pesan</span>
            <span className="text-muted-foreground">{filteredMessages.length} pesan</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <p className="text-sm">Tidak ada pesan ditemukan.</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredMessages.map((msg) => (
                  <button
                    key={msg.id}
                    onClick={() => markAsRead(msg)}
                    className={`w-full text-left p-4 hover:bg-muted/50 transition-colors ${
                      selectedMsg?.id === msg.id ? "bg-muted" : ""
                    } ${!msg.isRead ? "bg-primary/5" : ""}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-sm truncate pr-2 ${!msg.isRead ? "font-bold text-foreground" : "font-medium text-foreground/80"}`}>
                        {msg.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground shrink-0 whitespace-nowrap">
                        {new Date(msg.createdAt).toLocaleDateString("id-ID", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground truncate mb-1">
                      {msg.email}
                    </div>
                    <p className={`text-xs line-clamp-2 ${!msg.isRead ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                      {msg.message}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Detail Pane */}
        <div className="hidden md:flex flex-1 flex-col bg-card min-h-0 overflow-y-auto">
          {selectedMsg ? (
            <div className="flex flex-col h-full">
              {/* Toolbar */}
              <div className="flex justify-end p-2 border-b bg-muted/30 shrink-0">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setDeleteId(selectedMsg.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Hapus
                </Button>
              </div>
              
              {/* Message Content */}
              <div className="p-6 md:p-8 flex-1 overflow-y-auto">
                <h2 className="text-xl font-bold mb-6">Pesan dari Pengunjung</h2>
                
                <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-4 text-sm mb-8 bg-muted/30 p-4 rounded-lg border">
                  <div className="font-semibold text-muted-foreground flex items-center gap-2">
                    <User className="h-4 w-4" /> Pengirim
                  </div>
                  <div>
                    <span className="font-medium">{selectedMsg.name}</span>
                    <br/>
                    <a href={`mailto:${selectedMsg.email}`} className="text-green-700 hover:underline">
                      {selectedMsg.email}
                    </a>
                  </div>

                  <div className="font-semibold text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> Tanggal
                  </div>
                  <div>
                    {new Date(selectedMsg.createdAt).toLocaleString("id-ID", { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>

                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="whitespace-pre-wrap leading-relaxed text-[15px]">
                    {selectedMsg.message}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
              <Mail className="h-16 w-16 opacity-20 mb-4" />
              <p>Pilih pesan di sebelah kiri untuk membaca detailnya.</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile detail dialog (shows up when clicking a message on small screens) */}
      <div className="md:hidden">
        <Dialog open={!!selectedMsg && window.innerWidth < 768} onOpenChange={(open) => !open && setSelectedMsg(null)}>
          <DialogContent className="max-w-md h-[80vh] flex flex-col p-0 gap-0">
            <DialogHeader className="p-4 border-b shrink-0">
              <DialogTitle>Detail Pesan</DialogTitle>
            </DialogHeader>
            <div className="p-4 flex-1 overflow-y-auto text-sm">
               <div className="mb-4 bg-muted/50 p-3 rounded-lg">
                <p className="font-bold">{selectedMsg?.name}</p>
                <a href={`mailto:${selectedMsg?.email}`} className="text-green-700 hover:underline">{selectedMsg?.email}</a>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedMsg?.createdAt && new Date(selectedMsg.createdAt).toLocaleString("id-ID")}
                </p>
               </div>
               <p className="whitespace-pre-wrap">{selectedMsg?.message}</p>
            </div>
            <DialogFooter className="p-4 border-t shrink-0 flex sm:justify-between">
              <Button 
                variant="destructive" 
                onClick={() => {
                  if(selectedMsg) setDeleteId(selectedMsg.id);
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" /> Hapus
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Delete Confirmation */}
      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Pesan?</DialogTitle>
            <DialogDescription>
              Pesan ini akan dihapus secara permanen.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
