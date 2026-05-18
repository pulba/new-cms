import { createClient } from '@libsql/client';
import { config } from 'dotenv';

config();

const client = createClient({
  url: process.env.TURSO_CONNECTION_URL || '',
  authToken: process.env.TURSO_AUTH_TOKEN || '',
});

async function main() {
  console.log('Seeding school_profile data...');

  await client.execute({
    sql: `INSERT INTO school_profile (
      school_name, short_description, address, phone, email,
      social_facebook, social_instagram, social_youtube,
      accreditation, npsn, founded_year, curriculum,
      history_text, history_image,
      profile_hero_title, profile_hero_subtitle, profile_hero_image,
      google_maps_embed_url,
      vision_text, mission_items,
      principal_name, principal_message, principal_signature, principal_image, principal_quote,
      ppdb_is_active, ppdb_title, ppdb_description
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    args: [
      'SMA Negeri 1 Nusantara',
      'Membentuk generasi cerdas, berkarakter, dan berwawasan global melalui pendidikan berkualitas yang berlandaskan nilai-nilai luhur bangsa.',
      'Jl. Pendidikan Raya No. 1, Menteng, Jakarta Pusat',
      '(021) 345-6789',
      'info@sman1nusantara.sch.id',
      'https://facebook.com/sman1nusantara',
      'https://instagram.com/sman1nusantara',
      'https://youtube.com/sman1nusantara',
      'A (Unggul)',
      '20104567',
      '1978',
      'Kurikulum Merdeka',
      'SMA Negeri 1 Nusantara didirikan pada tahun 1978 atas prakarsa tokoh pendidikan nasional untuk menjawab kebutuhan akan institusi pendidikan berkualitas di jantung ibukota. Berawal dari gedung pinjaman, sekolah ini bertransformasi menjadi pusat keunggulan akademik yang telah melahirkan ribuan alumni yang kini berkontribusi di berbagai sektor, baik nasional maupun internasional.\n\nDalam empat dekade perjalanannya, SMA Negeri 1 Nusantara terus berinovasi dengan mengintegrasikan teknologi dalam pembelajaran tanpa meninggalkan nilai-nilai budi pekerti. Komitmen kami terhadap kualitas pendidikan tercermin dari berbagai penghargaan tingkat nasional yang kami raih serta tingkat penerimaan alumni di perguruan tinggi negeri terbaik yang mencapai lebih dari 90% setiap tahunnya.',
      'https://images.unsplash.com/photo-1541339907198-e08756ebafe3?auto=format&fit=crop&q=80&w=1200',
      'Tentang SMA Negeri 1 Nusantara',
      'Menelusuri sejarah, visi, dan dedikasi kami dalam mencerdaskan kehidupan bangsa selama lebih dari 40 tahun.',
      'https://images.unsplash.com/photo-1523050335392-93851179ae22?auto=format&fit=crop&q=80&w=1920',
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.66642700962!2d106.82496417586!3d-6.1753923938118!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69f5d2e7643b2d%3A0xc09f1234567890!2sMonumen%20Nasional!5e0!3m2!1sid!2sid!4v1714540000000!5m2!1sid!2sid',
      'Menjadi lembaga pendidikan unggulan yang menghasilkan lulusan berakhlak mulia, cerdas, kreatif, dan mandiri dalam harmoni keberagaman.',
      '["Menyelenggarakan proses pembelajaran yang inovatif dan berbasis teknologi untuk mengoptimalkan potensi akademik siswa.","Membentuk karakter siswa yang religius, disiplin, bertanggung jawab, dan memiliki rasa cinta tanah air.","Mengembangkan bakat dan minat siswa melalui berbagai program ekstrakurikuler dan pengembangan diri yang terencana.","Mewujudkan lingkungan sekolah yang sehat, aman, dan ramah anak demi mendukung terciptanya ekosistem belajar yang kondusif.","Menjalin kerjasama yang harmonis dengan orang tua, alumni, dan masyarakat untuk kemajuan institusi."]',
      'Dr. H. Ahmad Fauzi, M.Pd.',
      '["Assalamu\'alaikum Warahmatullahi Wabarakatuh,","Selamat datang di laman resmi SMA Negeri 1 Nusantara. Sebagai bagian dari tonggak pendidikan di Indonesia, kami berkomitmen untuk terus menghadirkan layanan pendidikan terbaik bagi putra-putri bangsa.","Era digital menuntut kita untuk selalu adaptif dan inovatif. Oleh karena itu, SMA Negeri 1 Nusantara senantiasa memperbarui metode pembelajaran agar relevan dengan tuntutan zaman, namun tetap memegang teguh akar budaya dan etika nusantara.","Mari bersama-sama kita bangun masa depan yang gemilang bagi anak-anak kita. Sekolah, keluarga, dan masyarakat adalah mitra sejajar dalam mewujudkan impian ini.","Wassalamu\'alaikum Warahmatullahi Wabarakatuh."]',
      'Kepala Sekolah SMA Negeri 1 Nusantara',
      'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=800',
      'Pendidikan bukan sekadar mengisi wadah, melainkan menyalakan api semangat belajar yang tak kunjung padam.',
      1,
      'PPDB Online Tahun Ajaran 2025/2026 Telah Dibuka!',
      'Segera bergabung dengan sekolah berprestasi. Pendaftaran periode gelombang pertama dibuka dari 1 Mei hingga 30 Juni 2025.',
    ]
  });

  const result = await client.execute('SELECT school_name, accreditation, principal_name FROM school_profile LIMIT 1');
  console.log('✅ school_profile seeded:', result.rows[0]);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
