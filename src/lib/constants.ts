import { 
  LayoutDashboard, 
  Newspaper, 
  School, 
  Users, 
  Image, 
  Settings, 
  Bell,
  Home,
  LogOut,
  Mail,
  UsersRound,
  LayoutTemplate
} from "lucide-react";

export const MENU_ITEMS = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Banner & Gallery",
    href: "/admin/banners",
    icon: LayoutTemplate,
  },
  {
    title: "Berita",
    href: "/admin/posts",
    icon: Newspaper,
  },
  {
    title: "Profil Sekolah",
    href: "/admin/settings",
    icon: School,
  },
  {
    title: "Guru & Staff",
    href: "/admin/staff",
    icon: Users,
  },
  {
    title: "Pengurus OSIS",
    href: "/admin/osis",
    icon: UsersRound,
  },
  {
    title: "Media Library",
    href: "/admin/media",
    icon: Image,
  },
  {
    title: "Pengumuman",
    href: "/admin/announcements",
    icon: Bell,
  },
  {
    title: "Pesan Masuk",
    href: "/admin/inbox",
    icon: Mail,
  },
  {
    title: "Pengaturan",
    href: "/admin/settings",
    icon: Settings,
  },
];

