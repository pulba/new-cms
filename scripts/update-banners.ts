import 'dotenv/config';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

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

async function updateBanners() {
  try {
    const client = createClient({
      url: process.env.TURSO_CONNECTION_URL || '',
      authToken: process.env.TURSO_AUTH_TOKEN || '',
    });
    const db = drizzle(client);

    const allBanners = await db.select().from(banners);
    if (allBanners.length > 0) {
      await db.update(banners)
        .set({
          subtitle: 'PPDB ONLINE 2026',
          description: 'Bergabunglah bersama kami untuk mewujudkan generasi emas yang cerdas, berkarakter, dan berdaya saing global. Pendaftaran gelombang pertama telah dibuka dengan berbagai kemudahan dan fasilitas unggulan.',
          primaryCtaText: 'Daftar Sekarang',
          primaryCtaHref: '/ppdb',
          secondaryCtaText: 'Lihat Panduan',
          secondaryCtaHref: '/panduan'
        });
      console.log('Successfully updated banners with dummy data.');
    } else {
      console.log('No banners found to update.');
    }
  } catch (error) {
    console.error('Error updating banners:', error);
  }
}

updateBanners();
