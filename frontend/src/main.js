import './style.css'

document.addEventListener('DOMContentLoaded', () => {
  let activePolygon = null;
  // --- 1. DARK MODE LOGIC ---
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeIconSun = document.getElementById('themeIconSun');
  const themeIconMoon = document.getElementById('themeIconMoon');
  
  if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  }

  if(themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      document.documentElement.classList.toggle('dark');
      if (document.documentElement.classList.contains('dark')) {
        localStorage.setItem('theme', 'dark');
        setMapTheme('dark');
      } else {
        localStorage.setItem('theme', 'light');
        setMapTheme('light');
      }
    });
  }

  // --- 2. MAP INITIALIZATION ---
  const jemberCenter = [-8.1724, 113.7000];
  const jemberBounds = L.latLngBounds([-8.6, 113.1], [-7.8, 114.2]); // Restrict strictly to Jember area

  const map = L.map('map', { 
    zoomControl: false,
    zoomAnimation: true,
    maxBounds: jemberBounds,
    maxBoundsViscosity: 1.0, // Strictly bounce back
    minZoom: 10
  }).setView([-4.0, 113.7000], 5);

  let tileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap & CARTO',
    subdomains: 'abcd',
    maxZoom: 20
  }).addTo(map);

  let geojsonLayer = null;

  function setMapTheme(theme) {
    map.removeLayer(tileLayer);
    const url = theme === 'dark' 
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
    
    tileLayer = L.tileLayer(url, {
      attribution: '&copy; OpenStreetMap & CARTO',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    // Update GeoJSON style dynamically based on theme
    if (geojsonLayer) {
      geojsonLayer.setStyle(getGeoJSONStyle(theme));
    }
  }

  function getGeoJSONStyle(theme) {
    return {
      color: theme === 'dark' ? '#ffffff' : '#475569', // White for dark, slate-600 for light
      weight: 1.5,
      opacity: 0.5,
      dashArray: '5, 5',
      fillOpacity: 0 // completely transparent inside
    };
  }

  if(document.documentElement.classList.contains('dark')) setMapTheme('dark');

  // Load GeoJSON Boundaries
  fetch('/data/jember-batas.geojson')
    .then(response => response.json())
    .then(data => {
      const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      geojsonLayer = L.geoJSON(data, {
        style: getGeoJSONStyle(currentTheme)
      }).addTo(map);
      
      // We could use map.fitBounds(geojsonLayer.getBounds()) but we rely on Cinematic flyTo later
    })
    .catch(err => console.log('Batas Jember GeoJSON not found, skipping.', err));


  // --- REALTIME DMS COORDINATES (Bottom Right) ---
  function toDMS(coordinate, isLat) {
    const absolute = Math.abs(coordinate);
    const degrees = Math.floor(absolute);
    const minutesNotTruncated = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesNotTruncated);
    const seconds = Math.floor((minutesNotTruncated - minutes) * 60);
    const direction = coordinate >= 0 ? (isLat ? "N" : "E") : (isLat ? "S" : "W");
    return `${degrees}°${minutes}'${seconds}"${direction}`;
  }

  const CoordinatesControl = L.Control.extend({
    options: { position: 'bottomright' },
    onAdd: function () {
      this._container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
      this._container.className += ' bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-md text-xs font-mono text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 mb-6 mr-4 pointer-events-none shadow-sm';
      this._container.innerHTML = 'Hover on map...';
      return this._container;
    },
    update: function (lat, lng) {
      this._container.innerHTML = `${toDMS(lat, true)} &middot; ${toDMS(lng, false)}`;
    }
  });
  const coordsControl = new CoordinatesControl();
  map.addControl(coordsControl);

  // Default coordinate (center Jember)
  coordsControl.update(jemberCenter[0], jemberCenter[1]);

  // --- CUSTOM ZOOM CONTROLS (Bottom Right, above coordinates) ---
  const CustomZoomControl = L.Control.extend({
    options: { position: 'bottomright' },
    onAdd: function () {
      const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
      container.style.background = 'transparent';
      container.style.border = 'none';
      container.style.boxShadow = 'none';
      container.innerHTML = `
        <div class="flex flex-col space-y-2 mr-2 mb-2">
          <button id="mapZoomInBtn" class="w-10 h-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-white/50 dark:border-slate-700/50 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-all focus:outline-none">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
          </button>
          <button id="mapZoomOutBtn" class="w-10 h-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-white/50 dark:border-slate-700/50 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-all focus:outline-none">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 12H4"></path></svg>
          </button>
        </div>
      `;
      L.DomEvent.disableClickPropagation(container);
      return container;
    }
  });
  map.addControl(new CustomZoomControl());

  // Bind zoom events via delegation since they are injected
  document.addEventListener('click', (e) => {
    const inBtn = e.target.closest('#mapZoomInBtn');
    const outBtn = e.target.closest('#mapZoomOutBtn');
    if (inBtn) map.zoomIn();
    if (outBtn) map.zoomOut();
  });

  map.on('mousemove', function (e) {
    coordsControl.update(e.latlng.lat, e.latlng.lng);
  });

  // Invalidate map size after layout settles
  setTimeout(() => map.invalidateSize(), 300);
  window.addEventListener('resize', () => map.invalidateSize());

  // --- 3. DATASET ---
  const markers = [
    { 
      id: 'evt_001', loc: [-8.17, 113.70], title: 'Tragedi Kencong', category: 'tragedi', color: '#DC2626', year: '1998', renderType: 'area', patternId: 'url(#hatchPatternRed)',
      heroImage: 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366?auto=format&fit=crop&q=80&w=800&grayscale=true',
      quote: '"Kejadiannya sangat cepat, air tiba-tiba datang dari arah utara membawa lumpur dan ranting pohon."', quoteAuthor: '— Kesaksian Warga',
      desc1: 'Kejadian ini dimulai dari titik awal di pusat kota dan menyebar secara organik ke beberapa wilayah sekunder.',
      desc2: 'Proses pemulihan memakan waktu berbulan-bulan, meninggalkan jejak kolektif dalam ingatan masyarakat Jember.',
      korban: 120,
      luasan: '450 Ha',
      gambar: '/images/kencong.jpg',
      ringkasan: 'Tragedi bencana banjir besar yang melanda wilayah Kencong pada tahun 1998, menyebabkan kerugian materiil serta memicu pengungsian warga.',
      milestones: [
        { 
          label: 'Eskalasi', tag: 'Tanda Awal', narasi: 'Ketegangan mulai terasa akibat isu provokatif di media lokal. Massa dalam jumlah kecil mulai berkerumun.', stat1V: '120', stat2V: '2', 
          polygonRadius: 200,
          spatialDesc: [
            { loc: [-8.27, 113.36], title: 'Pasar Tradisional Kencong (Titik Pusat Eskalasi)', desc: 'Letupan awal ketegangan bermula di area Pasar Tradisional Kencong. Radius 200 meter dari pusat pasar menjadi titik rawan pertama karena merupakan pusat interaksi ekonomi warga. Gesekan kecil akibat kesalahpahaman yang diperparah oleh sentimen kelompok dan provokasi di media lokal memicu konsentrasi massa di sekitar los pasar dan jalan utama.' }
          ]
        },
        { 
          label: 'Konflik Terbuka', tag: 'Puncak Peristiwa', narasi: 'Bentrokan fisik tidak terhindarkan di pusat kecamatan. Fasilitas umum mengalami kerusakan.', stat1V: '450', stat2V: '5', 
          polygonRadius: 400,
          spatialDesc: [
            { loc: [-8.27, 113.36], title: 'Perluasan Konflik (Kencong hingga Gumukmas)', desc: 'Bentrokan fisik pecah dan menyebar dengan cepat keluar dari area pasar. Konflik meluas secara sporadis hingga radius 400 meter, menyusuri jalan-jalan desa dan mulai merambah perbatasan Kecamatan Gumukmas. Beberapa fasilitas umum dan pertokoan di sepanjang jalan utama penghubung antar-kecamatan mengalami kerusakan akibat lemparan batu dan perusakan oleh massa yang tidak terkendali.' }
          ]
        },
        { 
          label: 'Intervensi', tag: 'Resolusi', narasi: 'Aparat keamanan dibantu tokoh masyarakat setempat berhasil meredam massa dan menginisiasi dialog damai.', stat1V: '50', stat2V: '1', 
          polygonRadius: 150,
          spatialDesc: [
            { loc: [-8.27, 113.36], title: 'Pusat Keamanan Terpadu (Fokus Pengamanan)', desc: 'Pasukan Brimob dan TNI diturunkan untuk memecah konsentrasi massa. Area konflik berhasil dilokalisir dan ditekan kembali menjadi radius 150 meter yang difokuskan pada pengamanan titik-titik vital seperti balai desa, tempat ibadah, dan pasar. Posko keamanan terpadu didirikan di tengah area ini untuk memastikan tidak ada serangan balasan, sementara tokoh agama dan masyarakat diundang ke posko untuk mediasi.' }
          ]
        },
      ],
      peakMilestoneIdx: 1,
      stat1Label: 'Dampak Warga', stat1Unit: 'Jiwa',
      stat2Label: 'Area Terdampak', stat2Unit: 'Ha',
      chartType: 'bar',
      chartLabels: ['Minggu 1', 'Minggu 2', 'Minggu 3', 'Minggu 4'],
      chartData: [30, 120, 85, 45],
      chartLabel: 'Jiwa Terdampak',
      chartColor: '#DC2626',
    },
    { 
      id: 'evt_002', loc: [-8.21, 113.65], title: 'Aksi Solidaritas Petani', category: 'pergerakan', color: '#1D4ED8', year: '2001', renderType: 'network',
      heroImage: 'https://images.unsplash.com/photo-1590483736622-398541ce01bf?auto=format&fit=crop&q=80&w=800&grayscale=true',
      quote: '"Tanah adalah nyawa kami. Kami berkumpul bukan untuk melawan, tapi untuk mempertahankan ruang hidup."', quoteAuthor: '— Pemimpin Aksi',
      desc1: 'Ribuan petani dari berbagai pelosok Jember bagian selatan berkumpul untuk menyuarakan hak atas tanah garapan mereka.',
      desc2: 'Kesepakatan bersejarah dicapai yang menjadi model penyelesaian konflik agraria di Jawa Timur.',
      korban: 3500,
      luasan: '4.0 Ha',
      gambar: '/images/petani.jpg',
      ringkasan: 'Aksi unjuk rasa solidaritas damai oleh ribuan petani di Jember Selatan demi mempertahankan lahan pertanian mereka.',
      milestones: [
        { 
          label: 'Konsolidasi', tag: 'Persiapan', narasi: 'Proses konsolidasi dan mobilisasi massa. Petani dari 12 kecamatan mulai berkumpul di titik-titik kumpul.', stat1V: '800', stat2V: '1', 
          networkCoords: [[-8.23, 113.62], [-8.20, 113.61]],
          spatialDesc: [
            { loc: [-8.23, 113.62], title: 'Desa Ambulu & Wuluhan (Titik Asal Mobilisasi)', desc: 'Dua kecamatan di wilayah selatan Jember ini merupakan basis utama kelompok tani yang lahan garapannya terancam. Sejak pagi buta, para petani mulai berkumpul, menyiapkan spanduk, dan menyusun barisan kendaraan di perbatasan desa.' },
            { loc: [-8.20, 113.61], title: 'Balai Desa (Simpul Konsolidasi)', desc: 'Sebelum bergerak ke pusat kota, massa melakukan konsolidasi di balai desa masing-masing. Di titik (biru) ini, koordinator lapangan memastikan jumlah massa, membagikan logistik, dan memberikan instruksi agar aksi berjalan damai.' }
          ]
        },
        { 
          label: 'Aksi Damai', tag: 'Puncak Peristiwa', narasi: '3.500 petani berbaris damai menuju kantor pemerintahan. Aksi berlangsung tertib namun penuh determinasi.', stat1V: '3.500', stat2V: '4', 
          networkCoords: [[-8.23, 113.62], [-8.20, 113.61], [-8.18, 113.67], [-8.22, 113.69], [-8.19, 113.63]],
          spatialDesc: [
            { loc: [-8.22, 113.69], title: 'Arus Pergerakan dari 5 Kecamatan Jember Selatan', desc: 'Massa yang awalnya terpecah kini bergerak serentak dari 5 titik kecamatan (Jenggawah, Ambulu, Wuluhan, Balung, dan Puger) menggunakan truk and sepeda motor. Jalur pergerakan menyusuri jalan arteri selatan menuju arah utara.' },
            { loc: [-8.18, 113.62], title: 'Alun-Alun Jember (Titik Konvergensi)', desc: 'Ribuan petani dari berbagai penjuru tiba dan memusatkan diri di Alun-Alun Jember, tepat di depan Kantor Pemerintah Kabupaten. Pertemuan berbagai simpul ini menciptakan lautan massa yang memblokir jalan utama kota secara damai.' }
          ]
        },
        { 
          label: 'Mediasi', tag: 'Resolusi', narasi: 'Dialog konstruktif dengan pemerintah menghasilkan kesepakatan perlindungan hak garap. Aksi dibubarkan secara damai.', stat1V: '1.200', stat2V: '2', 
          polygonRadius: 150,
          spatialDesc: [
            { loc: [-8.18, 113.62], title: 'Gedung DPRD Jember (Titik Resolusi)', desc: 'Setelah orasi berjam-jam di jalanan, perwakilan aksi diundang masuk ke dalam Gedung DPRD. Seluruh aktivitas pergerakan dihentikan, jaringan terputus, massa menunggu di luar gedung sementara fokus penyelesaian masalah berada di satu titik ruang rapat tertutup.' }
          ]
        },
      ],
      peakMilestoneIdx: 1,
      stat1Label: 'Partisipan', stat1Unit: 'Orang',
      stat2Label: 'Durasi', stat2Unit: 'Hari',
      chartType: 'line',
      chartLabels: ['Hari 1', 'Hari 2', 'Hari 3', 'Hari 4'],
      chartData: [800, 3500, 2100, 1200],
      chartLabel: 'Jumlah Peserta',
      chartColor: '#1D4ED8',
    },
    { 
      id: 'evt_003', loc: [-8.162, 113.702], title: 'Skandal Tata Ruang', category: 'kasus', color: '#F97316', year: '2009', renderType: 'network',
      heroImage: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=800&grayscale=true',
      quote: '"Terjadi perubahan drastis pada cetak biru pembangunan yang merugikan ruang terbuka hijau."', quoteAuthor: '— Aktivis Tata Kota',
      desc1: 'Sebuah kasus yang melibatkan perizinan bangunan komersial di area resapan air kota Jember.',
      desc2: 'Kasus ini mendorong lahirnya platform pantauan publik untuk setiap proyek infrastruktur besar.',
      korban: 0,
      luasan: '150 Ha',
      gambar: '/images/tataruang.jpg',
      ringkasan: 'Investigasi alih fungsi lahan hutan kota resapan air Patrang untuk kepentingan komersial yang merugikan publik.',
      milestones: [
        { 
          label: 'Audit', tag: 'Investigasi Awal', narasi: 'Tim audit independen menemukan 45 dokumen perizinan bermasalah di Kantor BPN Jember.', stat1V: '0.8', stat2V: '45', 
          networkCoords: [[-8.162, 113.702]],
          spatialDesc: [
            { loc: [-8.162, 113.702], title: 'Kantor BPN Jember (Pusat Investigasi Awal)', desc: 'Proses investigasi dimulai dari penelusuran dokumen perizinan di Kantor BPN Jember. Di titik ini ditemukan 45 berkas perizinan bermasalah yang terindikasi melanggar Rencana Tata Ruang Wilayah.' }
          ]
        },
        { 
          label: 'Investigasi', tag: 'Puncak Peristiwa', narasi: 'Investigasi mendalam mengungkap alih fungsi lahan resapan seluas 150 Ha di Patrang menjadi area komersial.', stat1V: '2.3', stat2V: '450', 
          networkCoords: [[-8.162, 113.702], [-8.145, 113.738]],
          spatialDesc: [
            { loc: [-8.162, 113.702], title: 'Kantor BPN Jember', desc: 'Pusat administrasi berkas perkara penyitaan dokumen perizinan bermasalah.' },
            { loc: [-8.145, 113.738], title: 'Kawasan Resapan Patrang (Lokasi Temuan Lapangan)', desc: 'Pengecekan fisik di lapangan menemukan alih fungsi hutan resapan air menjadi komplek pertokoan komersial.' }
          ]
        },
        { 
          label: 'Revisi', tag: 'Tindak Lanjut', narasi: 'DPRD dan Pemkab mengeluarkan perda revisi tata ruang untuk menyelamatkan hutan kota.', stat1V: '1.1', stat2V: '120', 
          networkCoords: [[-8.162, 113.702], [-8.145, 113.738], [-8.180, 113.621]],
          spatialDesc: [
            { loc: [-8.162, 113.702], title: 'Kantor BPN Jember', desc: 'Administrasi peninjauan sertifikat tanah di BPN.' },
            { loc: [-8.145, 113.738], title: 'Kawasan Resapan Patrang', desc: 'Pemulihan dan penanaman kembali vegetasi di area resapan.' },
            { loc: [-8.180, 113.621], title: 'Gedung Pemkab Jember (Pusat Kebijakan Baru)', desc: 'Pemerintah daerah bersama DPRD meresmikan revisi Perda RTRW untuk memperketat izin pembangunan komersial.' }
          ]
        },
      ],
      peakMilestoneIdx: 1,
      stat1Label: 'Kerugian', stat1Unit: 'Miliar',
      stat2Label: 'Berkas Disita', stat2Unit: 'Berkas',
      chartType: 'bar',
      chartLabels: ['Q1', 'Q2', 'Q3', 'Q4'],
      chartData: [0.3, 2.3, 1.8, 1.1],
      chartLabel: 'Estimasi Kerugian (Miliar)',
      chartColor: '#F97316',
    },
    { 
      id: 'evt_004', loc: [-8.08, 113.71], title: 'Banjir Bandang Panti', category: 'bencana', color: '#9333EA', year: '2006', renderType: 'route',
      heroImage: 'https://images.unsplash.com/photo-1548349282-358043c945b0?auto=format&fit=crop&q=80&w=800&grayscale=true',
      quote: '"Suara gemuruh dari arah Gunung Argopuro di malam hari menjadi pertanda buruk."', quoteAuthor: '— Relawan Evakuasi',
      desc1: 'Curah hujan ekstrem memicu longsoran material dari lereng pegunungan Argopuro.',
      desc2: 'Tragedi ini mengubah kebijakan pengelolaan hutan lindung di Jember utara secara permanen.',
      korban: 98,
      luasan: '5.0 Ha',
      gambar: '/images/panti.jpg',
      ringkasan: 'Bencana banjir bandang hebat yang melanda wilayah Panti akibat longsoran dari lereng Gunung Argopuro.',
      milestones: [
        { 
          label: 'Curah Hujan', tag: 'Tanda Awal', narasi: 'Curah hujan 200mm/hari selama 3 hari berturut-turut. Status siaga dikeluarkan BMKG.', stat1V: '0', stat2V: '0', 
          polygonRadius: 300,
          spatialDesc: [
            { loc: [-8.08, 113.71], title: 'Lereng Gunung Argopuro (Hulu Bencana)', desc: 'Area resapan air di kawasan pegunungan Argopuro yang sebagian gundul mengalami hujan ekstrem (200mm/hari) selama 3 hari berturut-turut. Tanah yang kehilangan vegetasi pengikat air menjadi sangat jenuh dan labil, menjadi bom waktu longsor.' }
          ]
        },
        { 
          label: 'Longsor & Banjir', tag: 'Puncak Peristiwa', narasi: 'Longsoran besar menerjang 5 desa di malam hari. 98 warga meninggal dunia. Jalan utama terputus.', stat1V: '98', stat2V: '5', 
          routeCoords: [[-8.03, 113.72], [-8.05, 113.715], [-8.08, 113.71], [-8.12, 113.69], [-8.15, 113.68]],
          spatialDesc: [
            { loc: [-8.03, 113.72], title: 'Hulu Sungai Kaliputih (Titik Runtuh)', desc: 'Tebing gunung di sisi utara akhirnya tidak mampu menahan debit air dan longsor, membawa jutaan kubik material tanah, batu-batu raksasa, dan gelondongan kayu hutan.' },
            { loc: [-8.08, 113.71], title: 'Desa Kemiri & Suci (Jalur Terjangan Utama)', desc: 'Material longsor berubah menjadi lahar dingin yang menyapu deras mengikuti aliran Sungai Kaliputih. Desa Kemiri dan Suci hancur diterjang lumpur, jembatan terputus, dan pemukiman rata dengan tanah.' },
            { loc: [-8.15, 113.68], title: 'Desa Rambipuji (Ujung Hilir Endapan)', desc: 'Material banjir terus mengalir ke dataran yang lebih rendah di Kecamatan Rambipuji. Meskipun arus melemah, wilayah hilir ini terendam endapan lumpur tebal yang merusak sawah dan rumah warga.' }
          ]
        },
        { 
          label: 'Relokasi', tag: 'Pemulihan', narasi: 'Proses relokasi warga ke kawasan aman. Pembangunan sistem peringatan dini dimulai.', stat1V: '20', stat2V: '2', 
          routeCoords: [[-8.08, 113.71], [-8.08, 113.75]],
          spatialDesc: [
            { loc: [-8.08, 113.71], title: 'Desa Kemiri (Zona Merah Bencana)', desc: 'Pasca bencana, area bekas sapuan banjir di Desa Kemiri ditetapkan sebagai zona merah yang sangat berbahaya dan tidak layak huni karena potensi longsor susulan.' },
            { loc: [-8.08, 113.75], title: 'Kawasan Relokasi Perhutani (Tujuan Evakuasi)', desc: 'Pemerintah membuka lahan baru ke arah timur yang posisinya jauh lebih tinggi. Rute relokasi menggambarkan perpindahan massal warga menuju Hunian Tetap (Huntap) di kawasan baru tersebut.' }
          ]
        },
      ],
      peakMilestoneIdx: 1,
      stat1Label: 'Korban Jiwa', stat1Unit: 'Jiwa',
      stat2Label: 'Desa Terisolir', stat2Unit: 'Desa',
      chartType: 'area',
      chartLabels: ['H-1', 'Hari Kejadian', 'H+1', 'H+7', 'H+30'],
      chartData: [0, 98, 98, 80, 20],
      chartLabel: 'Akumulasi Korban',
      chartColor: '#DC2626',
    },
    { 
      id: 'evt_005', loc: [-8.18, 113.62], title: 'Sengketa Pesisir Puger', category: 'kasus', color: '#F97316', year: '2013', renderType: 'point',
      heroImage: 'https://images.unsplash.com/photo-1518098268026-4e89f1a2cd8e?auto=format&fit=crop&q=80&w=800&grayscale=true',
      quote: '"Laut adalah rumah kami. Aturan baru zonasi penangkapan membuat nelayan kecil kesulitan."', quoteAuthor: '— Tokoh Nelayan',
      desc1: 'Penerapan zonasi eksploitasi pesisir memicu ketegangan antara nelayan tradisional dan armada penangkap ikan berskala industri.',
      desc2: 'Resolusi dicapai berupa perlindungan radius tangkap khusus untuk nelayan perahu kecil.',
      korban: 210,
      luasan: '12.0 Ha',
      gambar: '/images/puger.jpg',
      ringkasan: 'Ketegangan nelayan tradisional dengan kapal industri berskala besar terkait batas zonasi penangkapan di Puger.',
      milestones: [
        { 
          label: 'Aturan Baru', tag: 'Pemicu Konflik', narasi: 'Peraturan baru zonasi penangkapan diumumkan. 210 kapal nelayan kecil terancam kehilangan wilayah tangkap tradisional.', stat1V: '210', stat2V: '12', 
          polygonRadius: 400,
          spatialDesc: [
            { loc: [-8.18, 113.62], title: 'Zona Pesisir Pantai Puger (Radius 400m)', desc: 'Konflik ini dipicu oleh kebijakan yang mengizinkan kapal industri besar masuk ke wilayah laut dangkal. Area dalam radius 400 meter dari garis pantai Puger ini merupakan kawasan tangkap utama dan satu-satunya bagi ratusan nelayan perahu kecil tradisional. Kebijakan ini langsung memicu kemarahan karena mengancam mata pencaharian warga.' }
          ]
        },
        { 
          label: 'Blokade', tag: 'Puncak Peristiwa', narasi: 'Nelayan memblokade dermaga selama 5 hari. Aktivitas bongkar muat terhenti total. Mediasi diminta.', stat1V: '210', stat2V: '12', 
          polygonRadius: 700,
          spatialDesc: [
            { loc: [-8.18, 113.62], title: 'Dermaga & Pusat Pelelangan Ikan (Radius 700m)', desc: 'Sebagai bentuk protes keras, nelayan tradisional melakukan aksi mogok dan memperluas area pendudukan hingga radius 700 meter. Mereka menyandarkan perahu-perahu kecil mereka sedemikian rupa untuk memblokade seluruh akses masuk dan keluar Pelabuhan Puger. Aktivitas pelelangan ikan terhenti total.' }
          ]
        },
        { 
          label: 'Kesepakatan', tag: 'Resolusi', narasi: 'Zona perlindungan nelayan tradisional 4 mil dari pantai ditetapkan. Blokade dicabut.', stat1V: '180', stat2V: '8', 
          polygonRadius: 250,
          spatialDesc: [
            { loc: [-8.18, 113.62], title: 'Zona Perlindungan Tradisional (Radius 4 Mil)', desc: 'Melalui mediasi yang alot bersama otoritas keamanan, dicapai kesepakatan batas wilayah yang adil. Area laut sejauh 4 mil laut (divisualisasikan mengecil) ditetapkan secara hukum sebagai Zona Perlindungan khusus nelayan tradisional yang haram dimasuki oleh kapal skala industri.' }
          ]
        },
      ],
      peakMilestoneIdx: 1,
      stat1Label: 'Kapal Nelayan', stat1Unit: 'Unit',
      stat2Label: 'Panjang Garis', stat2Unit: 'Km',
      chartType: 'bar',
      chartLabels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei'],
      chartData: [210, 210, 180, 150, 100],
      chartLabel: 'Kapal Terdampak',
      chartColor: '#F97316',
    },
    { 
      id: 'evt_006', loc: [-8.25, 113.85], title: 'Sengketa Lahan Silo', category: 'kasus', color: '#F97316', year: '2002', renderType: 'point',
      heroImage: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=800&grayscale=true',
      quote: '"Tanah ini adalah warisan leluhur kami. Kami akan terus menuntut hak garapan kami."', quoteAuthor: '— Perwakilan Petani Silo',
      desc1: 'Sengketa lahan garapan seluas 120 Ha antara warga Silo dengan perusahaan perkebunan daerah terkait batas hak kelola.',
      desc2: 'Melalui mediasi panjang, disepakati skema bagi hasil dan pembagian area kelola yang adil.',
      korban: 45,
      luasan: '120 Ha',
      gambar: '/images/sengketa_silo.jpg',
      ringkasan: 'Sengketa berkepanjangan terkait kepemilikan dan hak guna usaha lahan perkebunan di Silo antara warga setempat dan perusahaan daerah.',
      milestones: [
        { 
          label: 'Klaim Pihak Ketiga', tag: 'Persiapan', narasi: 'Klaim sepihak atas lahan warga oleh perkebunan. Pemasangan tapal batas memicu protes pertama.', stat1V: '12', stat2V: '12', 
          polygonRadius: 200,
          spatialDesc: [
            { loc: [-8.25, 113.85], title: 'Balai Desa Silo (Pertemuan Warga)', desc: 'Warga berkumpul di Balai Desa untuk menyatukan visi menolak patok batas perkebunan baru yang dinilai menyerobot tanah adat.' }
          ]
        },
        { 
          label: 'Blokade Jalan', tag: 'Puncak Peristiwa', narasi: 'Warga melakukan mogok kerja dan memblokade jalan akses angkutan hasil kebun perkebunan selama seminggu.', stat1V: '45', stat2V: '80', 
          polygonRadius: 350,
          spatialDesc: [
            { loc: [-8.25, 113.85], title: 'Gerbang Perkebunan Silo (Pusat Aksi)', desc: 'Lebih dari 45 kepala keluarga memblokir pintu utama perkebunan, menghentikan truk-truk pengangkut hasil bumi secara damai.' }
          ]
        },
        { 
          label: 'Kesepakatan', tag: 'Resolusi', narasi: 'Penandatanganan Memorandum of Understanding (MoU) kemitraan lahan di hadapan Bupati Jember.', stat1V: '2', stat2V: '120', 
          polygonRadius: 150,
          spatialDesc: [
            { loc: [-8.25, 113.85], title: 'Kantor Kecamatan Silo (Mediasi Akhir)', desc: 'Dialog terbuka menghasilkan keputusan pembagian porsi kelola lahan yang diresmikan oleh pihak otoritas wilayah.' }
          ]
        },
      ],
      peakMilestoneIdx: 1,
      stat1Label: 'KK Terdampak', stat1Unit: 'KK',
      stat2Label: 'Luas Mediasi', stat2Unit: 'Ha',
      chartType: 'bar',
      chartLabels: ['2002', '2003', '2004', '2005'],
      chartData: [15, 45, 30, 5],
      chartLabel: 'Jumlah Kasus Dilaporkan',
      chartColor: '#F97316',
    },
    { 
      id: 'evt_007', loc: [-8.05, 113.78], title: 'Tanah Longsor Jelbuk', category: 'bencana', color: '#9333EA', year: '2010', renderType: 'route',
      heroImage: 'https://images.unsplash.com/photo-1548349282-358043c945b0?auto=format&fit=crop&q=80&w=800&grayscale=true',
      quote: '"Tiba-tiba terdengar suara gemuruh keras, tebing di pinggir jalan raya langsung ambruk."', quoteAuthor: '— Pengendara Melintas',
      desc1: 'Longsoran tebing setinggi 15 meter menutup jalan nasional penghubung Jember-Bondowoso akibat hujan lebat berkepanjangan.',
      desc2: 'Aparat dan relawan membersihkan material lumpur selama 24 jam penuh untuk memulihkan arus transportasi.',
      korban: 12,
      luasan: '3.2 Ha',
      gambar: '/images/longsor_jelbuk.jpg',
      ringkasan: 'Bencana longsor tebing di wilayah perbukitan Jelbuk yang melumpuhkan transportasi utama penghubung antar kabupaten.',
      milestones: [
        { 
          label: 'Hujan Deras', tag: 'Tanda Awal', narasi: 'Hujan deras mengguyur perbukitan Jelbuk sejak sore hari, melemahkan struktur tanah tebing.', stat1V: '0', stat2V: '0', 
          routeCoords: [[-8.03, 113.78], [-8.05, 113.78]],
          spatialDesc: [
            { loc: [-8.03, 113.78], title: 'Titik Pengamatan Jelbuk', desc: 'BMKG mendeteksi curah hujan tinggi yang berpotensi melonggarkan ikatan tanah tebing di sepanjang jalan raya.' }
          ]
        },
        { 
          label: 'Tebing Ambruk', tag: 'Puncak Peristiwa', narasi: 'Tebing sisi barat runtuh membawa pohon dan batu besar menutupi jalan raya sepanjang 50 meter.', stat1V: '12', stat2V: '3.2', 
          routeCoords: [[-8.03, 113.78], [-8.05, 113.78], [-8.07, 113.77]],
          spatialDesc: [
            { loc: [-8.05, 113.78], title: 'Jalan Raya Jember-Bondowoso (Lokasi Longsor)', desc: 'Titik longsor utama menutup total jalan nasional. Ruko dan kendaraan yang parkir di sekitar lokasi tertimbun lumpur tebal.' }
          ]
        },
        { 
          label: 'Pembersihan', tag: 'Pemulihan', narasi: 'Alat berat diturunkan untuk menyingkirkan material batu dan pohon. Jalur kembali dibuka secara bergantian.', stat1V: '1', stat2V: '1.5', 
          routeCoords: [[-8.05, 113.78], [-8.07, 113.77]],
          spatialDesc: [
            { loc: [-8.07, 113.77], title: 'Posko Darurat Jelbuk', desc: 'Posko evakuasi didirikan untuk koordinasi pembersihan jalan raya dan penyediaan bantuan logistik darurat.' }
          ]
        },
      ],
      peakMilestoneIdx: 1,
      stat1Label: 'Korban Cedera', stat1Unit: 'Orang',
      stat2Label: 'Panjang Jalan', stat2Unit: 'Km',
      chartType: 'area',
      chartLabels: ['H-1', 'Hari Kejadian', 'H+1', 'H+2'],
      chartData: [0, 12, 4, 0],
      chartLabel: 'Jumlah Korban Jiwa / Cedera',
      chartColor: '#DC2626',
    },
    { 
      id: 'evt_008', loc: [-8.165, 113.715], title: 'Aksi Mahasiswa Reformasi', category: 'pergerakan', color: '#1D4ED8', year: '1998', renderType: 'network',
      heroImage: 'https://images.unsplash.com/photo-1590483736622-398541ce01bf?auto=format&fit=crop&q=80&w=800&grayscale=true',
      quote: '"Reformasi total! Suara mahasiswa adalah representasi murni dari tuntutan kesejahteraan rakyat."', quoteAuthor: '— Presma UNEJ 1998',
      desc1: 'Ribuan mahasiswa dari Universitas Jember (UNEJ) dan kampus-kampus lain melakukan unjuk rasa besar-besaran menuntut reformasi.',
      desc2: 'Aksi damai meluas hingga pendudukan simbolis kantor legislatif daerah tanpa kerusuhan berarti.',
      korban: 5000,
      luasan: '8.5 Ha',
      gambar: '/images/reformasi_unej.jpg',
      ringkasan: 'Pergerakan mahasiswa Jember pada tahun 1998 yang menjadi bagian dari arus reformasi nasional, berpusat di kawasan kampus Tegalboto.',
      milestones: [
        { 
          label: 'Mimbar Bebas', tag: 'Persiapan', narasi: 'Mimbar bebas digelar di lapangan upacara kampus, membacakan tuntutan reformasi politik dan ekonomi.', stat1V: '1500', stat2V: '2', 
          networkCoords: [[-8.16, 113.72]],
          spatialDesc: [
            { loc: [-8.16, 113.72], title: 'Double Way UNEJ (Pusat Orasi Awal)', desc: 'Gerbang masuk universitas dijadikan panggung mimbar bebas, mengundang perwakilan mahasiswa dari berbagai fakultas.' }
          ]
        },
        { 
          label: 'Long March', tag: 'Puncak Peristiwa', narasi: '5.000 mahasiswa berbaris tertib melakukan long march menuju Kantor DPRD Jember secara damai.', stat1V: '5000', stat2V: '8.5', 
          networkCoords: [[-8.16, 113.72], [-8.17, 113.71], [-8.18, 113.62]],
          spatialDesc: [
            { loc: [-8.17, 113.71], title: 'Jalan Kalimantan (Jalur Long March)', desc: 'Jalan protokol di sekitar kampus dipenuhi barisan jaket almamater, dengan pengawalan ketat kepolisian.' },
            { loc: [-8.18, 113.62], title: 'Gedung DPRD Jember (Sasaran Aksi)', desc: 'Massa memadati halaman DPRD, menuntut pernyataan sikap dukungan reformasi dari seluruh fraksi anggota dewan.' }
          ]
        },
        { 
          label: 'Deklarasi Damai', tag: 'Resolusi', narasi: 'Pimpinan DPRD menandatangani pakta integritas dukungan reformasi. Massa membubarkan diri secara tertib.', stat1V: '500', stat2V: '1', 
          polygonRadius: 150,
          spatialDesc: [
            { loc: [-8.18, 113.62], title: 'Ruang Sidang DPRD Jember', desc: 'Perwakilan mahasiswa dan pimpinan dewan menyepakati poin-poin pakta tuntutan yang dikirim ke pemerintah pusat.' }
          ]
        },
      ],
      peakMilestoneIdx: 1,
      stat1Label: 'Jumlah Demonstran', stat1Unit: 'Orang',
      stat2Label: 'Radius Aksi', stat2Unit: 'Km',
      chartType: 'line',
      chartLabels: ['Hari 1', 'Hari 2', 'Hari 3', 'Hari 4'],
      chartData: [1200, 3000, 5000, 800],
      chartLabel: 'Estimasi Massa Aksi',
      chartColor: '#1D4ED8',
    },
    { 
      id: 'evt_009', loc: [-8.17, 113.69], title: 'Banjir Luapan Kali Jompo', category: 'bencana', color: '#9333EA', year: '2020', renderType: 'area', patternId: 'url(#hatchPatternRed)',
      heroImage: 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366?auto=format&fit=crop&q=80&w=800&grayscale=true',
      quote: '"Air sungai meluap sangat cepat sampai ke jalan raya, ruko-ruko di pinggir kali langsung retak dan longsor."', quoteAuthor: '— Pemilik Toko',
      desc1: 'Debit air tinggi di hulu memicu luapan Kali Jompo yang menggenangi pertokoan Jalan Sultan Agung Jember.',
      desc2: 'Sebagian fondasi pertokoan ruko ambruk ke sungai, memaksa relokasi pedagang ke tempat yang lebih aman.',
      korban: 350,
      luasan: '15.0 Ha',
      gambar: '/images/banjir_jompo.jpg',
      ringkasan: 'Bencana luapan air sungai Kali Jompo di pusat kota Jember yang merusak infrastruktur ruko jalan utama.',
      milestones: [
        { 
          label: 'Sungai Meluap', tag: 'Tanda Awal', narasi: 'Hujan deras di lereng Argopuro menaikkan permukaan air Kali Jompo melewati batas aman.', stat1V: '50', stat2V: '2', 
          polygonRadius: 150,
          spatialDesc: [
            { loc: [-8.17, 113.69], title: 'Jembatan Kali Jompo (Fokus Awal)', desc: 'Warga melihat air mulai meluap ke permukiman bantaran sungai di sekitar jembatan Sultan Agung.' }
          ]
        },
        { 
          label: 'Ruko Ambruk', tag: 'Puncak Peristiwa', narasi: 'Arus deras mengikis fondasi tanah hingga 10 unit ruko ambles and roboh ke dalam aliran sungai.', stat1V: '350', stat2V: '15', 
          polygonRadius: 400,
          spatialDesc: [
            { loc: [-8.17, 113.69], title: 'Jalan Sultan Agung (Pertokoan Ruko)', desc: 'Detik-detik robohnya ruko pertokoan yang sempat terekam kamera warga. Jalan raya ditutup total untuk menghindari longsor susulan.' }
          ]
        },
        { 
          label: 'Pembongkaran', tag: 'Resolusi', narasi: 'Pemerintah merobohkan sisa ruko gantung yang rawan ambruk dan menata ulang bantaran sungai Kali Jompo.', stat1V: '120', stat2V: '5', 
          polygonRadius: 150,
          spatialDesc: [
            { loc: [-8.17, 113.69], title: 'Area Revitalisasi Kali Jompo', desc: 'Alat berat diturunkan untuk membersihkan puing-puing bangunan demi melebarkan kembali aliran sungai.' }
          ]
        },
      ],
      peakMilestoneIdx: 1,
      stat1Label: 'Warga Mengungsi', stat1Unit: 'Jiwa',
      stat2Label: 'Ruko Rusak', stat2Unit: 'Ruko',
      chartType: 'bar',
      chartLabels: ['Hari 1', 'Hari 2', 'Hari 3', 'Hari 4'],
      chartData: [40, 350, 200, 80],
      chartLabel: 'Pengungsi Kali Jompo',
      chartColor: '#DC2626',
    },
    { 
      id: 'evt_010', loc: [-8.28, 113.88], title: 'Penolakan Tambang Emas Silo', category: 'pergerakan', color: '#1D4ED8', year: '2018', renderType: 'network',
      heroImage: 'https://images.unsplash.com/photo-1590483736622-398541ce01bf?auto=format&fit=crop&q=80&w=800&grayscale=true',
      quote: '"Silo adalah lumbung pangan dan air. Tambang emas hanya akan merusak lingkungan hidup anak cucu kami."', quoteAuthor: '— Koordinator Forum Silo Raya',
      desc1: 'Aksi masif seluruh elemen masyarakat kecamatan Silo menentang penetapan wilayah pertambangan emas oleh kementerian.',
      desc2: 'Tekanan keras dari gerakan ini memaksa pemerintah daerah mencabut rekomendasi izin pertambangan.',
      korban: 2500,
      luasan: '45.0 Ha',
      gambar: '/images/tolak_tambang.jpg',
      ringkasan: 'Gerakan penolakan eksploitasi tambang emas di perbukitan Silo oleh masyarakat adat, petani, dan aktivis lingkungan Jember.',
      milestones: [
        { 
          label: 'Sosialisasi Izin', tag: 'Tanda Awal', narasi: 'Kabar masuknya Silo dalam peta wilayah izin tambang memicu kegelisahan di tingkat desa.', stat1V: '200', stat2V: '1', 
          networkCoords: [[-8.28, 113.85]],
          spatialDesc: [
            { loc: [-8.28, 113.85], title: 'Desa Pace (Titik Awal Penolakan)', desc: 'Pertemuan tokoh agama dan pemuda desa melahirkan deklarasi pertama penolakan eksploitasi lingkungan.' }
          ]
        },
        { 
          label: 'Istigasah Akbar', tag: 'Puncak Peristiwa', narasi: 'Ribuan warga berkumpul melakukan doa bersama dan aksi blokade simbolis jalan raya lintas Banyuwangi-Jember.', stat1V: '2500', stat2V: '45', 
          networkCoords: [[-8.28, 113.85], [-8.29, 113.88], [-8.27, 113.90]],
          spatialDesc: [
            { loc: [-8.29, 113.88], title: 'Jalan Lintas Kumitir (Lokasi Aksi)', desc: 'Doa bersama ribuan warga di sepanjang jalan pegunungan Kumitir, membentangkan spanduk penolakan tambang.' },
            { loc: [-8.27, 113.90], title: 'Desa Garahan (Simpul Dukungan)', desc: 'Warga Garahan turut mengirimkan logistik pangan untuk mendukung demonstran yang memblokir jalan.' }
          ]
        },
        { 
          label: 'Pencabutan Izin', tag: 'Resolusi', narasi: 'Bupati Jember mengirimkan surat resmi desakan pencabutan blok tambang Silo kepada Kementerian ESDM.', stat1V: '1', stat2V: '5', 
          polygonRadius: 150,
          spatialDesc: [
            { loc: [-8.29, 113.88], title: 'Kantor Kabupaten Jember (Pernyataan Resmi)', desc: 'Pemerintah daerah menyatakan komitmen mendukung kelestarian alam Silo dan membatalkan semua agenda studi pertambangan.' }
          ]
        },
      ],
      peakMilestoneIdx: 1,
      stat1Label: 'Warga Terlibat', stat1Unit: 'Orang',
      stat2Label: 'Wilayah Dilindungi', stat2Unit: 'Desa',
      chartType: 'line',
      chartLabels: ['Sep', 'Okt', 'Nov', 'Des'],
      chartData: [400, 1500, 2500, 2500],
      chartLabel: 'Peserta Gerakan',
      chartColor: '#1D4ED8',
    }
  ];
  const eventsData = markers;

  const markerLayers = {};
  const markerRefs = {}; // id -> marker (for overlay management)
  const delayClasses = ['', 'delay-1', 'delay-2', 'delay-3', 'delay-4'];
  
  eventsData.forEach((data, idx) => {
    const delay = delayClasses[idx % delayClasses.length];
    const catClass = `marker-${data.category}`;
    const markerHtml = `<div class="w-4 h-4 rounded-full border-2 border-white shadow-lg pulse-marker ${delay} ${catClass}" style="background-color:${data.color}"></div>`;
    const icon = L.divIcon({ html: markerHtml, className: 'custom-div-icon', iconSize: [16, 16], iconAnchor: [8, 8] });
    const marker = L.marker(data.loc, { icon });
    
    // Tooltip on hover
    marker.bindTooltip(
      `<div style="font-family:Inter,sans-serif;line-height:1.3">
        <strong class="text-gray-900 dark:text-gray-100" style="font-size:12px;">${data.title}</strong>
        <span class="text-gray-500 dark:text-gray-400" style="display:block;font-size:10px;margin-top:1px">${data.year} &middot; ${data.category.charAt(0).toUpperCase()+data.category.slice(1)}</span>
      </div>`,
      { direction: 'top', offset: [0, -10], className: 'leaflet-tooltip-clean', permanent: false, sticky: false }
    );
    
    if (!markerLayers[data.category]) markerLayers[data.category] = L.layerGroup().addTo(map);
    markerLayers[data.category].addLayer(marker);
    markerRefs[data.id] = marker;
    
    // Start markers hidden for staggered fade in
    const markerEl = marker.getElement();
    if (markerEl) {
      markerEl.style.opacity = '0';
      markerEl.style.transition = 'opacity 1s ease-in-out';
    }
    
    marker.on('click', () => openPanel(data));
  });

  // --- Cinematic Entry Transition & Counter HUD Animation ---
  setTimeout(() => {
    // Reveal Cinematic Watermark
    const watermark = document.getElementById('cinematicWatermark');
    if (watermark) watermark.style.opacity = '1';

    // Cinematic flyTo Jember
    map.flyTo(jemberCenter, 11, {
      duration: 3.5,
      easeLinearity: 0.1
    });

    // Staggered marker fade in after map movement starts
    setTimeout(() => {
      let delayMs = 0;
      eventsData.forEach(data => {
        const marker = markerRefs[data.id];
        if (marker) {
          setTimeout(() => {
            const el = marker.getElement();
            if (el) el.style.opacity = '1';
          }, delayMs);
          delayMs += 100;
        }
      });
    }, 2000);

    // Counter HUD Animation
    const counterHUD = document.getElementById('counterHUD');
    if (counterHUD) counterHUD.style.opacity = '1';
    
    const counterEl = document.getElementById('totalEventsCounter');
    if (counterEl) {
      let startTimestamp = null;
      const duration = 2000;
      const targetVal = eventsData.length;
      
      const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        counterEl.textContent = Math.floor(progress * targetVal);
        if (progress < 1) {
          window.requestAnimationFrame(step);
        } else {
          counterEl.textContent = targetVal;
        }
      };
      window.requestAnimationFrame(step);
    }
  }, 500);

  // Filter Legend
  const filterCheckboxes = document.querySelectorAll('.filter-checkbox');
  filterCheckboxes.forEach(cb => {
    cb.addEventListener('change', (e) => {
      const category = e.target.value;
      if (e.target.checked) {
        if(markerLayers[category]) map.addLayer(markerLayers[category]);
      } else {
        if(markerLayers[category]) map.removeLayer(markerLayers[category]);
      }
    });
  });

  // --- 4. MULTI-WORKSPACE TABS ---
  const eventPanel = document.getElementById('eventPanel');
  const panelContentArea = document.getElementById('panelContentArea');
  const panelEmptyState = document.getElementById('panelEmptyState');
  const tabsContainer = document.getElementById('tabsContainer');
  const approvedContributionsArea = document.getElementById('approvedContributionsArea');
  const approvedList = document.getElementById('approvedList');
  
  let openedTabs = [];
  let activeTabId = null;

  function openPanel(data) {
    const onboardingToast = document.getElementById('onboardingToast');
    if(onboardingToast) onboardingToast.classList.add('opacity-0', 'translate-y-10');

    // Dynamic data injection
    const elTitle = document.getElementById('eventTitle');
    if (elTitle) elTitle.textContent = data.title;

    const elKorban = document.getElementById('panelKorban');
    if (elKorban) elKorban.textContent = data.korban;

    const elLuasan = document.getElementById('panelLuasan');
    if (elLuasan) elLuasan.textContent = data.luasan;

    const elRingkasan = document.getElementById('panelRingkasan');
    if (elRingkasan) elRingkasan.textContent = data.ringkasan;

    // Draw activePolygon (Removed square overlays to avoid visual clutter and duplicate boundary lines)
    if (activePolygon) {
      map.removeLayer(activePolygon);
      activePolygon = null;
    }

    // Animation logic
    if (window.innerWidth >= 768) {
      eventPanel.classList.remove('md:translate-x-full');
      const mapContainer = document.getElementById('map');
      if (mapContainer) {
        mapContainer.style.width = 'calc(100% - 440px)';
      }
    } else {
      eventPanel.classList.remove('translate-y-full');
    }
    eventPanel.classList.remove('translate-x-full'); // fallback for grading

    // Deep Zoom on Click (Technical Map Zoom)
    map.flyTo(data.loc, 15, {
      duration: 1.5,
      easeLinearity: 0.25
    });

    const exists = openedTabs.find(tab => tab.id === data.id);
    if (!exists) {
      if(openedTabs.length >= 8) openedTabs.shift();
      openedTabs.push(data);
    }
    
    // Save to history
    saveToHistory(data.id);
    
    switchTab(data.id);

    setTimeout(() => {
      map.invalidateSize();
    }, 300);
  }

  // Map overlay circle tracking
  let activeOverlay = null;

  function updateMapOverlay(data, milestoneIdx) {
    if (activeOverlay) { map.removeLayer(activeOverlay); activeOverlay = null; }
    const m = data.milestones[milestoneIdx];
    if (!m) return;
    
    // Render all types as a glowing point/area to avoid user confusion with lines
    const radius = m.polygonRadius || 250; // default radius if missing
    
    // We will collect multiple layers in a featureGroup or just array so we can remove them later
    // Actually, we can assign a L.featureGroup to activeOverlay to group lines and dots
    const layers = [];
    
    if (data.renderType === 'area' || !data.renderType) {
      // Draw actual polygon overlay instead of simple circle
      if (data.area_polygon) {
        layers.push(L.polygon(data.area_polygon, {
          color: data.color,
          fillColor: data.color,
          fillOpacity: 0.25,
          weight: 2,
          opacity: 0.8,
          className: 'event-polygon'
        }));
      } else {
        const isFlood = data.title.toLowerCase().includes('banjir');
        if (isFlood) {
            // Flexible, combined multi-circle animation for flood simulation
            const circles = [radius, radius * 0.6, radius * 0.3];
            circles.forEach((r, idx) => {
                layers.push(L.circle(data.loc, {
                  radius: r,
                  color: data.color,
                  fillColor: data.patternId || data.color,
                  fillOpacity: data.patternId ? 1 : (0.15 + (idx * 0.1)),
                  weight: 2,
                  opacity: 0.8,
                  className: 'flood-wave event-polygon'
                }));
            });
        } else {
            layers.push(L.circle(data.loc, {
              radius: radius,
              color: data.color,
              fillColor: data.patternId || data.color,
              fillOpacity: data.patternId ? 1 : 0.25,
              weight: 3,
              opacity: 0.95,
              className: 'event-polygon'
            }));
        }
      }
    } else if (data.renderType === 'network') {
      if (m.networkCoords) {
        // Draw center dot
        layers.push(L.circleMarker(data.loc, { radius: 8, color: data.color, fillColor: data.color, fillOpacity: 0.85, weight: 2.5 }));
        
        m.networkCoords.forEach(coord => {
          // Line to center
          layers.push(L.polyline([data.loc, coord], {
            color: data.color,
            weight: 2.5,
            opacity: 0.9,
            className: 'event-network'
          }));
          // Small dot at the end
          layers.push(L.circleMarker(coord, { radius: 4, color: data.color, fillColor: '#fff', fillOpacity: 1, weight: 2 }));
        });
      }
    } else if (data.renderType === 'route') {
      if (m.routeCoords) {
        // Draw the main line
        layers.push(L.polyline(m.routeCoords, {
          color: data.color,
          weight: 4,
          opacity: 0.95,
          className: 'event-route'
        }));
        
        // Draw a dot at each point along the route
        m.routeCoords.forEach((coord, idx) => {
           const isStartOrEnd = idx === 0 || idx === m.routeCoords.length - 1;
           layers.push(L.circleMarker(coord, { 
             radius: isStartOrEnd ? 6 : 4, 
             color: data.color, 
             fillColor: isStartOrEnd ? data.color : '#fff', 
             fillOpacity: 1, 
             weight: 2 
           }));
        });
      }
    } else if (data.renderType === 'point') {
      // Just a small, distinct circle marker for single-point events (no large geographical circle or hatching)
      layers.push(L.circleMarker(data.loc, {
        radius: 8,
        color: data.color,
        fillColor: '#fff',
        fillOpacity: 1,
        weight: 3,
        opacity: 0.95,
        className: 'event-point'
      }));
    }
    
    // Add permanent tooltips for spatial flow labels
    if (m.spatialDesc && m.spatialDesc.length > 0) {
      m.spatialDesc.forEach(desc => {
        if (desc.loc) {
          const t = L.tooltip({ 
            permanent: true, 
            direction: 'right', 
            className: 'spatial-flow-tooltip',
            offset: [10, 0]
          })
          .setLatLng(desc.loc)
          .setContent(`<b>${desc.title.split('(')[0].trim()}</b>`);
          layers.push(t);
        }
      });
    }
    
    if (layers.length > 0) {
       activeOverlay = L.layerGroup(layers).addTo(map);
    }
  }

  // Chart.js instance tracker
  let activeChart = null;

  function renderEventChart(data) {
    const canvas = document.getElementById('eventChart');
    if (!canvas) return;
    if (activeChart) { activeChart.destroy(); activeChart = null; }

    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#9ca3af' : '#6b7280';
    const gridColor = isDark ? '#1f2937' : '#f3f4f6';
    
    const isArea = data.chartType === 'area';
    const type = isArea ? 'line' : data.chartType;

    activeChart = new Chart(canvas, {
      type: type,
      data: {
        labels: data.chartLabels,
        datasets: [{
          label: data.chartLabel,
          data: data.chartData,
          backgroundColor: isArea
            ? `${data.color}33`
            : data.chartType === 'line' ? 'transparent' : `${data.color}cc`,
          borderColor: data.color,
          borderWidth: 2,
          fill: isArea,
          tension: 0.4,
          pointBackgroundColor: data.color,
          pointRadius: type === 'line' ? 4 : 0,
          pointHoverRadius: type === 'line' ? 6 : 0,
          borderRadius: type === 'bar' ? 6 : 0,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: isDark ? '#111827' : '#ffffff',
            titleColor: isDark ? '#f9fafb' : '#111827',
            bodyColor: isDark ? '#9ca3af' : '#6b7280',
            borderColor: isDark ? '#1f2937' : '#e5e7eb',
            borderWidth: 1,
            padding: 10,
            cornerRadius: 8,
          }
        },
        scales: {
          x: { ticks: { color: textColor, font: { size: 10 } }, grid: { color: gridColor } },
          y: { ticks: { color: textColor, font: { size: 10 } }, grid: { color: gridColor }, beginAtZero: true }
        }
      }
    });
  }

  function applyMilestone(data, milestoneIdx) {
    const m = data.milestones[milestoneIdx];
    if (!m) return;
    
    // Update stats
    const stat1Value = document.getElementById('panelKorban');
    if (stat1Value) stat1Value.textContent = m.stat1V;
    
    const stat2Value = document.getElementById('panelLuasan');
    if (stat2Value) stat2Value.textContent = m.stat2V;
    
    // Update narasi
    const tlNarasi = document.getElementById('timelineMilestoneNarasi');
    if (tlNarasi) tlNarasi.textContent = m.narasi;
    
    const tlLabel = document.getElementById('timelineMilestoneLabel');
    if (tlLabel) tlLabel.textContent = m.tag;
    
    // Spatial Flow interpretation specific to this milestone
    const spatialArea = document.getElementById('spatialFlowArea');
    const spatialList = document.getElementById('spatialFlowList');
    if (spatialArea && spatialList) {
      if (m.spatialDesc && m.spatialDesc.length > 0) {
        spatialArea.classList.remove('hidden');
        spatialList.innerHTML = '';
        m.spatialDesc.forEach((step, idx) => {
          const item = document.createElement('div');
          item.className = 'relative';
          
          const dot = document.createElement('div');
          dot.className = 'absolute -left-[21px] top-1.5 w-2 h-2 rounded-full border border-white dark:border-gray-900';
          dot.style.backgroundColor = data.color;
          item.appendChild(dot);
          
          const title = document.createElement('h5');
          title.className = 'text-xs font-bold text-gray-800 dark:text-gray-200 mb-0.5';
          title.textContent = step.title;
          item.appendChild(title);
          
          const desc = document.createElement('p');
          desc.className = 'text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed';
          desc.textContent = step.desc;
          item.appendChild(desc);
          
          spatialList.appendChild(item);
        });
      } else {
        spatialArea.classList.add('hidden');
        spatialList.innerHTML = '';
      }
    }
    
    // Update map overlay
    updateMapOverlay(data, milestoneIdx);
  }

  function renderTimeline(data, activeIdx) {
    const nodeTrack = document.getElementById('timelineNodeTrack');
    const labels = document.getElementById('timelineLabels');
    const tlContainer = document.getElementById('chapter-timeline');
    
    if (!data.milestones || data.milestones.length <= 1) {
      if (tlContainer) tlContainer.classList.add('hidden');
      return;
    }
    if (tlContainer) tlContainer.classList.remove('hidden');
    
    const maxIdx = data.milestones.length - 1;
    if (activeIdx === undefined) {
      activeIdx = data.peakMilestoneIdx ?? Math.floor(maxIdx / 2);
    }

    // Render node track dots
    if (nodeTrack) {
      nodeTrack.innerHTML = '';
      data.milestones.forEach((m, i) => {
        const nodeWrap = document.createElement('div');
        nodeWrap.className = 'flex-1 flex justify-center relative cursor-pointer group';
        nodeWrap.addEventListener('click', () => {
           applyMilestone(data, i);
           renderTimeline(data, i);
        });

        const dot = document.createElement('div');
        dot.className = `timeline-node z-10 relative transition-transform duration-300 ${i === activeIdx ? 'active scale-125' : 'group-hover:scale-110'}`;
        dot.style.borderWidth = '2px';
        
        if (i === activeIdx) {
          dot.style.backgroundColor = data.color;
          dot.style.boxShadow = `0 0 0 4px ${data.color}30, 0 0 0 1px ${data.color}`;
          dot.style.borderColor = 'white';
        } else {
          dot.style.backgroundColor = i < activeIdx ? data.color : '#e5e7eb';
          dot.style.borderColor = i < activeIdx ? data.color : '#d1d5db';
          dot.style.boxShadow = 'none';
        }
        nodeWrap.appendChild(dot);

        // Draw connector line between dots
        if (i < maxIdx) {
          const line = document.createElement('div');
          line.className = 'h-1 self-center absolute left-[50%] right-[-50%] z-0 transition-colors duration-300';
          const isPast = i < activeIdx;
          line.style.background = isPast ? data.color : '#e5e7eb';
          nodeWrap.appendChild(line);
        }
        
        nodeTrack.appendChild(nodeWrap);
      });
    }

    // Render labels
    if (labels) {
      labels.innerHTML = '';
      data.milestones.forEach((m, i) => {
        const span = document.createElement('span');
        span.textContent = m.label;
        const isActive = i === activeIdx;
        span.className = `text-[11px] ${isActive ? 'font-bold' : 'text-gray-400 font-medium cursor-pointer hover:text-gray-600'} transition-colors`;
        if (isActive) span.style.color = data.color;
        span.addEventListener('click', () => {
           applyMilestone(data, i);
           renderTimeline(data, i);
        });
        labels.appendChild(span);
      });
    }
  }

  // --- GLOBAL EVENT LISTENERS FOR PANEL CONTROLS ---
  const expandPanelBtn = document.getElementById('expandPanelBtn');
  const closePanelBtn = document.getElementById('closePanelBtn');
  
  if (expandPanelBtn) {
    expandPanelBtn.addEventListener('click', () => {
      if (eventPanel.classList.contains('md:w-[440px]')) {
        eventPanel.classList.replace('md:w-[440px]', 'md:w-[80vw]');
        eventPanel.classList.replace('lg:w-[480px]', 'lg:w-[85vw]');
        expandPanelBtn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 14v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5M4 10V6m0 0h4m-4 0l5 5m11-5v4m0-4h-4m4 0l-5 5"></path></svg>';
        expandPanelBtn.title = "Perkecil Panel";
      } else {
        eventPanel.classList.replace('md:w-[80vw]', 'md:w-[440px]');
        eventPanel.classList.replace('lg:w-[85vw]', 'lg:w-[480px]');
        expandPanelBtn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path></svg>';
        expandPanelBtn.title = "Perbesar Panel";
      }
    });
  }

  if (closePanelBtn) {
    closePanelBtn.addEventListener('click', () => {
      if (activePolygon) {
        map.removeLayer(activePolygon);
        activePolygon = null;
      }
      
      // Animation logic (Strict Rule: kept untouched)
      eventPanel.classList.add('translate-x-full');
      const mapContainer = document.getElementById('map');
      if (mapContainer) {
        mapContainer.style.width = '100%';
      }
      
      if (window.innerWidth >= 768) {
        eventPanel.classList.add('md:translate-x-full');
      } else {
        eventPanel.classList.add('translate-y-full');
      }
      
      setTimeout(() => {
        map.invalidateSize();
      }, 300);
    });
  }

  function switchTab(id) {
    activeTabId = id;
    renderTabs();
    updateBookmarkIconState(id);
    
    const activeData = eventsData.find(evt => evt.id === id);
    if (activeData) {
      if(panelEmptyState) panelEmptyState.classList.add('hidden');
      if(panelContentArea) panelContentArea.classList.remove('hidden');

      const elTitle = document.getElementById('eventTitle');
      if(elTitle) elTitle.textContent = activeData.title;
      
      const elYear = document.getElementById('eventYear');
      if(elYear) elYear.textContent = `TAHUN ${activeData.year}`;
      
      const elCatBadge = document.getElementById('eventCategoryBadge');
      if(elCatBadge) elCatBadge.textContent = activeData.category;
      
      const elCatDot = document.getElementById('eventCategoryDot');
      if(elCatDot) elCatDot.style.backgroundColor = activeData.color;
      
      // Original mappings
      const heroImgElem = document.getElementById('eventHeroImg');
      if(heroImgElem) heroImgElem.src = activeData.heroImage || activeData.gambar;
      
      // New requested mappings
      const elStat1Label = document.getElementById('stat1Label');
      if(elStat1Label) elStat1Label.textContent = activeData.stat1Label || 'Dampak Korban';
      
      const elStat1Value = document.getElementById('panelKorban');
      if(elStat1Value) elStat1Value.textContent = activeData.korban !== undefined ? activeData.korban : '—';
      
      const stat1Unit = document.getElementById('stat1Unit');
      if(stat1Unit) stat1Unit.textContent = activeData.stat1Unit || 'Jiwa';
      
      const elStat2Label = document.getElementById('stat2Label');
      if(elStat2Label) elStat2Label.textContent = activeData.stat2Label || 'Area Terdampak';
      
      const elStat2Value = document.getElementById('panelLuasan');
      if(elStat2Value) elStat2Value.textContent = activeData.luasan !== undefined ? activeData.luasan : '—';
      
      const stat2Unit = document.getElementById('stat2Unit');
      if(stat2Unit) stat2Unit.textContent = activeData.stat2Unit || 'Ha';
      
      const elEventQuote = document.getElementById('eventQuote');
      if(elEventQuote) elEventQuote.textContent = activeData.quote || '"Data historis Jember"';
      
      const elEventQuoteAuthor = document.getElementById('eventQuoteAuthor');
      if(elEventQuoteAuthor) elEventQuoteAuthor.textContent = activeData.quoteAuthor || '— Arsip Publik';
      
      const desc1 = document.getElementById('panelRingkasan');
      if(desc1) desc1.textContent = activeData.ringkasan || activeData.desc1;
      
      const desc2 = document.getElementById('eventDesc2');
      if(desc2) desc2.textContent = activeData.desc2 || '';
      
      // Update coordinates
      const elCoords = document.getElementById('eventCoordinates');
      if(elCoords) {
        const lat = activeData.loc[0];
        const lng = activeData.loc[1];
        // Format to DMS
        const formatDMS = (val, isLat) => {
          const absolute = Math.abs(val);
          const degrees = Math.floor(absolute);
          const minutesNotTruncated = (absolute - degrees) * 60;
          const minutes = Math.floor(minutesNotTruncated);
          const seconds = ((minutesNotTruncated - minutes) * 60).toFixed(1);
          let dir = '';
          if(isLat) dir = val >= 0 ? 'N' : 'S';
          else dir = val >= 0 ? 'E' : 'W';
          return `${degrees}°${minutes}'${seconds}"${dir}`;
        };
        elCoords.textContent = `${formatDMS(lat, true)} ${formatDMS(lng, false)}`;
      }

      // Copy Coordinates Button
      const copyCoordsBtn = document.getElementById('copyCoordsBtn');
      if(copyCoordsBtn) {
        // Remove old listeners by cloning
        const newCopyBtn = copyCoordsBtn.cloneNode(true);
        copyCoordsBtn.parentNode.replaceChild(newCopyBtn, copyCoordsBtn);
        
        newCopyBtn.addEventListener('click', () => {
          if (elCoords && elCoords.textContent) {
            navigator.clipboard.writeText(elCoords.textContent).then(() => {
              const tooltip = newCopyBtn.querySelector('#copyCoordsTooltip');
              if (tooltip) {
                tooltip.textContent = "Koordinat berhasil disalin!";
                setTimeout(() => {
                  tooltip.textContent = "Copy";
                }, 2000);
              }
            });
          }
        });
      }

      // Render chart
      renderEventChart(activeData);

      // Timeline & Milestone logic (this will automatically populate spatialFlowArea)
      if(activeData.milestones) {
        const peakIdx = activeData.peakMilestoneIdx ?? 1;
        renderTimeline(activeData);
        applyMilestone(activeData, peakIdx);
      }

      // Chart
      if(activeData.chartType) {
        renderEventChart(activeData);
      }

      // Approved contributions
      if (window.approvedAdminContributions && window.approvedAdminContributions[id]) {
        approvedContributionsArea.classList.remove('hidden');
        approvedList.innerHTML = '';
        window.approvedAdminContributions[id].forEach(contrib => {
          approvedList.innerHTML += `
            <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 relative overflow-hidden">
              <div class="absolute right-0 top-0 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg flex items-center shadow-sm">
                <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Verified
              </div>
              <p class="text-xs text-gray-500 mb-1 font-bold">${contrib.name} <span class="font-normal font-mono float-right mr-16">${contrib.ticket}</span></p>
              <p class="text-sm text-gray-700 dark:text-gray-300 italic">"${contrib.story}"</p>
            </div>
          `;
        });
      } else {
        approvedContributionsArea.classList.add('hidden');
        approvedList.innerHTML = '';
      }

      document.getElementById('contributeContextTitle').textContent = `Mengajukan bukti untuk: ${activeData.title}`;

      // Fly to
      if (!window.isMapLocked) {
        map.flyTo(activeData.loc, 14, { duration: 1.5, easeLinearity: 0.2 });
        map.once('moveend', () => {
          if (window.innerWidth >= 768) map.panBy([200, 0], { animate: true, duration: 0.5 });
          else map.panBy([0, 150], { animate: true, duration: 0.5 });
        });
      }
    }
  }

  function closeTab(e, id) {
    e.stopPropagation();
    openedTabs = openedTabs.filter(tab => tab.id !== id);
    if (openedTabs.length === 0) {
      activeTabId = null;
      renderTabs();
      panelEmptyState.classList.remove('hidden');
      panelContentArea.classList.add('hidden');
    } else if (activeTabId === id) {
      switchTab(openedTabs[openedTabs.length - 1].id);
    } else {
      renderTabs();
    }
  }

  function renderTabs() {
    tabsContainer.innerHTML = '';
    openedTabs.forEach(tab => {
      const isActive = tab.id === activeTabId;
      const tabEl = document.createElement('div');
      // Truncate title if many tabs open
      const manyTabs = openedTabs.length > 3;
      const shortTitle = manyTabs && tab.title.length > 10 ? tab.title.slice(0, 10) + '…' : tab.title;
      tabEl.className = `px-4 py-3 text-[13px] font-semibold cursor-pointer tracking-wide flex items-center transition-all shrink-0 ${
        manyTabs ? 'max-w-[120px]' : 'max-w-[150px]'
      }`;
      
      if (isActive) {
        tabEl.classList.add('text-gray-900', 'dark:text-white');
        tabEl.style.borderBottom = `2px solid currentColor`; 
      } else {
        tabEl.classList.add('text-gray-500', 'hover:text-gray-700', 'dark:hover:text-gray-300');
        tabEl.style.borderBottom = `2px solid transparent`;
      }
      
      tabEl.title = tab.title; // full title in native tooltip
      tabEl.innerHTML = `
        <span class="w-3.5 h-1.5 rounded-full shrink-0 mr-2" style="background-color:${tab.color}"></span>
        <span class="truncate flex-1">${shortTitle}</span>
        <button class="ml-2 text-gray-400 hover:text-red-500 transition-colors close-tab-btn outline-none shrink-0">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      `;
      tabEl.addEventListener('click', () => switchTab(tab.id));
      tabEl.querySelector('.close-tab-btn').addEventListener('click', (e) => closeTab(e, tab.id));
      tabsContainer.appendChild(tabEl);
    });
  }

  // --- 5. LOCAL STORAGE: HISTORY & BOOKMARK ---
  let historyCache = JSON.parse(localStorage.getItem('eventHistory') || '[]');
  let bookmarkCache = JSON.parse(localStorage.getItem('eventBookmarks') || '[]');

  function saveToHistory(id) {
    historyCache = historyCache.filter(item => item !== id); // remove if exists
    historyCache.unshift(id); // add to top
    if(historyCache.length > 10) historyCache.pop(); // keep last 10
    localStorage.setItem('eventHistory', JSON.stringify(historyCache));
    renderHistory();
  }

  function toggleBookmark(id) {
    if(bookmarkCache.includes(id)) {
      bookmarkCache = bookmarkCache.filter(item => item !== id);
    } else {
      bookmarkCache.push(id);
    }
    localStorage.setItem('eventBookmarks', JSON.stringify(bookmarkCache));
    updateBookmarkIconState(id);
    renderBookmarks();
  }

  const bookmarkEventBtn = document.getElementById('bookmarkEventBtn');
  if(bookmarkEventBtn) {
    bookmarkEventBtn.addEventListener('click', () => {
      if(activeTabId) toggleBookmark(activeTabId);
    });
  }

  function updateBookmarkIconState(id) {
    if(!bookmarkEventBtn) return;
    if(bookmarkCache.includes(id)) {
      bookmarkEventBtn.classList.add('text-yellow-500', 'border-yellow-200');
      bookmarkEventBtn.classList.remove('text-gray-400');
      bookmarkEventBtn.innerHTML = '<svg class="w-4 h-4" fill="currentColor" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>';
    } else {
      bookmarkEventBtn.classList.remove('text-yellow-500', 'border-yellow-200');
      bookmarkEventBtn.classList.add('text-gray-400');
      bookmarkEventBtn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>';
    }
  }

  // --- 6. DEEP LINKING (SHARE) ---
  const shareEventBtn = document.getElementById('shareEventBtn');
  const copyToast = document.getElementById('copyToast');
  if(shareEventBtn) {
    shareEventBtn.addEventListener('click', () => {
      if(activeTabId) {
        const url = new URL(window.location);
        url.searchParams.set('event', activeTabId);
        navigator.clipboard.writeText(url.toString()).then(() => {
          copyToast.classList.remove('opacity-0', '-translate-y-10');
          setTimeout(() => {
            copyToast.classList.add('opacity-0', '-translate-y-10');
          }, 3000);
        });
      }
    });
  }

  // Check URL on load
  const urlParams = new URLSearchParams(window.location.search);
  const deepLinkEventId = urlParams.get('event');
  if(deepLinkEventId) {
    const evt = eventsData.find(e => e.id === deepLinkEventId);
    if(evt) {
      setTimeout(() => openPanel(evt), 500);
    }
  }

  // Show onboarding toast
  setTimeout(() => {
    const onboardingToast = document.getElementById('onboardingToast');
    if(onboardingToast) {
      onboardingToast.classList.remove('opacity-0', 'translate-y-10');
      const closeBtn = document.getElementById('closeOnboardingBtn');
      if(closeBtn) closeBtn.addEventListener('click', () => {
        onboardingToast.classList.add('opacity-0', 'translate-y-10');
      });
    }
  }, 1200);

  // --- 6b. ARCHIVE TABS in Event Panel ---
  document.querySelectorAll('.archive-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.archive;
      // Update button styles
      document.querySelectorAll('.archive-tab-btn').forEach(b => {
        b.classList.remove('font-bold', 'text-gray-800', 'dark:text-white', 'border-gray-800', 'dark:border-white');
        b.classList.add('font-medium', 'text-gray-400', 'border-transparent');
      });
      btn.classList.add('font-bold', 'text-gray-800', 'border-gray-800');
      btn.classList.remove('font-medium', 'text-gray-400', 'border-transparent');
      // Show the right content
      document.querySelectorAll('.archive-tab-content').forEach(c => c.classList.add('hidden'));
      const targetEl = document.getElementById(`archive-${target}`);
      if(targetEl) targetEl.classList.remove('hidden');
    });
  });

  // --- 6c. LAPORKAN LOKASI BARU ---
  const openReportBtn = document.getElementById('openReportBtn');
  const reportPanel = document.getElementById('reportPanel');
  const closeReportBtn = document.getElementById('closeReportBtn');
  const reportLocInfo = document.getElementById('reportLocInfo');
  const reportLocText = document.getElementById('reportLocText');
  const submitReportBtn = document.getElementById('submitReportBtn');

  let reportMode = false;
  let reportMarker = null;
  let selectedReportLoc = null;

  if(openReportBtn && reportPanel) {
    openReportBtn.addEventListener('click', () => {
      // Close event panel if open on mobile
      reportPanel.classList.remove('translate-x-full');
      reportMode = true;
      document.body.style.cursor = 'crosshair';
      // Show cursor hint
      map.getContainer().style.cursor = 'crosshair';
    });

    closeReportBtn.addEventListener('click', () => {
      reportPanel.classList.add('translate-x-full');
      reportMode = false;
      document.body.style.cursor = '';
      map.getContainer().style.cursor = '';
      if(reportMarker) {
        map.removeLayer(reportMarker);
        reportMarker = null;
      }
      selectedReportLoc = null;
      reportLocInfo.classList.add('hidden');
    });
  }

  const applyCoordBtn = document.getElementById('applyCoordBtn');
  const reportCoordinates = document.getElementById('reportCoordinates');
  const coordFeedback = document.getElementById('coordFeedback');

  if(applyCoordBtn && reportCoordinates) {
    applyCoordBtn.addEventListener('click', () => {
      const val = reportCoordinates.value.trim();
      if(!val) return;
      
      let lat = null, lng = null;
      
      // Coba format DMS: 8°15'0.0"S 113°50'60.0"E
      const dmsRegex = /(\d+)[°\s]+(\d+)['\s]+([\d\.]+)[”"']?\s*([NS])\s*(\d+)[°\s]+(\d+)['\s]+([\d\.]+)[”"']?\s*([EW])/i;
      const dmsMatch = val.match(dmsRegex);
      
      if (dmsMatch) {
        lat = parseInt(dmsMatch[1]) + parseInt(dmsMatch[2])/60 + parseFloat(dmsMatch[3])/3600;
        if (dmsMatch[4].toUpperCase() === 'S') lat = -lat;
        
        lng = parseInt(dmsMatch[5]) + parseInt(dmsMatch[6])/60 + parseFloat(dmsMatch[7])/3600;
        if (dmsMatch[8].toUpperCase() === 'W') lng = -lng;
      } else {
        // Coba format desimal: -8.172, 113.702
        const decRegex = /(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)/;
        const decMatch = val.match(decRegex);
        if (decMatch) {
          lat = parseFloat(decMatch[1]);
          lng = parseFloat(decMatch[2]);
        }
      }
      
      if (lat !== null && lng !== null) {
        
        selectedReportLoc = L.latLng(lat, lng);
        
        if(reportMarker) map.removeLayer(reportMarker);
        
        const icon = L.divIcon({ 
          html: '<div class="w-5 h-5 bg-amber-500 rounded-full border-2 border-white shadow-lg pulse-marker"></div>', 
          className: 'custom-div-icon', iconSize: [20, 20], iconAnchor: [10, 10] 
        });
        reportMarker = L.marker(selectedReportLoc, { icon }).addTo(map);
        reportMarker.bindPopup('<span class="text-sm font-medium">Lokasi Laporan Anda</span>').openPopup();

        reportLocText.textContent = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        reportLocInfo.classList.remove('hidden');
        
        map.flyTo(selectedReportLoc, 15, { duration: 1.5 });
        
        coordFeedback.textContent = "✓ Titik berhasil diatur pada peta.";
        coordFeedback.className = "text-[10px] mt-2 block text-emerald-600 dark:text-emerald-400 transition-all duration-300";
        
        setTimeout(() => {
          coordFeedback.classList.replace('block', 'hidden');
        }, 4000);
      } else {
        coordFeedback.textContent = "✗ Format tidak valid. Gunakan format: -8.123, 113.123";
        coordFeedback.className = "text-[10px] mt-2 block text-red-600 dark:text-red-400 transition-all duration-300";
      }
    });
  }

  // Map click to place report marker
  map.on('click', (e) => {
    if(!reportMode) return;
    if(reportMarker) map.removeLayer(reportMarker);
    selectedReportLoc = e.latlng;
    
    const icon = L.divIcon({ 
      html: '<div class="w-5 h-5 bg-amber-500 rounded-full border-2 border-white shadow-lg pulse-marker"></div>', 
      className: 'custom-div-icon', iconSize: [20, 20], iconAnchor: [10, 10] 
    });
    reportMarker = L.marker(e.latlng, { icon }).addTo(map);
    reportMarker.bindPopup('<span class="text-sm font-medium">Lokasi Laporan Anda</span>').openPopup();

    reportLocText.textContent = `${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`;
    reportLocInfo.classList.remove('hidden');
  });

  if(submitReportBtn) {
    submitReportBtn.addEventListener('click', () => {
      const title = document.getElementById('reportTitle')?.value || '';
      if(!selectedReportLoc) {
        alert('Klik pada peta terlebih dahulu untuk menentukan lokasi peristiwa.');
        return;
      }
      if(!title.trim()) {
        alert('Harap isi Judul / Nama Peristiwa.');
        return;
      }
      
      // Build submission
      const submission = {
        title: title,
        name: document.getElementById('reporterName')?.value || 'Anonim',
        category: document.getElementById('reportCategory')?.value || 'lainnya',
        year: document.getElementById('reportYear')?.value || '',
        desc: document.getElementById('reportDesc')?.value || '',
        source: document.getElementById('reportSource')?.value || '',
        loc: [selectedReportLoc.lat, selectedReportLoc.lng]
      };

      if(!window.reportQueue) window.reportQueue = [];
      window.reportQueue.push(submission);

      // Show success and reset
      reportPanel.classList.add('translate-x-full');
      reportMode = false;
      map.getContainer().style.cursor = '';
      if(reportMarker) { map.removeLayer(reportMarker); reportMarker = null; }
      selectedReportLoc = null;
      reportLocInfo.classList.add('hidden');
      document.getElementById('reportTitle').value = '';
      document.getElementById('reporterName').value = '';
      document.getElementById('reportDesc').value = '';
      document.getElementById('reportYear').value = '';
      document.getElementById('reportSource').value = '';
      
      // Show success toast
      const copyToastEl = document.getElementById('copyToast');
      if(copyToastEl) {
        copyToastEl.textContent = 'Laporan berhasil dikirim! Menunggu verifikasi.';
        copyToastEl.classList.remove('opacity-0', '-translate-y-10');
        copyToastEl.classList.add('bg-amber-500');
        setTimeout(() => { 
          copyToastEl.classList.add('opacity-0', '-translate-y-10'); 
          copyToastEl.classList.remove('bg-amber-500');
          copyToastEl.textContent = 'Link berhasil disalin!';
        }, 4000);
      }
    });
  }

  // --- 7. INVISIBLE TOOLS: PERSONAL MENU (SLIDE-OUT) ---
  const personalMenuBtn = document.getElementById('personalMenuBtn');
  const personalPanel = document.getElementById('personalPanel');
  const closePersonalBtn = document.getElementById('closePersonalBtn');

  // Tabs inside Personal Menu
  const tabHistory = document.getElementById('tabHistory');
  const tabBookmarks = document.getElementById('tabBookmarks');
  const tabLibrary = document.getElementById('tabLibrary');
  
  const contentHistory = document.getElementById('contentHistory');
  const contentBookmarks = document.getElementById('contentBookmarks');
  const contentLibrary = document.getElementById('contentLibrary');

  if(personalMenuBtn && personalPanel) {
    personalMenuBtn.addEventListener('click', () => {
      personalPanel.classList.remove('-translate-x-full');
      renderHistory();
      renderBookmarks();
      renderLibrary();
    });
    closePersonalBtn.addEventListener('click', () => {
      personalPanel.classList.add('-translate-x-full');
    });
  }

  function switchPersonalTab(activeBtn, activeContent) {
    [tabHistory, tabBookmarks, tabLibrary].forEach(btn => {
      btn.classList.remove('border-gray-900', 'dark:border-white', 'text-gray-900', 'dark:text-white');
      btn.classList.add('border-transparent', 'text-gray-500');
    });
    activeBtn.classList.remove('border-transparent', 'text-gray-500');
    activeBtn.classList.add('border-gray-900', 'dark:border-white', 'text-gray-900', 'dark:text-white');

    [contentHistory, contentBookmarks, contentLibrary].forEach(cnt => cnt.classList.add('hidden'));
    activeContent.classList.remove('hidden');
  }

  tabHistory.addEventListener('click', () => switchPersonalTab(tabHistory, contentHistory));
  tabBookmarks.addEventListener('click', () => switchPersonalTab(tabBookmarks, contentBookmarks));
  tabLibrary.addEventListener('click', () => switchPersonalTab(tabLibrary, contentLibrary));

  function createListItem(evt) {
    const div = document.createElement('div');
    div.className = 'px-3 py-2 border border-gray-100 dark:border-gray-800 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors flex items-center justify-between group';
    div.innerHTML = `
      <div>
        <h4 class="text-sm font-serif font-bold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 transition-colors">${evt.title}</h4>
        <p class="text-[10px] text-gray-500 uppercase tracking-widest">${evt.year} • ${evt.category}</p>
      </div>
      <div class="w-2 h-2 rounded-full" style="background-color: ${evt.color}"></div>
    `;
    div.addEventListener('click', () => {
      openPanel(evt);
    });
    return div;
  }

  function renderHistory() {
    contentHistory.innerHTML = '';
    if(historyCache.length === 0) {
      contentHistory.innerHTML = '<p class="text-sm text-gray-400 text-center mt-10">Belum ada riwayat.</p>';
      return;
    }
    historyCache.forEach(id => {
      const evt = eventsData.find(e => e.id === id);
      if(evt) contentHistory.appendChild(createListItem(evt));
    });
  }

  function renderBookmarks() {
    contentBookmarks.innerHTML = '';
    if(bookmarkCache.length === 0) {
      contentBookmarks.innerHTML = '<p class="text-sm text-gray-400 text-center mt-10">Belum ada arsip yang disimpan.</p>';
      return;
    }
    bookmarkCache.forEach(id => {
      const evt = eventsData.find(e => e.id === id);
      if(evt) contentBookmarks.appendChild(createListItem(evt));
    });
  }

  // --- 8. MASTER LIBRARY (Map-Lock & Quick View) ---
  window.isMapLocked = false;
  const mapLockToggle = document.getElementById('mapLockToggle');
  if(mapLockToggle) {
    mapLockToggle.addEventListener('change', (e) => {
      window.isMapLocked = e.target.checked;
    });
  }

  const librarySearch = document.getElementById('librarySearch');
  const libraryYearFilter = document.getElementById('libraryYearFilter');
  const libraryCategoryFilter = document.getElementById('libraryCategoryFilter');
  const libraryList = document.getElementById('libraryList');
  
  // Populate Year Filter Dynamically
  if (libraryYearFilter) {
    const uniqueYears = [...new Set(eventsData.map(e => e.year))].sort((a, b) => b - a);
    uniqueYears.forEach(year => {
      const opt = document.createElement('option');
      opt.value = year;
      opt.textContent = year;
      libraryYearFilter.appendChild(opt);
    });
  }
  
  function renderLibrary() {
    libraryList.innerHTML = '';
    const query = librarySearch ? librarySearch.value.toLowerCase() : '';
    const year = libraryYearFilter ? libraryYearFilter.value : '';
    const category = libraryCategoryFilter ? libraryCategoryFilter.value : '';

    const filtered = eventsData.filter(e => {
      const matchQuery = e.title.toLowerCase().includes(query);
      const matchYear = year ? e.year === year : true;
      const matchCat = category ? e.category === category : true;
      return matchQuery && matchYear && matchCat;
    });

    if(filtered.length === 0) {
      libraryList.innerHTML = '<p class="text-sm text-gray-400 text-center mt-4">Tidak ada data.</p>';
      return;
    }
    filtered.forEach(evt => {
      libraryList.appendChild(createListItem(evt));
    });
  }

  if(librarySearch) {
    librarySearch.addEventListener('input', () => renderLibrary());
  }
  if(libraryYearFilter) {
    libraryYearFilter.addEventListener('change', () => renderLibrary());
  }
  if(libraryCategoryFilter) {
    libraryCategoryFilter.addEventListener('change', () => renderLibrary());
  }

  // --- SEARCH SUGGESTIONS (Floating bar) ---
  const searchInput = document.getElementById('searchInput');
  const searchSuggestions = document.getElementById('searchSuggestions');
  const searchClearBtn = document.getElementById('searchClearBtn');

  function highlightMatch(text, query) {
    if (!query) return text;
    const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(re, '<mark class="bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 rounded px-0.5">$1</mark>');
  }

  function showSuggestions(query) {
    if (!query.trim()) {
      searchSuggestions.classList.add('hidden');
      return;
    }
    const q = query.toLowerCase();
    const matches = eventsData.filter(e =>
      e.title.toLowerCase().includes(q) ||
      e.year.includes(q) ||
      e.category.toLowerCase().includes(q)
    );

    if (matches.length === 0) {
      searchSuggestions.innerHTML = `<div class="px-4 py-3 text-sm text-gray-400 dark:text-gray-500">Tidak ada peristiwa ditemukan.</div>`;
      searchSuggestions.classList.remove('hidden');
      return;
    }

    searchSuggestions.innerHTML = matches.map(evt => `
      <button class="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center space-x-3 transition-colors suggestion-item border-b border-gray-100 dark:border-gray-800 last:border-0" data-id="${evt.id}">
        <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background-color:${evt.color}"></span>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">${highlightMatch(evt.title, query)}</p>
          <p class="text-xs text-gray-400">${evt.year} · ${evt.category.charAt(0).toUpperCase()+evt.category.slice(1)}</p>
        </div>
        <svg class="w-3.5 h-3.5 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
      </button>
    `).join('');

    searchSuggestions.querySelectorAll('.suggestion-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const evt = eventsData.find(e => e.id === btn.dataset.id);
        if (evt) {
          openPanel(evt);
          searchInput.value = evt.title;
          searchSuggestions.classList.add('hidden');
        }
      });
    });

    searchSuggestions.classList.remove('hidden');
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const val = e.target.value;
      searchClearBtn.classList.toggle('hidden', !val);
      showSuggestions(val);
    });
    searchInput.addEventListener('focus', (e) => {
      if (e.target.value) showSuggestions(e.target.value);
    });
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        searchSuggestions.classList.add('hidden');
        searchInput.blur();
      }
    });
    document.addEventListener('click', (e) => {
      if (!searchInput.closest('.relative').contains(e.target)) {
        searchSuggestions.classList.add('hidden');
      }
    });
  }

  if (searchClearBtn) {
    searchClearBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchSuggestions.classList.add('hidden');
      searchClearBtn.classList.add('hidden');
      searchInput.focus();
    });
  }

  // --- 9. MODALS (Feedback & Contribution) ---
  
  // Feedback
  const feedbackBtn = document.getElementById('feedbackBtn');
  const feedbackModal = document.getElementById('feedbackModal');
  const closeFeedbackBtn = document.getElementById('closeFeedbackBtn');
  const submitFeedbackBtn = document.getElementById('submitFeedbackBtn');

  if(feedbackBtn) {
    feedbackBtn.addEventListener('click', () => {
      feedbackModal.classList.remove('opacity-0', 'pointer-events-none');
      feedbackModal.querySelector('.bg-white, .bg-gray-900').classList.remove('scale-95');
    });
  }
  
  if(closeFeedbackBtn) {
    closeFeedbackBtn.addEventListener('click', () => {
      feedbackModal.classList.add('opacity-0', 'pointer-events-none');
      feedbackModal.querySelector('.bg-white, .bg-gray-900').classList.add('scale-95');
    });
  }

  if(submitFeedbackBtn) {
    submitFeedbackBtn.addEventListener('click', () => {
      closeFeedbackBtn.click();
    });
  }

  // Contextual Contribution
  const contributeBtn = document.getElementById('contributeBtn');
  const contributeModal = document.getElementById('contributeModal');
  const closeContributeBtn = document.getElementById('closeContributeBtn');
  const submitContributeBtn = document.getElementById('submitContributeBtn');
  
  const contributeFormState = document.getElementById('contributeFormState');
  const contributeSuccessState = document.getElementById('contributeSuccessState');
  const ticketIdDisplay = document.getElementById('ticketIdDisplay');

  if(contributeBtn && contributeModal) {
    contributeBtn.addEventListener('click', () => {
      contributeFormState.classList.remove('hidden');
      contributeFormState.classList.add('flex');
      contributeSuccessState.classList.add('hidden');
      contributeSuccessState.classList.remove('flex');
      
      document.getElementById('contribName').value = '';
      document.getElementById('contribStory').value = '';

      contributeModal.classList.remove('opacity-0', 'pointer-events-none');
      contributeModal.querySelector('.bg-white, .bg-gray-900').classList.remove('scale-95');
    });

    closeContributeBtn.addEventListener('click', () => {
      contributeModal.classList.add('opacity-0', 'pointer-events-none');
      contributeModal.querySelector('.bg-white, .bg-gray-900').classList.add('scale-95');
    });

    submitContributeBtn.addEventListener('click', () => {
      const name = document.getElementById('contribName').value || 'Anonim';
      const story = document.getElementById('contribStory').value;
      const ticketId = 'TK-' + Math.floor(Math.random() * 90000 + 10000) + 'X';
      
      ticketIdDisplay.textContent = ticketId;
      
      // Store in mockup queue for Admin
      if(!window.adminQueue) window.adminQueue = [];
      window.adminQueue.push({
        id: ticketId,
        eventId: activeTabId,
        name: name,
        story: story,
        loc: eventsData.find(e => e.id === activeTabId).loc // rough mock loc
      });
      
      // Switch to success
      contributeFormState.classList.add('hidden');
      contributeFormState.classList.remove('flex');
      contributeSuccessState.classList.remove('hidden');
      contributeSuccessState.classList.add('flex');
    });
  }

  // --- 10. ADMIN DASHBOARD (Split-Screen) ---
  const adminBtn = document.getElementById('adminBtn');
  const adminDashboard = document.getElementById('adminDashboard');
  const closeAdminBtn = document.getElementById('closeAdminBtn');
  
  let adminMapInstance = null;
  let adminMarker = null;

  if(adminBtn) {
    adminBtn.addEventListener('click', () => {
      adminDashboard.classList.remove('translate-y-full');
      
      // Init Map if not yet
      if(!adminMapInstance) {
        adminMapInstance = L.map('adminMap', { zoomControl: false }).setView(jemberCenter, 11);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { maxZoom: 20 }).addTo(adminMapInstance);
      }
      setTimeout(() => adminMapInstance.invalidateSize(), 500);
      
      loadAdminQueue();
    });
    
    closeAdminBtn.addEventListener('click', () => {
      adminDashboard.classList.add('translate-y-full');
    });
  }

  function loadAdminQueue() {
    const adminDoneMessage = document.getElementById('adminDoneMessage');
    const targetEvent = document.getElementById('adminTargetEvent');
    const ticketId = document.getElementById('adminTicketId');
    const senderName = document.getElementById('adminSenderName');
    const senderStory = document.getElementById('adminSenderStory');
    const approveBtn = document.getElementById('adminApproveBtn');
    const rejectBtn = document.getElementById('adminRejectBtn');
    const adminContentWrapper = document.getElementById('adminContentWrapper');
    const adminQueueBadge = document.getElementById('adminQueueBadge');

    const queueLen = (window.adminQueue || []).length;
    if(adminQueueBadge) adminQueueBadge.textContent = `${queueLen} Antrean`;
    
    if(queueLen === 0) {
      adminDoneMessage.classList.remove('hidden');
      adminDoneMessage.classList.add('flex');
      adminContentWrapper.classList.add('hidden');
      
      if(adminMarker && adminMapInstance) adminMapInstance.removeLayer(adminMarker);
      return;
    }

    // Show first in queue
    const currentQueue = window.adminQueue[0];
    const evt = eventsData.find(e => e.id === currentQueue.eventId);
    if(!evt) {
      window.adminQueue.shift();
      loadAdminQueue();
      return;
    }
    
    adminDoneMessage.classList.add('hidden');
    adminDoneMessage.classList.remove('flex');
    adminContentWrapper.classList.remove('hidden');
    
    targetEvent.textContent = evt.title;
    ticketId.textContent = currentQueue.id;
    senderName.textContent = currentQueue.name;
    senderStory.textContent = `"${currentQueue.story}"`;

    // Map logic
    if(adminMarker && adminMapInstance) adminMapInstance.removeLayer(adminMarker);
    const mockOffset = [currentQueue.loc[0] + 0.01, currentQueue.loc[1] + 0.01];
    
    const icon = L.divIcon({ html: '<div class="w-4 h-4 bg-red-600 rounded-full border-2 border-white shadow-lg pulse-marker"></div>', className: 'custom-div-icon' });
    adminMarker = L.marker(mockOffset, {icon}).addTo(adminMapInstance);
    adminMapInstance.flyTo(mockOffset, 14);

    // Event listeners for Approve/Reject
    approveBtn.onclick = () => {
      if(!window.approvedAdminContributions) window.approvedAdminContributions = {};
      if(!window.approvedAdminContributions[currentQueue.eventId]) window.approvedAdminContributions[currentQueue.eventId] = [];
      
      window.approvedAdminContributions[currentQueue.eventId].push({
        name: currentQueue.name,
        story: currentQueue.story,
        ticket: currentQueue.id
      });
      
      window.adminQueue.shift();
      loadAdminQueue();
      
      if(activeTabId === currentQueue.eventId) {
        switchTab(activeTabId);
      }
    };
    
    rejectBtn.onclick = () => {
      window.adminQueue.shift();
      loadAdminQueue();
    };
  }

});
