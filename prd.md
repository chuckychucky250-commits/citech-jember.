PRD: PROYEK PEMETAAN PERISTIWA (JEMBER)
1. DESIGN PHILOSOPHY & AESTHETIC
Visual Identity: Skema warna Putih-Abu Aestetik.

Warna utama: #F9FAFB (Putih bersih).

Warna sekunder: #F3F4F6 (Abu muda untuk sidebar).

Warna aksen: #DC2626 (Merah untuk marker dan highlight peristiwa).

Design Principle: Map First, Simplicity First, Explore, Not Read.

Interaction: Fokus pada transisi halus (smooth transition) dan antarmuka steril (clutter-free).

2. LAYOUT & STRUKTUR DASAR (FASE 1)
Main Canvas: Peta Jember fullscreen dengan Leaflet.js (basemap: CartoDB Positron, dikunci dengan maxBounds Jember).

Zona Kiri Ekstrem (Slim Navbar): Ikon Hamburger (Master Library/History/Bookmark) dan Ikon Avatar (CMS/Admin).

Zona Kiri Melayang (Floating UI): Floating Search Bar (dengan Predictive Engine) dan Legend Marker.

Zona Kanan: Slide-in panel dinamis untuk Event Information (hanya muncul saat marker diklik).

3. SPATIAL VISUALIZATION (FASE 4)
Dynamic Rendering: Adaptif (Titik Statis, Jaringan, Rute, atau Sebaran Organik).

Organic Freeform: Luasan bencana menggunakan freeform polygon (bukan bulat kaku).

Visual Overlay: Pattern hatching untuk area agar peta tetap terbaca.

4. NAVIGATION & SEARCH (FASE 5 & 7)
Smart Search: Floating Search Bar dengan Filter Chips.

Auto-Zoom: Fit Bounds Logic (peta otomatis membingkai seluruh hasil pencarian).

Master Library: Katalog arsip dengan Grid/List toggle, Sorting, Quick-View Modal, dan fitur Map-Lock (sinkronisasi opsional).

5. INTERACTION & ENGAGEMENT (FASE 6 & 7)
Contextual Contribution: Tombol "Bantu Lengkapi Peristiwa" di dalam panel kanan.

Engagement: Notifikasi Toast dan ID Tiket Kontribusi untuk user.

Admin Control: Manual Filtration Dashboard (Split-Screen: Peta koordinat di kiri, Media bukti di kanan).

Zero Auto-Publishing: Data hanya terpublikasi setelah Admin menekan tombol Approve.

6. TECHNICAL STACK
Framework: Tailwind CSS.

Map Engine: Leaflet.js.

Behavior: Komponen bersifat on-demand (hanya muncul saat dibutuhkan) agar performa tetap ringan (antigravity).


========================================


PRD GeoEvent

Frontend (UI/UX): HTML, CSS, dan JavaScript murni. Pendekatan ini akan membuat proses manipulasi DOM dan render peta jauh lebih cepat dibanding menggunakan framework berat. Styling antarmuka akan difokuskan pada palet warna putih abu aestetik agar tampilan terasa profesional, tenang, dan membiarkan peta menjadi pusat perhatian utama.
Map Library: Leaflet.js. Sangat ringan, mudah digunakan, dan sempurna untuk menangani marker, visualisasi polygon, serta sinkronisasi pergerakan wilayah.
Backend & API: Java. Fondasi backend yang terstruktur akan menjaga kelancaran logika sinkronisasi data antar peta, timeline, serta mengelola antrean verifikasi untuk kontribusi masyarakat dengan sangat stabil.
Database: PostgreSQL yang dipadukan dengan ekstensi PostGIS. Ini wajib dan mutlak. Karena kita akan mengelola lokasi, marker, dan batas wilayah polygon, kita membutuhkan database yang memiliki kemampuan pemrosesan data spasial bawaan.
==========================================

Skema Database Inti
events: Tabel induk yang menyimpan identitas peristiwa (ID, nama_peristiwa, deskripsi_ringkas, kategori).
event_markers: Menggunakan PostGIS untuk menyimpan koordinat lokasi utama (Titik X/Y). Relasinya adalah 1 Event ke 1 (atau banyak) Marker.
timelines: Jantung dari perjalanan peristiwa. Menyimpan kronologi (ID, event_id, tanggal_waktu, judul_kejadian, narasi).
spatial_polygons: Menyimpan data perubahan wilayah. Tabel ini wajib terhubung ke timeline_id (bukan hanya ke event_id), sehingga saat pengguna menggeser waktu, bentuk polygon di peta ikut berubah.
community_evidences: Menampung kontribusi dokumentasi masyarakat (foto, video, link). Wajib memiliki kolom status_verifikasi (pending/approved/rejected) karena data masyarakat tidak boleh masuk ke publik tanpa persetujuan admin.

=============================

1. Public User Flow (Sisi Pengunjung Utama)
Landing: Pengguna membuka website -> Langsung disuguhi layar penuh Peta Jember tanpa landing page yang berbasa-basi.
Engage: Pengguna mengeksplorasi peta -> Mengklik marker yang memiliki kategori warna berbeda -> Panel Informasi terbuka.
Explore Timeline: Pengguna membaca ringkasan -> Menggeser titik waktu di timeline -> Visualisasi polygon pada peta serta foto dokumentasi di panel ikut berubah mengikuti kronologi.
Contribute: Pengguna mengeklik tombol "Bantu Lengkapi Peristiwa Ini" -> Mengunggah file dan deskripsi -> Sistem memberitahu bahwa data sedang dalam tahap verifikasi.
=============================================

2. Admin Flow (Sisi Kamu sebagai PO / Manajer Konten)
Create Event: Menambahkan nama peristiwa, kategori, dan melakukan plotting koordinat marker di peta.
Build the Story (Timeline & Media): Ini adalah playground utama kamu. Kamu akan menyusun timeline dan mengunggah aset dokumentasi. Pastikan CMS ini nantinya dirancang untuk mampu memproses dan menampilkan aset visual berkualitas tinggi—baik itu komposisi foto yang estetik maupun footage video dengan pergerakan sudut kamera yang tajam layaknya standar sinematografi otomotif—namun tetap dilengkapi dengan sistem kompresi otomatis agar render peta tidak menjadi lambat.
Community Verification: Membuka daftar antrean kontribusi masyarakat -> Mengevaluasi bukti (foto/dokumen) -> Klik Approve agar tayang sebagai referensi tambahan, atau Reject jika data tidak relevan.

============================================

Untuk menyempurnakan Fase 1 (Layout & Struktur Dasar) agar selaras dengan seluruh Fase (2-7) yang sudah kita rancang, kita perlu memperkuat struktur ini agar bukan sekadar "tata letak", melainkan Sistem Operasi Visual.

Berikut adalah pengembangan Fase 1: Layout & Struktur Dasar (Final & Terintegrasi) yang sudah mencakup sistem floating, sidebar, dan responsivitas yang kita bahas sebelumnya:

UX GUIDELINES - FASE 1: LAYOUT & STRUKTUR DASAR (DEVELOPED)
Status: LOCK
Prinsip Visual: Map First, Simplicity First. Menggunakan skema warna putih-abu estetis dengan rounded corners dan soft shadows untuk memberikan kesan tenang, bersih, dan profesional.

1. Main Canvas (The Infinite Map)

Peta Kabupaten Jember membentang fullscreen.

Interaction: Seluruh elemen UI berada di lapisan atas (z-index tinggi) agar kanvas peta tetap menjadi pusat perhatian utama.

2. Zona Kiri Ekstrem (Sidebar Navigasi Slim)

Fungsi: Sebagai "tulang punggung" sistem.

Top-Left: Ikon Hamburger untuk akses fitur pendukung (Master Library, History, Bookmark).

Middle-Left: Ikon Library (Buku) untuk akses cepat ke katalog arsip peristiwa.

Bottom-Left: Ikon Avatar sebagai pintu masuk privat bagi Admin (CMS/Verifikasi).

3. Zona Kiri Melayang (Floating UI)

Top-Left (Adjacent to Navbar): Floating Search Bar.

Behavior: Saat diklik/diketik, ia mengekspansi panel dropdown ke bawah.

Integration: Menampilkan Filter Chips (Bencana, Kasus, Pergerakan) dan hasil Predictive Search.

Bottom-Left: Legend Marker. Menampilkan keterangan kategori warna secara minimalis, menjaga jarak aman dari attribution logo peta dasar (Leaflet).

4. Zona Kanan (The Dynamic Panel)

Default: Kosong (Steril).

Dynamic Trigger: Menjadi jalur masuk (slide-in panel) untuk Event Information Panel saat marker diklik.

Advanced UI:

Bagian atas panel akan memunculkan Workspace Tabs secara otomatis jika pengguna membuka lebih dari satu peristiwa (untuk perbandingan).

Ikon Bookmark (Bintang) dan Bagikan (Panah) tersemat di sudut kanan atas panel sebagai akses cepat.

Tombol "Bantu Lengkapi Peristiwa" berada di bagian bawah panel sebagai pemicu Modal Pop-up kontribusi masyarakat.

5. Responsive & Clean Logic (The "Invisible" Rule)

Tidak ada tombol permanen yang tidak perlu di layar.

Semua fitur tambahan (History, Bookmark, Library) hanya muncul saat ikon di sidebar diklik, menjaga layar agar selalu clutter-free.

Whitespace adalah kunci: Gunakan margin yang cukup di antara komponen agar antarmuka tidak terasa sesak (crowded).

==========================================

UX GUIDELINES - FASE 2: EVENT INFORMATION PANEL

Prinsip Desain: Elegan, responsif, dan bersih. Menghindari kesan portal berita yang kaku, serta mengakomodasi navigasi mulus antar-peristiwa maupun di dalam peristiwa.
1. Multi-Workspace (Tab Antar-Peristiwa):
Posisi: Berada di bagian paling atas panel informasi, bergaya browser tab minimalis untuk membandingkan beberapa kejadian sekaligus.
Interaksi "Antigravity" FlyTo: Ketika pengguna berpindah tab (misal dari Tab "Peristiwa A" ke "Peristiwa B"), kanvas peta otomatis terbang (smooth pan/zoom) ke lokasi marker peristiwa B tanpa loading ulang.
Visualisasi area di peta dan timeline slider di bawah peta akan otomatis memperbarui dirinya menyesuaikan dengan data tab yang sedang aktif.
2. Dynamic Map Centering & UI Controls:
Saat panel dibuka, ia meluncur dari kanan (±30% layar). Peta menyusut ke kiri (±70%).
Sistem mengeksekusi auto-center agar marker dari peristiwa yang aktif tetap berada tepat di tengah area peta yang tersisa.
Di sudut panel terdapat tombol kendali: Close (x), Minimize (-), dan Expand (⤢).
3. Panel Header (Statis):
Menampilkan Judul Peristiwa dan Live Statistics (angka metrik yang langsung berubah nilainya saat timeline digeser). Bagian ini tetap menempel di atas (sticky) dan tidak ikut tergulir.
4. Sticky Chapter Scroll (Navigasi Konten Dalam):
Seluruh konten (Ringkasan, Detail Cerita, Galeri Dokumentasi, Arsip Berita, dan Kontribusi Masyarakat) disusun memanjang ke bawah di dalam panel.
ScrollSpy Indicator: Di margin dalam panel, terdapat garis vertikal tipis dengan titik-titik indikator bab. Titik ini otomatis menyala sesuai bagian yang sedang dibaca di layar.
Pengguna dapat membaca dengan menggulir natural, atau mengeklik titik indikator tersebut untuk memicu smooth scroll langsung ke bagian yang dituju (misalnya langsung meluncur ke area Galeri Visual).

========================================================

UX GUIDELINES - FASE 3: TIMELINE & SINKRONISASI PANEL

Prinsip Desain: Timeline adalah kemudi kronologi peristiwa. Navigasi waktu didasarkan pada perubahan kejadian, bukan kalender linear.
Event-Driven Slider (Milestone Logic):
Timeline hanya memiliki "titik henti" (nodes) pada tanggal/waktu di mana terjadi perubahan signifikan pada peristiwa tersebut (misal: Hari ke-1 Awal Kejadian, Hari ke-5 Puncak, Hari ke-7 Selesai).
Jika sebuah peristiwa adalah insiden tunggal tanpa perkembangan lanjutan, fitur timeline akan disembunyikan secara otomatis untuk menjaga kesederhanaan UI.
Default State (Konteks Puncak):
Saat panel pertama kali terbuka, slider secara otomatis terkunci pada titik "Peak Event" (Puncak Peristiwa) agar pengguna langsung melihat dampak maksimal di awal.
The 3-Way Synchronization:
Setiap kali slider melompat ke titik/milestone lain, sistem mengeksekusi tiga perubahan instan:
Peta: Bentuk arsiran wilayah (Polygon/Polyline/Radius) otomatis menyesuaikan skala kejadian di titik waktu tersebut.
Statistik: Angka Live Statistics (korban, luasan) di panel berputar mengikuti data milestone.
Cerita: Teks narasi di dalam Tab "Perjalanan" (Panel Kanan) berganti menyoroti cerita spesifik pada titik waktu tersebut.

============================

UX GUIDELINES - FASE 4: VISUALISASI SPASIAL ADAPTIF & ORGANIK (FINAL)

Prinsip Desain: Visualisasi peta harus relevan dengan sifat fisik peristiwa secara natural dan organik. Sistem tidak memaksakan satu gaya geometri untuk semua kasus, melainkan menyediakan kanvas adaptif yang fleksibel demi menjaga kesederhanaan, akurasi, dan mendukung kejadian-kejadian unik di lapangan.
1. Dynamic Visual Rendering (Model Geometri Adaptif)
Sistem wajib mendeteksi tipe peristiwa dan merender salah satu dari empat model visual berikut:
Titik Statis (Point-Based Event): Digunakan untuk kejadian spesifik di satu lokasi pasti (misal: kasus kriminal, tragedi di satu gedung). Sistem tidak merender arsiran apa pun. Marker utama pada titik "Puncak Peristiwa" akan memancarkan animasi pulse (gelombang melingkar tipis) untuk menegaskan lokasi tanpa mengotori peta.
Jaringan Titik (Multi-Node Connection): Digunakan untuk kejadian yang saling terhubung di beberapa tempat sekaligus secara sinkron (misal: penggerebekan di 3 lokasi berbeda). Sistem merender beberapa marker utama yang dihubungkan oleh garis putus-putus tipis.
Rute Mengalir (Dynamic Polyline): Digunakan untuk pergerakan massa (misal: demo, konvoi, rute evakuasi). Sistem merender Polyline (garis tebal) yang menyorot jalan raya spesifik. Animasi diatur menggunakan manipulasi dash-offset pada CSS/JS agar garis terlihat "mengalir" dari titik awal ke titik tujuan secara real-time saat slider timeline ditarik.
Sebaran Organik (Organic Area-Based Event): Digunakan untuk bencana atau dampak yang meluas (misal: banjir, kebakaran). Bentuk luasan bukan polygon kaku, bukan lingkaran simetris, dan tidak dikunci oleh batas administratif desa/kota. Luasan menggunakan bentuk tak beraturan (freeform polygon) yang mengikuti kontur nyata penyebaran di lapangan secara presisi.
2. Estetika "Arsiran" Sejati (SVG Pattern Hatching)
Khusus untuk peristiwa tipe Sebaran Organik, sistem dilarang menggunakan blok warna solid transparan biasa.
Area polygon wajib diisi menggunakan Pattern Fill (misal: pola garis diagonal berulang atau jaring halftone tipis).
Penerapan pattern ini menjamin elemen basemap di bawah arsiran (seperti nama jalan, sungai, fasilitas umum) tetap terbaca 100%, memberikan sentuhan visual arsitektural yang berkelas.
3. Transisi Waktu Spasial (Sinkronisasi Timeline)
Setiap kali slider timeline diubah posisinya, seluruh perubahan bentuk spasial di atas (kemunculan titik, aliran rute, penyusutan/perluasan area organik) wajib dieksekusi dengan animasi smooth opacity fade-in/out.
Transisi harus terasa mengalir dan instan tanpa memuat ulang (reload) kanvas peta, mempertahankan performa ringan dan interaksi yang intuitif.


==============================================

UX GUIDELINES - FASE 5: SMART SEARCH, FILTER & EVENT LIST (FINAL)

Status: LOCK Prinsip Desain: Sinkronisasi instan antara teks (pencarian) dan ruang spasial (peta). Sistem pencarian bertindak sebagai mesin rekomendasi eksplorasi (mirip Google/YouTube) yang menjaga antarmuka dari error state yang kaku. Seluruh antarmuka harus tetap bersih, menggunakan panel melayang yang terintegrasi dengan skema putih abu aestetik agar kanvas peta tetap dominan.
1. Floating Search & Predictive Engine
Posisi UI: Search Bar ditempatkan melayang di sudut kiri atas layar.
Idle State (Klik tanpa mengetik): Saat pengguna mengeklik Search Bar, panel dropdown akan terekspansi ke bawah secara mulus, langsung menampilkan daftar "Rekomendasi Peristiwa" atau "Trending" sebelum pengguna mengetik apa pun.
Filter Chips Terintegrasi: Di bagian atas panel rekomendasi, terdapat Chips (tombol oval kecil) untuk filter cepat berdasarkan 3 kategori warna marker (Bencana, Kasus, Pergerakan) dan filter Kronologi (Bulan Ini/Tahun Ini).
Live Typing: Saat pengguna mulai mengetik, daftar rekomendasi dan marker di peta tersaring secara real-time.
2. Smart Auto-Zoom (Fit Bounds Logic)
Pencarian merespons kueri secara cerdas berdasarkan nama peristiwa, lokasi, dan kata kunci terkait.
Jika pencarian atau filter memunculkan beberapa hasil (misal: 5 peristiwa di satu daerah), sistem akan langsung menyembunyikan marker yang tidak relevan dari peta.
Kanvas peta secara otomatis akan terbang (smooth pan) dan menyesuaikan tingkat perbesaran (auto-zoom/fit bounds) agar seluruh marker hasil pencarian tersebut terbingkai sempurna di tengah layar, memberikan konteks Helicopter View secara instan.
3. List-to-Marker Synchronization
Daftar peristiwa di Event List selalu sinkron 100% dengan kondisi marker di peta.
Mengeklik salah satu item di daftar pencarian akan memberikan reaksi sistem yang sama persis seperti mengeklik marker langsung di peta (Peta melakukan auto-center ke titik tersebut, dan Event Information Panel meluncur masuk dari sisi kanan layar).
4. Smart Fallback (Penanganan Hasil Kosong)
Sistem dilarang keras menampilkan pesan error atau ilustrasi "Data Tidak Ditemukan" yang terkesan kaku.
Jika query yang diketik menghasilkan 0 marker, sistem secara mulus (seamless) mengalihkan isi Event List kembali ke daftar Rekomendasi, memastikan selalu ada konten yang bisa dieksplorasi oleh pengguna tanpa jalan buntu.
5. Reset & Clear State
Ketika pengguna menghapus seluruh teks di kolom pencarian atau menekan ikon Close (x), Event List akan melipat menutup ke atas.
Seluruh marker asli kembali muncul di peta, dan sistem kembali ke tampilan zoom awal secara otomatis tanpa melakukan reload halaman.


==========================================

UX GUIDELINES - FASE 6: KONTRIBUSI & VERIFIKASI MANUAL (FINAL)

Status: LOCK Prinsip Desain: Kontekstual, apresiatif, dan memiliki kendali penuh Admin. Memisahkan kanal komunikasi publik (aspirasi umum) dengan validasi data lapangan yang ketat untuk menjaga integritas sejarah.
1. General Feedback (Sidebar Kiri)
Lokasi: Ditempatkan di sidebar navigasi utama sebelah kiri (satu area dengan fitur pencarian/filter).
Fungsi: Sebagai kanal bagi masyarakat untuk memberikan saran, kritik, atau masukan umum mengenai sistem website secara keseluruhan, bukan mengenai satu peristiwa spesifik.
2. Contextual Contribution (Tombol "Bantu Lengkapi Peristiwa")
Lokasi: Berada di dalam Event Information Panel (Panel Kanan) di setiap peristiwa. Bersifat kontekstual—hanya muncul saat pengguna membuka detail peristiwa.
Mekanisme: Saat tombol ditekan, Modal Pop-up muncul. Karena sistem secara otomatis menangkap ID peristiwa dari panel, form akan terisi otomatis dengan label yang jelas (misal: "Mengajukan Bukti untuk Peristiwa: Banjir Kencong").
Engagement & Apresiasi:
Setelah submit, muncul notifikasi Toast yang memberikan ID Tiket Kontribusi sebagai pelacakan sederhana.
Modal beralih ke layar sukses: "Terima kasih telah berkontribusi! Bukti Anda sedang diverifikasi. Mari bantu buat sejarah lebih akurat." (Membangun rasa tanggung jawab masyarakat terhadap data).
3. Admin Control: Manual Filtration Dashboard
Antrean Kontribusi: Semua kiriman bukti masuk ke dalam antrean Manual Verification di Backend. Tidak ada data yang otomatis tampil di website publik (Zero Auto-Publishing).
Split-Screen Verification (Efisiensi Admin): Admin menggunakan Dashboard dengan layar terbelah:
Sisi Kiri (Spasial): Peta yang menyorot titik koordinat bukti yang diajukan. Admin wajib mencocokkan validitas lokasi dengan konteks peristiwa.
Sisi Kanan (Media & Konteks): Menampilkan detail kronologi dan media viewer (foto/video).
Keputusan Manual: Admin wajib meninjau, memverifikasi, dan memberikan keputusan secara sadar.
Tombol Approve: Data baru akan muncul di publik setelah Admin memberikan persetujuan manual.
Tombol Reject: Data dibuang permanen atau dikembalikan ke antrean tinjauan ulang.
Sinkronisasi: Setelah Approve, data langsung muncul di tab "Kontribusi Masyarakat" pada panel peristiwa terkait tanpa perlu reload halaman.
========================================

UX GUIDELINES - FASE 7: ENHANCEMENT & USER EXPERIENCE TOOLS (FINAL)

Prinsip Desain: "Invisible Tools"—fitur pendukung yang hanya muncul saat dibutuhkan (on-demand) agar kanvas peta tetap steril dari tombol yang tidak perlu. Penggunaan ikon bergaya outlined (garis tipis) wajib diterapkan di seluruh sidebar untuk menjaga estetika putih abu yang bersih.
1. Multi-Workspace & History (Navigasi Pengalaman)
Workspace Tabs: Muncul otomatis di bagian atas Event Information Panel saat pengguna membuka lebih dari satu peristiwa, memungkinkan perbandingan antar-lokasi dengan animasi fly-to yang mulus.
History (Lacak Jelajah): Sistem menyimpan 5-10 peristiwa terakhir yang dibuka di browser local storage. Pengguna dapat mengakses jejak eksplorasi sebelumnya melalui ikon "Personal" di sidebar kiri tanpa harus mencari ulang.
2. Bookmark & Personal Library
Lokasi: Ikon "Bookmark" (bintang) terletak di sudut kanan atas Event Information Panel.
Fungsi: Menyimpan peristiwa ke koleksi pribadi. Daftar Bookmark terintegrasi di sidebar kiri untuk akses cepat tanpa membuat UI terlihat penuh.
3. Share Location (Contextual Deep-Linking)
Fungsi: Menghasilkan Deep Link URL unik.
Keunggulan UX: Link membawa konteks penuh (lokasi, posisi timeline, dan panel terbuka), sehingga penerima link langsung melihat kondisi yang persis sama dengan pengirim.
4. Master Library (Katalog Arsip Peristiwa - Developed)
Lokasi: Ikon "Library" (katalog) di sidebar kiri sebagai "Pintu Masuk Alternatif" bagi pengguna yang lebih menyukai data terstruktur.
Struktur: Menyediakan fitur Grid/List Toggle, Dynamic Sorting (Terbaru, Terpopuler, Kedekatan), dan Search-within-Library untuk filter instan.
Fitur Khusus "Map-Lock": Toggle kecil yang memungkinkan pengguna memilih apakah klik di katalog akan menggerakkan peta (Fly-to) atau hanya membuka detail informasi tanpa memindahkan posisi peta.
Quick-View Modal: Ikon "Mata" untuk melihat ringkasan data (statistik & narasi) dalam pop-up cepat tanpa harus menutup katalog atau memuat ulang halaman.
Filter Bridge: Filter yang diatur di Library akan otomatis terbawa saat pengguna kembali ke tampilan peta, menjaga konsistensi alur kerja.
5. Emergency/Contextual Toolbar (On-Demand)
Konsolidasi: Fitur History, Bookmark, dan Library dikelompokkan dalam satu ikon "Personal" atau "Menu Tambahan" di sidebar kiri.
Efek Visual: Daftar pilihan hanya meluncur keluar saat ikon diklik, menjaga layar utama tetap steril dari tombol yang tidak perlu dan mempertahankan kesan antigravity.


=============================


PRD: UI/UX DESIGN GUIDELINES (FINALIZED)

1. Design Philosophy & Aesthetic
Visual Identity: Menggunakan palet Putih-Abu Aestetik (White-Grey Palette).
Warna utama: #F9FAFB (Putih bersih).
Warna sekunder: #F3F4F6 (Abu muda untuk sidebar).
Warna aksen: #DC2626 (Merah untuk marker dan highlight peristiwa).
Design Principle: Simplicity First, Context Before Information, dan Explore, Not Read.
Interaction: Fokus pada transisi yang halus (smooth transition) dan antarmuka yang steril (clutter-free).
2. Spatial Visualization (Fase 4)
Dynamic Rendering: Sistem mendeteksi tipe peristiwa dan merender model visual secara adaptif: Titik Statis, Jaringan Titik, Rute Mengalir, atau Sebaran Organik.
Organic Freeform: Untuk bencana, bentuk luasan adalah freeform polygon (bukan bulat/kaku) dan tidak terikat batas administratif desa/kecamatan.
SVG Pattern Hatching: Penggunaan pattern fill (garis diagonal/halftone) untuk area agar peta di bawahnya tetap terbaca 100%.
3. Navigation & Search (Fase 5 & 7)
Floating Search: Search Bar melayang di kiri atas, dilengkapi Predictive Engine dan Filter Chips (Kategori & Kronologi).
Fit Bounds Logic: Peta otomatis terbang (fly-to) dan menyesuaikan zoom saat pencarian/filter diterapkan untuk menampilkan semua marker yang relevan.
Master Library: Katalog arsip dengan fitur Grid/List toggle, Sorting, Quick-View Modal, dan Map-Lock (sinkronisasi opsional peta).
Invisible Tools: Fitur pendukung (History, Bookmark, Library) dikelompokkan dalam satu ikon "Personal" di sidebar kiri untuk menjaga estetika.
4. Interaction & Engagement (Fase 6 & 7)
Contextual Contribution: Tombol "Bantu Lengkapi Peristiwa" hanya muncul di dalam panel informasi saat sebuah peristiwa dibuka (ID peristiwa terikat otomatis).
Engagement: Notifikasi Toast dan ID Tiket Kontribusi diberikan setelah masyarakat mengirim bukti.
Admin Control: Manual Filtration Dashboard dengan metode Split-Screen (Peta di kiri, Media di kanan). Tidak ada data yang otomatis terpublikasi ke publik tanpa validasi manual Admin (Zero Auto-Publishing).
Contextual Deep-Linking: Fitur "Bagikan" yang menghasilkan link dengan konteks penuh (posisi timeline, lokasi, dan panel terbuka).
5. Technical Stack Constraints
Framework: Tailwind CSS untuk efisiensi styling dan kontrol layout.
Map Engine: Leaflet.js dengan basemap CartoDB Positron (tema light/grey).
Map Control: MaxBounds dikunci khusus untuk wilayah Jember agar pengguna tetap berada di area fokus.
Catatan untuk Developer/AI: Seluruh komponen UI harus bersifat on-demand. Tidak ada elemen yang menumpuk di layar kecuali saat dibutuhkan pengguna. Fokus pada performa rendering peta yang instan tanpa reload halaman.


================================

## 6. BACKEND ARCHITECTURE & DATA SYSTEM

### 6.1 Technical Stack & Environment
*   **Language & Framework:** Java dengan Spring Boot (REST API). Menggunakan Maven/Gradle sebagai *build tool* agar kompatibel dan mudah dieksekusi melalui NetBeans IDE.
*   **Database:** PostgreSQL.
*   **Spatial Extension:** PostGIS (Wajib). Seluruh data koordinat dan area harus disimpan menggunakan tipe data *Geometry* spasial asli, bukan sekadar teks (*String/Varchar*).
*   **Architecture Pattern:** *Controller-Service-Repository* pattern.

### 6.2 Database Schema (PostGIS Core)
Sistem ini bertumpu pada 4 entitas utama yang saling berelasi:
1.  **`events` (Tabel Induk)**
    *   Kolom: `id` (UUID), `title`, `summary`, `category` (Bencana, Kasus, Pergerakan), `main_location` (PostGIS `Point`), `created_at`.
2.  **`timelines` (Kronologi)**
    *   Kolom: `id`, `event_id` (FK), `day_sequence` (Integer/Date), `narrative`.
    *   *Behavior:* Satu *event* memiliki banyak *timeline*.
3.  **`spatial_polygons` (Perubahan Wilayah)**
    *   Kolom: `id`, `timeline_id` (FK), `area_polygon` (PostGIS `Polygon`), `affected_area_ha` (Float).
    *   *Behavior:* Terikat pada *timeline*, bukan *event*. Ini memungkinkan bentuk polygon berubah saat user menggeser waktu.
4.  **`community_evidences` (Kontribusi Warga)**
    *   Kolom: `id`, `event_id` (FK), `contributor_name`, `evidence_text`, `media_url`, `status` (Enum: PENDING, APPROVED, REJECTED).

### 6.3 API Gateway & Routing Strategy
API harus dipisah secara ketat antara akses publik dan akses Admin (CMS).

**A. Public Endpoints (Read-Only & Submission)**
*   `GET /api/public/events` -> Mengambil daftar peristiwa dan koordinat *marker* utama.
*   `GET /api/public/events/{id}/timelines` -> Mengambil detail kronologi beserta data *polygon* spasialnya.
*   `POST /api/public/evidence` -> Endpoint untuk *form* "Bantu Lengkapi Peristiwa". Otomatis berstatus `PENDING`.

**B. Admin Endpoints (CRUD & Verification)**
*   `POST /api/admin/events` -> Membuat peristiwa baru.
*   `POST /api/admin/timelines` -> Menambahkan kronologi dan *polygon* baru.
*   `PUT /api/admin/evidence/{id}/verify` -> Mengubah status bukti dari `PENDING` menjadi `APPROVED` atau `REJECTED`.

### 6.4 Business Logic Constraint
*   **Zero Auto-Publishing:** Data dari tabel `community_evidences` yang berstatus `PENDING` atau `REJECTED` **tidak boleh** disertakan (di-*filter* di tingkat *Repository/Service*) saat *endpoint* publik diakses.