import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// Users
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  uid: text('uid').unique(),
  email: text('email').notNull().unique(),
  displayName: text('display_name'),
  photoUrl: text('photo_url'),
  role: text('role', { enum: ['admin', 'editor', 'operator'] }).default('operator'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  sessionVersion: integer('session_version').default(1).notNull(),
  lastLogin: text('last_login'),
  createdAt: text('created_at'),
});

// Categories
export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
});

// Posts (Matches Database/Website schema)
export const posts = sqliteTable('posts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  content: text('content'),
  excerpt: text('excerpt'),
  status: text('status', { enum: ['draft', 'published', 'archived'] }).default('draft'),
  authorId: text('author_id').references(() => users.id),
  featuredImage: text('featured_image'),
  tags: text('tags'),
  metaDescription: text('meta_description'),
  metaKeywords: text('meta_keywords'),
  viewCount: integer('view_count').default(0),
  createdAt: text('created_at'),
  updatedAt: text('updated_at'),
});

// Pages
export const pages = sqliteTable('pages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  content: text('content'),
  status: text('status', { enum: ['draft', 'published'] }).default('draft'),
  authorId: text('author_id').references(() => users.id),
  featuredImage: text('featured_image'),
  metaDescription: text('meta_description'),
  metaKeywords: text('meta_keywords'),
  createdAt: text('created_at'),
  updatedAt: text('updated_at'),
});

// Media
export const media = sqliteTable('media', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  url: text('url').notNull(),
  publicId: text('public_id'),
  type: text('type'),
  size: integer('size'),
  uploadedBy: text('uploaded_by').references(() => users.id),
  createdAt: text('created_at'),
});

// School Profile (Matches Database/Website schema)
export const schoolProfile = sqliteTable('school_profile', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  schoolName: text('school_name').notNull(),
  schoolLogo: text('school_logo').default(''),
  schoolFavicon: text('school_favicon').default(''),
  shortDescription: text('short_description'),
  address: text('address'),
  phone: text('phone'),
  email: text('email'),
  socialFacebook: text('social_facebook'),
  socialInstagram: text('social_instagram'),
  socialYoutube: text('social_youtube'),
  accreditation: text('accreditation'),
  npsn: text('npsn'),
  foundedYear: text('founded_year'),
  curriculum: text('curriculum'),
  historyText: text('history_text'),
  historyImage: text('history_image'),
  profileHeroTitle: text('profile_hero_title'),
  profileHeroSubtitle: text('profile_hero_subtitle'),
  profileHeroImage: text('profile_hero_image'),
  googleMapsEmbedUrl: text('google_maps_embed_url'),
  visionText: text('vision_text').notNull(),
  missionItems: text('mission_items').notNull(),
  principalName: text('principal_name').notNull(),
  principalMessage: text('principal_message').notNull(),
  principalSignature: text('principal_signature').notNull(),
  principalImage: text('principal_image').notNull(),
  principalQuote: text('principal_quote'),
  ppdbIsActive: integer('ppdb_is_active', { mode: 'boolean' }).default(false),
  ppdbTitle: text('ppdb_title'),
  ppdbDescription: text('ppdb_description'),
  
  // Visual Skin / Theme Tokens
  // 10 Human Color Controls
  themeColorPrimary: text('theme_color_primary').default('#00288e'), // 1. Warna Utama
  themeColorBackground: text('theme_color_background').default('#f8fafc'), // 2. Warna Latar Belakang
  themeColorSurface: text('theme_color_surface').default('#ffffff'), // 3. Warna Permukaan Card
  themeColorText: text('theme_color_text').default('#334155'), // 4. Font Color
  themeColorHeading: text('theme_color_heading').default('#0f172a'), // 5. Heading Color
  themeColorLink: text('theme_color_link').default('#00288e'), // 6. Warna Link
  themeColorLinkHover: text('theme_color_link_hover').default('#001a5c'), // 7. Link Hover
  themeColorBorder: text('theme_color_border').default('#e2e8f0'), // 8. Warna Border
  themeColorAccent: text('theme_color_accent').default('#3b82f6'), // 9. Blockquote / Accent Border
  themeColorBadge: text('theme_color_badge').default('#eff6ff'), // 10. Warna Badge Pendukung

  // Deprecated Tokens (Kept for safe migration)
  themeColorSecondary: text('theme_color_secondary').default('#855300'),
  themeColorTertiary: text('theme_color_tertiary').default('#4b1c00'),
  themeColorNeutral: text('theme_color_neutral').default('#64748b'),
  
  themeFontFamily: text('theme_font_family').default('Inter'),
  themeRadius: text('theme_radius').default('md'),
  themeShadowLevel: text('theme_shadow_level').default('md'),
});

// Staff (Matches Database/Website schema)
export const staff = sqliteTable('staff', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  title: text('title').notNull(),
  subject: text('subject'),
  imageUrl: text('image_url').notNull(),
  bio: text('bio'),
  sortOrder: integer('sort_order').default(0),
  category: text('category').default('Guru'),
});

// Announcements
export const announcements = sqliteTable('announcements', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  content: text('content').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at'),
  expiresAt: text('expires_at'),
});

// OSIS
export const osisMembers = sqliteTable('osis_members', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  position: text('position'),
  photo: text('photo'),
  description: text('description'),
});

// Banners (Matches Database/Website schema)
export const banners = sqliteTable('banners', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  subtitle: text('subtitle').notNull(),
  description: text('description').notNull(),
  imageUrl: text('image_url').notNull(),
  primaryCtaText: text('primary_cta_text'),
  primaryCtaHref: text('primary_cta_href'),
  primaryCtaIcon: text('primary_cta_icon'),
  secondaryCtaText: text('secondary_cta_text'),
  secondaryCtaHref: text('secondary_cta_href'),
  sortOrder: integer('sort_order').default(0),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
});

// Inbox (Matches Database/Website schema)
export const inbox = sqliteTable('inbox', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  subject: text('subject').notNull(),
  message: text('message').notNull(),
  createdAt: text('created_at').notNull(),
  isRead: integer('is_read', { mode: 'boolean' }).default(false),
  isArchived: integer('is_archived', { mode: 'boolean' }).default(false),
});

// Agendas (From website schema)
export const agendas = sqliteTable('agendas', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  eventDate: text('event_date').notNull(), // ISO Date String
  eventTime: text('event_time').notNull(),
  location: text('location').notNull(),
  description: text('description'),
});

// Galleries (From website schema)
export const galleries = sqliteTable('galleries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  imageUrl: text('image_url').notNull(),
  altText: text('alt_text').notNull(),
  category: text('category').default('Umum'),
  span: text('span', { enum: ['large', 'small'] }).default('small'),
  sortOrder: integer('sort_order').default(0),
  isFeatured: integer('is_featured', { mode: 'boolean' }).default(false),
});

// School Stats (From website schema)
export const schoolStats = sqliteTable('school_stats', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  statValue: text('stat_value').notNull(),
  statLabel: text('stat_label').notNull(),
  iconName: text('icon_name').notNull(),
  sortOrder: integer('sort_order').default(0),
});

// Activity Logs
export const activityLogs = sqliteTable('activity_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').references(() => users.id),
  userName: text('user_name').notNull(),
  userAvatar: text('user_avatar'),
  action: text('action').notNull(),
  moduleName: text('module_name'), // e.g. "Berita", "Galeri", "OSIS"
  status: text('status', { enum: ['Berhasil', 'Diproses', 'Gagal', 'Info', 'Pending'] }).default('Berhasil'),
  createdAt: text('created_at').notNull(),
});

// ─── Admissions Module ───────────────────────────────────────────

// Admission Programs (e.g. SPMB 2026/2027, PPDB Gelombang 1)
export const admissionPrograms = sqliteTable('admission_programs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  academicYear: text('academic_year').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(false),
  registrationOpen: integer('registration_open', { mode: 'boolean' }).default(false),
  startDate: text('start_date'),   // ISO date string
  endDate: text('end_date'),       // ISO date string
  enableMajorSelection: integer('enable_major_selection', { mode: 'boolean' }).default(false),
  maxApplicants: integer('max_applicants'), // null = unlimited
  autoCloseWhenFull: integer('auto_close_when_full', { mode: 'boolean' }).default(false),
  description: text('description'),
  createdAt: text('created_at'),
  updatedAt: text('updated_at'),
});

// Admission Majors (tied to a program)
export const admissionMajors = sqliteTable('admission_majors', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  programId: integer('program_id').notNull().references(() => admissionPrograms.id),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  quota: integer('quota').notNull().default(0),
  currentApplicants: integer('current_applicants').default(0),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  sortOrder: integer('sort_order').default(0),
  createdAt: text('created_at'),
});

// Registrations — core columns (not JSON) for personal, school, parent data
export const registrations = sqliteTable('registrations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  registrationNumber: text('registration_number').notNull().unique(),
  programId: integer('program_id').notNull().references(() => admissionPrograms.id),
  majorId: integer('major_id').references(() => admissionMajors.id), // nullable
  status: text('status', {
    enum: ['pending', 'verified', 'interview', 'accepted', 'rejected', 'waitlisted'],
  }).default('pending'),
  adminNote: text('admin_note'),

  // ── Personal Data ──
  fullName: text('full_name').notNull(),
  nickName: text('nick_name'),
  birthPlace: text('birth_place').notNull(),
  birthDate: text('birth_date').notNull(), // ISO date string
  gender: text('gender', { enum: ['L', 'P'] }).notNull(),
  religion: text('religion').notNull(),
  phone: text('phone'),
  email: text('email'),
  address: text('address').notNull(),

  // ── Origin School Data ──
  originSchool: text('origin_school').notNull(),
  originSchoolAddress: text('origin_school_address'),

  // ── Parent Data: Father ──
  fatherName: text('father_name').notNull(),
  fatherPhone: text('father_phone'),
  fatherOccupation: text('father_occupation'),
  fatherAddress: text('father_address'),

  // ── Parent Data: Mother ──
  motherName: text('mother_name').notNull(),
  motherPhone: text('mother_phone'),
  motherOccupation: text('mother_occupation'),
  motherAddress: text('mother_address'),

  // ── Extensible JSON (future fields) ──
  extraData: text('extra_data'), // JSON string for additional data

  createdAt: text('created_at'),
  updatedAt: text('updated_at'),
});

// Registration Status Audit Logs (immutable)
export const registrationStatusLogs = sqliteTable('registration_status_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  registrationId: integer('registration_id').notNull().references(() => registrations.id),
  previousStatus: text('previous_status').notNull(),
  newStatus: text('new_status').notNull(),
  changedBy: text('changed_by'), // user ID or null if system
  adminNote: text('admin_note'),
  createdAt: text('created_at').notNull(),
});

// Registration Sequences (for race-condition safe registration numbers)
export const registrationSequences = sqliteTable('registration_sequences', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  programId: integer('program_id').notNull().references(() => admissionPrograms.id).unique(),
  prefix: text('prefix').notNull().default('REG'),
  year: text('year').notNull(),
  lastNumber: integer('last_number').notNull().default(0),
});
