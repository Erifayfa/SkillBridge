// --- EFEK SUARA INTERAKTIF KALEM & CERIA (KOMPATIBEL HP ANDROID & IOS) ---
let suaraAktif = localStorage.getItem("skillbridge_suara") !== "mati";
let audioCtx = null;
let audioSudahDibuka = false;

function inisialisasiAudio() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtx) {
        audioCtx = new AudioContextClass();
    }

    if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
    }

    // Trik khusus browser HP (Android & iOS) untuk membuka kunci audio pada sentuhan pertama
    if (!audioSudahDibuka && audioCtx) {
        try {
            const buffer = audioCtx.createBuffer(1, 1, 22050);
            const source = audioCtx.createBufferSource();
            source.buffer = buffer;
            source.connect(audioCtx.destination);
            source.start(0);
            audioSudahDibuka = true;
        } catch (e) {}
    }
}

// Buka kunci audio otomatis pada sentuhan/klik pertama di layar HP
['touchstart', 'pointerdown', 'click'].forEach(eventName => {
    document.addEventListener(eventName, inisialisasiAudio, { once: true, passive: true });
});

function bunyikanSuara(jenis) {
    if (!suaraAktif) return;
    try {
        inisialisasiAudio();
        if (!audioCtx) return;

        const jalankanNada = () => {
            const sekarang = audioCtx.currentTime;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            
            osc.connect(gain);
            gain.connect(audioCtx.destination);

            if (jenis === 'klik') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(520, sekarang);
                osc.frequency.exponentialRampToValueAtTime(840, sekarang + 0.065);
                gain.gain.setValueAtTime(0.12, sekarang);
                gain.gain.exponentialRampToValueAtTime(0.001, sekarang + 0.065);
                osc.start(sekarang);
                osc.stop(sekarang + 0.065);
            } else if (jenis === 'benar') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(523.25, sekarang);
                osc.frequency.setValueAtTime(659.25, sekarang + 0.09);
                osc.frequency.setValueAtTime(783.99, sekarang + 0.18);
                gain.gain.setValueAtTime(0.16, sekarang);
                gain.gain.exponentialRampToValueAtTime(0.001, sekarang + 0.38);
                osc.start(sekarang);
                osc.stop(sekarang + 0.38);
            } else if (jenis === 'salah') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(240, sekarang);
                osc.frequency.linearRampToValueAtTime(185, sekarang + 0.25);
                gain.gain.setValueAtTime(0.15, sekarang);
                gain.gain.exponentialRampToValueAtTime(0.001, sekarang + 0.28);
                osc.start(sekarang);
                osc.stop(sekarang + 0.28);
            } else if (jenis === 'pengingat') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(659.25, sekarang);
                osc.frequency.setValueAtTime(987.77, sekarang + 0.11);
                gain.gain.setValueAtTime(0.14, sekarang);
                gain.gain.exponentialRampToValueAtTime(0.001, sekarang + 0.35);
                osc.start(sekarang);
                osc.stop(sekarang + 0.35);
            }
        };

        // Jika HP baru membangunkan AudioContext, tunggu resume() selesai baru bunyikan nada
        if (audioCtx.state === 'suspended') {
            audioCtx.resume().then(jalankanNada).catch(() => {});
        } else {
            jalankanNada();
        }
    } catch (e) {}
}

function toggleSuara() {
    suaraAktif = !suaraAktif;
    localStorage.setItem("skillbridge_suara", suaraAktif ? "aktif" : "mati");
    let btn = document.getElementById("tombol-suara");
    if (btn) btn.innerText = suaraAktif ? "Efek Suara: Aktif 🔊" : "Efek Suara: Nonaktif 🔇";
    if (suaraAktif) bunyikanSuara('klik');
}

document.addEventListener("click", function(e) {
    if (e.target.closest("button") || e.target.closest(".menu-item") || e.target.closest(".card-bidang") || e.target.closest(".card-kursus")) {
        if (!e.target.closest("#wadah-opsi-kuis") && !e.target.closest("#btn-selesai-materi") && !e.target.closest("#btn-konfirmasi-ya")) {
            bunyikanSuara('klik');
        }
    }
});

window.addEventListener("DOMContentLoaded", () => {
    let btnSuara = document.getElementById("tombol-suara");
    if (btnSuara) {
        btnSuara.innerText = suaraAktif ? "Efek Suara: Aktif 🔊" : "Efek Suara: Nonaktif 🔇";
    }
});


// --- 0. SISTEM LOGIN & PENYIMPANAN BERBASIS AKUN ---
let akunAktif = localStorage.getItem("skillbridge_current_user");

function kunciAkun(namaData) {
    return `sb_${akunAktif}_${namaData}`;
}

function cekStatusLogin() {
    if (!akunAktif) {
        document.getElementById("layar-login").style.display = "flex";
    } else {
        document.getElementById("layar-login").style.display = "none";
        let elAkun = document.getElementById("label-akun-aktif");
        if (elAkun) elAkun.innerText = akunAktif;
    }
}

function prosesLogin() {
    let username = document.getElementById("input-login-username").value.trim().toLowerCase();
    let pin = document.getElementById("input-login-pin").value.trim();
    let pesanError = document.getElementById("pesan-error-login");

    if (username.length < 3 || pin.length !== 4 || isNaN(pin)) {
        pesanError.innerText = "Username minimal 3 huruf dan PIN harus 4 angka!";
        pesanError.style.display = "block";
        return;
    }

    let daftarAkun = JSON.parse(localStorage.getItem("skillbridge_accounts")) || {};

    if (daftarAkun[username]) {
        if (daftarAkun[username] !== pin) {
            pesanError.innerText = "PIN salah untuk username tersebut!";
            pesanError.style.display = "block";
            return;
        }
    } else {
        daftarAkun[username] = pin;
        localStorage.setItem("skillbridge_accounts", JSON.stringify(daftarAkun));
    }

    localStorage.setItem("skillbridge_current_user", username);
    location.reload();
}

document.getElementById("input-login-username").addEventListener("keydown", function(e) {
    if (e.key === "Enter") {
        e.preventDefault();
        if (this.value.trim() !== "") {
            document.getElementById("input-login-pin").focus();
        }
    }
});

document.getElementById("input-login-pin").addEventListener("keydown", function(e) {
    if (e.key === "Enter") {
        e.preventDefault();
        let usernameTerisi = document.getElementById("input-login-username").value.trim() !== "";
        let pinTerisi = this.value.trim() !== "";
        if (usernameTerisi && pinTerisi) {
            prosesLogin();
        } else if (!usernameTerisi) {
            document.getElementById("input-login-username").focus();
        }
    }
});

function logoutAkun() {
    localStorage.removeItem("skillbridge_current_user");
    location.reload();
}

cekStatusLogin();


// --- 1. INISIALISASI DATA, KOIN, MASKOT & LEVELING ---
let poinXP = parseInt(localStorage.getItem(kunciAkun("xp"))) || 0;
let jumlahKoin = parseInt(localStorage.getItem(kunciAkun("koin"))) || 0;
let maskotAktif = localStorage.getItem(kunciAkun("maskot")) || "🌟";
let maskotDimiliki = JSON.parse(localStorage.getItem(kunciAkun("maskot_dimiliki"))) || ["🌟"];
let jumlahStreak = parseInt(localStorage.getItem(kunciAkun("streak"))) || 0;

let kursusAktif = "html";
let topikKuisAktif = "html";

let materiSelesai = JSON.parse(localStorage.getItem(kunciAkun("materi_selesai"))) || [];
let kuisSelesai = JSON.parse(localStorage.getItem(kunciAkun("kuis_selesai"))) || [];

const katalogMaskot = [
    { emoji: "🌟", nama: "Bintang Klasik", harga: 0 },
    { emoji: "🚀", nama: "Bintang Roket", harga: 20 },
    { emoji: "🪄", nama: "Bintang Penyihir", harga: 35 },
    { emoji: "🤖", nama: "Bintang Robot", harga: 50 },
    { emoji: "🦊", nama: "Rubah Cerdik", harga: 70 },
    { emoji: "🦉", nama: "Burung Hantu", harga: 90 },
    { emoji: "🐱", nama: "Kucing Koder", harga: 110 },
    { emoji: "🐼", nama: "Panda Fokus", harga: 130 },
    { emoji: "🦄", nama: "Unicorn Kreatif", harga: 160 },
    { emoji: "👑", nama: "Bintang Raja", harga: 200 }
];

function simpanStatusMateri(idKursus) {
    if (!materiSelesai.includes(idKursus)) {
        materiSelesai.push(idKursus);
        localStorage.setItem(kunciAkun("materi_selesai"), JSON.stringify(materiSelesai));
    }
}

function simpanStatusKuis(idKursus) {
    if (!kuisSelesai.includes(idKursus)) {
        kuisSelesai.push(idKursus);
        localStorage.setItem(kunciAkun("kuis_selesai"), JSON.stringify(kuisSelesai));
    }
}

function perbaruiLevel() {
    let teksStatus = "Pemula 🌱";
    if (poinXP >= 50 && poinXP < 150) teksStatus = "Menengah 🚀";
    else if (poinXP >= 150) teksStatus = "Mahir 👑";

    let elemenStatus = document.getElementById("status-level");
    if (elemenStatus) elemenStatus.innerText = teksStatus;
    let elXP = document.getElementById("tampilan-xp");
    if (elXP) elXP.innerText = poinXP + " XP";
}
perbaruiLevel();

function perbaruiTampilanKoin() {
    localStorage.setItem(kunciAkun("koin"), jumlahKoin);
    let elBeranda = document.getElementById("tampilan-koin");
    let elToko = document.getElementById("tampilan-koin-toko");
    if (elBeranda) elBeranda.innerText = `${jumlahKoin} 🪙`;
    if (elToko) elToko.innerText = `🪙 ${jumlahKoin} Koin`;
}
perbaruiTampilanKoin();

// Cek Tema Gelap
if (localStorage.getItem("skillbridge_tema") === "gelap") {
    document.body.classList.add("dark-mode");
    let btnTema = document.getElementById("tombol-tema");
    if (btnTema) btnTema.innerText = "Beralih ke Mode Terang ☀️";
}

// Cek Profil & Maskot Tersimpan
let namaTersimpan = localStorage.getItem(kunciAkun("nama")) || akunAktif;
if (namaTersimpan) {
    let inputNama = document.getElementById("input-nama-profil");
    if (inputNama) inputNama.value = namaTersimpan;
    let sapaanProfil = document.getElementById("sapaan-profil");
    if (sapaanProfil) sapaanProfil.innerText = "Halo, " + namaTersimpan + "! Selamat belajar.";
    let sapaanBeranda = document.getElementById("sapaan-beranda");
    if (sapaanBeranda) sapaanBeranda.innerText = `Halo ${namaTersimpan}, siap mengembangkan keahlianmu hari ini?`;
}

let maskotBeranda = document.getElementById("maskot-beranda");
if (maskotBeranda) maskotBeranda.innerText = maskotAktif;


// --- 2. DATABASE KURIKULUM LENGKAP (PEMULA & MENENGAH) ---
const kurikulumSkillBridge = {
    html: {
        kategori: "teknologi",
        tingkat: "Pemula",
        labelKategori: "💻 Teknologi",
        judul: "Dasar-Dasar HTML",
        deskripsi: "Bangun kerangka dasar website dari nol menggunakan tag HTML.",
        tujuan: ["Memahami fungsi tag pembuka dan penutup.", "Membuat judul, paragraf, dan tombol.", "Menyusun struktur dokumen web."],
        modulSingkat: "Pengenalan Tag, Elemen, dan Struktur HTML.",
        materi: {
            judulUtama: "1.1 Mengenal Struktur Dasar HTML",
            subJudul: "Tulang Punggung Website",
            teks: "HTML (HyperText Markup Language) adalah bahasa standar untuk membuat halaman web. Bayangkan HTML seperti kerangka rumah. Setiap elemen diapit oleh tanda kurung sudut, misalnya <h1> untuk judul utama dan <p> untuk paragraf.",
            labelContoh: "Contoh Kode HTML:",
            kode: `<h1>Selamat Datang</h1>\n<p>Ini adalah paragraf pertamaku.</p>\n<button>Mulai Sekarang</button>`
        },
        kuis: [
            { pertanyaan: "Apa kepanjangan dari HTML?", opsi: ["HyperText Markup Language", "High Tech Modern Language", "Hyper Tool Multi Link", "Home Text Markup"], benar: 0, penjelasan: "HTML adalah singkatan dari HyperText Markup Language." },
            { pertanyaan: "Tag mana yang digunakan untuk membuat paragraf?", opsi: ["<h1>", "<par>", "<p>", "<text>"], benar: 2, penjelasan: "Tag <p> digunakan untuk mendefinisikan sebuah paragraf teks." },
            { pertanyaan: "Tag judul mana yang ukurannya paling besar?", opsi: ["<h6>", "<head>", "<title>", "<h1>"], benar: 3, penjelasan: "<h1> adalah heading tingkat pertama dengan ukuran paling besar." }
        ]
    },
    css: {
        kategori: "teknologi",
        tingkat: "Pemula",
        labelKategori: "💻 Teknologi",
        judul: "Dasar-Dasar CSS",
        deskripsi: "Hias dan atur tata letak websitemu agar tampak modern dan responsif.",
        tujuan: ["Mengubah warna teks dan latar belakang.", "Mengatur jarak (margin & padding).", "Memahami selektor dasar CSS."],
        modulSingkat: "Selektor, Pewarnaan, dan Box Model CSS.",
        materi: {
            judulUtama: "1.1 Mewarnai Web dengan CSS",
            subJudul: "Mempercantik Tampilan",
            teks: "CSS (Cascading Style Sheets) bertugas mengatur gaya visual dari kerangka HTML. Kamu memilih elemen HTML (selektor), lalu menentukan properti seperti warna (color) dan ukuran huruf (font-size).",
            labelContoh: "Contoh Kode CSS:",
            kode: `h1 {\n  color: #8b5cf6;\n  font-size: 32px;\n}\n\nbutton {\n  background-color: purple;\n  color: white;\n}`
        },
        kuis: [
            { pertanyaan: "Apa fungsi utama CSS dalam pembuatan web?", opsi: ["Menyimpan database", "Mengatur gaya visual dan tata letak", "Membuat logika matematika", "Menghubungkan ke server"], benar: 1, penjelasan: "CSS mengatur warna, font, dan posisi elemen HTML." },
            { pertanyaan: "Properti CSS untuk mengubah warna teks adalah?", opsi: ["bg-color", "text-style", "color", "font-color"], benar: 2, penjelasan: "Properti 'color' digunakan untuk mengatur warna tulisan." }
        ]
    },
    js: {
        kategori: "teknologi",
        tingkat: "Pemula",
        labelKategori: "💻 Teknologi",
        judul: "Dasar-Dasar JavaScript",
        deskripsi: "Buat websitemu interaktif, cerdas, dan merespons klik pengguna.",
        tujuan: ["Memahami cara kerja Variabel.", "Membuat Fungsi (Function) sederhana.", "Menampilkan pesan interaktif ke layar."],
        modulSingkat: "Variabel, Fungsi, dan Interaksi Dasar.",
        materi: {
            judulUtama: "1.1 Menghidupkan Web dengan JavaScript",
            subJudul: "Otak dari Website",
            teks: "JavaScript memungkinkan halaman web berinteraksi dengan pengguna. Misalnya mengecek jawaban kuis, menghitung poin XP, atau mengubah tema terang menjadi gelap saat tombol ditekan.",
            labelContoh: "Contoh Kode JavaScript:",
            kode: `let poin = 10;\n\nfunction tambahPoin() {\n  poin = poin + 10;\n  alert("Poin sekarang: " + poin);\n}`
        },
        kuis: [
            { pertanyaan: "Kata kunci untuk membuat variabel di JavaScript modern adalah?", opsi: ["var / let", "int", "string", "make"], benar: 0, penjelasan: "Kata kunci 'let' atau 'const' digunakan untuk mendeklarasikan variabel di JS." },
            { pertanyaan: "Perintah JS untuk memunculkan kotak pesan pop-up bawaan browser adalah?", opsi: ["popup()", "msg()", "alert()", "print()"], benar: 2, penjelasan: "Fungsi alert() menampilkan kotak dialog peringatan di browser." }
        ]
    },
    js_menengah: {
        kategori: "teknologi",
        tingkat: "Menengah",
        labelKategori: "💻 Teknologi",
        judul: "Manipulasi DOM & LocalStorage",
        deskripsi: "Pelajari cara mengubah isi HTML secara dinamis dan menyimpan data di browser.",
        tujuan: ["Mengambil elemen HTML dengan getElementById.", "Mengubah teks dan gaya CSS lewat JS.", "Menyimpan data permanen dengan localStorage."],
        modulSingkat: "DOM Manipulation & Penyimpanan Lokal Browser.",
        materi: {
            judulUtama: "2.1 Mengendalikan Halaman dengan DOM",
            subJudul: "Document Object Model (DOM)",
            teks: "DOM adalah jembatan yang menghubungkan HTML dan JavaScript. Dengan DOM, kamu bisa mengambil elemen berdasarkan ID-nya, lalu mengubah isinya secara langsung tanpa me-refresh halaman. Ditambah localStorage, data pengguna seperti skor XP tidak akan hilang meski browser ditutup.",
            labelContoh: "Contoh Manipulasi DOM & LocalStorage:",
            kode: `// Mengubah teks elemen HTML\ndocument.getElementById("judul").innerText = "Halo!";\n\n// Menyimpan data ke memori browser\nlocalStorage.setItem("namaUser", "Erifa");\nlet nama = localStorage.getItem("namaUser");`
        },
        kuis: [
            { pertanyaan: "Metode JavaScript untuk memilih elemen HTML berdasarkan atribut id-nya adalah?", opsi: ["querySelectorAll()", "getElementById()", "getElementsByClass()", "findId()"], benar: 1, penjelasan: "document.getElementById() mengambil satu elemen spesifik sesuai ID-nya." },
            { pertanyaan: "Fungsi mana yang digunakan untuk menyimpan data ke dalam localStorage?", opsi: ["localStorage.save()", "localStorage.push()", "localStorage.setItem()", "localStorage.add()"], benar: 2, penjelasan: "setItem('kunci', 'nilai') menyimpan pasangan data ke memori browser." },
            { pertanyaan: "Apa tipe data yang disimpan oleh localStorage secara bawaan?", opsi: ["String (Teks)", "Boolean", "Array murni", "Integer"], benar: 0, penjelasan: "localStorage hanya menyimpan data dalam bentuk string, sehingga array perlu diubah dengan JSON.stringify()." }
        ]
    },
    css_menengah: {
        kategori: "teknologi",
        tingkat: "Menengah",
        labelKategori: "💻 Teknologi",
        judul: "Layout Modern: Flexbox & Responsif",
        deskripsi: "Susun tata letak kartu sejajar dan pastikan websitemu rapi di layar HP.",
        tujuan: ["Mengatur posisi elemen dengan display: flex.", "Menggunakan justify-content dan align-items.", "Membuat tampilan adaptif dengan Media Queries."],
        modulSingkat: "CSS Flexbox dan Media Queries untuk Mobile.",
        materi: {
            judulUtama: "2.1 Tata Letak Fleksibel dengan Flexbox",
            subJudul: "Mengatur Baris dan Kolom dengan Mudah",
            teks: "Flexbox memudahkan penyusunan elemen agar sejajar ke samping atau ke bawah secara otomatis. Untuk menyesuaikan tampilan di layar HP yang sempit, kita menggabungkannya dengan @media (max-width: 768px) agar kartu-kartu otomatis tersusun vertikal.",
            labelContoh: "Contoh Flexbox & Media Query:",
            kode: `.wadah-kartu {\n  display: flex;\n  justify-content: space-between;\n  gap: 20px;\n}\n\n@media (max-width: 768px) {\n  .wadah-kartu { flex-direction: column; }\n}`
        },
        kuis: [
            { pertanyaan: "Properti CSS untuk mengaktifkan mode Flexbox pada sebuah wadah adalah?", opsi: ["position: flex;", "display: flex;", "layout: flex;", "flex: active;"], benar: 1, penjelasan: "display: flex mengubah wadah menjadi flex container." },
            { pertanyaan: "Aturan CSS apa yang digunakan agar tampilan berubah saat dibuka di layar HP?", opsi: ["@screen", "@mobile", "@media", "@responsive"], benar: 2, penjelasan: "@media query mendeteksi lebar layar perangkat untuk menerapkan gaya khusus." }
        ]
    },
    uiux: {
        kategori: "desain",
        tingkat: "Pemula",
        labelKategori: "🎨 Desain",
        judul: "Dasar Desain UI/UX",
        deskripsi: "Pelajari cara merancang tampilan aplikasi yang cantik dan mudah dipakai.",
        tujuan: ["Membedakan arti UI dan UX.", "Memahami prinsip hierarki visual.", "Merancang tombol yang ramah pengguna."],
        modulSingkat: "Pengenalan User Interface & User Experience.",
        materi: {
            judulUtama: "1.1 Mengenal UI dan UX",
            subJudul: "Bentuk vs Kenyamanan",
            teks: "UI (User Interface) adalah tampilan visual yang dilihat mata seperti warna dan ikon. UX (User Experience) adalah seberapa mudah dan nyaman aplikasi tersebut digunakan. Desain yang baik bukan hanya indah, tapi juga tidak membingungkan pengguna.",
            labelContoh: "Aturan Emas Desain UI:",
            kode: `1. Kontras Teks: Pastikan tulisan terbaca jelas di atas warna latar.\n2. Ukuran Tombol: Buat tombol cukup besar agar mudah ditekan jari di HP.\n3. Konsistensi: Gunakan warna utama yang seragam di seluruh halaman.`
        },
        kuis: [
            { pertanyaan: "Apa kepanjangan dari UX?", opsi: ["User X-ray", "User Experience", "Ultra Experience", "User Extension"], benar: 1, penjelasan: "UX adalah User Experience (Pengalaman Pengguna)." },
            { pertanyaan: "Mengapa kontras warna penting dalam desain UI?", opsi: ["Agar hemat baterai", "Agar tulisan mudah dibaca", "Agar file lebih kecil", "Hanya untuk gaya"], benar: 1, penjelasan: "Kontras yang baik mencegah mata lelah dan memastikan teks terbaca jelas." }
        ]
    },
    warna: {
        kategori: "desain",
        tingkat: "Pemula",
        labelKategori: "🎨 Desain",
        judul: "Teori Warna & Tipografi",
        deskripsi: "Kuasai psikologi pemilihan warna dan kombinasi huruf yang harmonis.",
        tujuan: ["Mengenal aturan warna 60-30-10.", "Memahami makna psikologis warna.", "Memilih pasangan font yang tepat."],
        modulSingkat: "Aturan 60-30-10 dan Psikologi Warna.",
        materi: {
            judulUtama: "1.1 Rahasia Komposisi Warna",
            subJudul: "Aturan 60-30-10",
            teks: "Desainer profesional menggunakan rumus 60-30-10 agar desain tidak terlihat norak: 60% warna dominan (biasanya putih/abu-abu latar), 30% warna sekunder (kartu/sidebar), dan 10% warna aksen mencolok untuk tombol utama.",
            labelContoh: "Makna Warna Populer:",
            kode: `• Biru: Kepercayaan, teknologi, ketenangan.\n• Ungu: Kreativitas, imajinasi, modern.\n• Hijau: Pertumbuhan, keberhasilan, aman.\n• Kuning/Oranye: Energi, semangat, perhatian.`
        },
        kuis: [
            { pertanyaan: "Dalam aturan warna 60-30-10, berapa persen porsi untuk warna aksen tombol?", opsi: ["60%", "30%", "10%", "50%"], benar: 2, penjelasan: "10% digunakan untuk warna aksen agar tombol penting menonjol." },
            { pertanyaan: "Warna apa yang sering melambangkan keberhasilan atau jawaban benar?", opsi: ["Merah", "Hijau", "Abu-abu", "Hitam"], benar: 1, penjelasan: "Warna hijau secara universal diasosiasikan dengan status aman atau benar." }
        ]
    },
    uiux_menengah: {
        kategori: "desain",
        tingkat: "Menengah",
        labelKategori: "🎨 Desain",
        judul: "Wireframing & Sistem Desain",
        deskripsi: "Merancang kerangka aplikasi (Wireframe) dan komponen yang konsisten.",
        tujuan: ["Membuat sketsa tata letak sebelum coding.", "Menerapkan ruang kosong (Whitespace) secara efektif.", "Membangun komponen tombol dan kartu yang seragam."],
        modulSingkat: "Low-Fidelity Wireframe & Whitespace.",
        materi: {
            judulUtama: "2.1 Merancang Kerangka dengan Wireframe",
            subJudul: "Pentingnya Ruang Kosong (Whitespace)",
            teks: "Sebelum memberi warna pada desain, desainer membuat Wireframe (sketsa kasar tata letak kotak dan teks). Kesalahan pemula adalah memenuhi layar dengan terlalu banyak elemen. Whitespace (jarak kosong antar kartu) justru membuat desain terlihat mewah dan mudah dipindai mata.",
            labelContoh: "Checklist Audit Desain Menengah:",
            kode: `• Apakah jarak antar kartu konsisten (misal: 20px)?\n• Apakah tombol utama dan tombol sekunder mudah dibedakan?\n• Apakah pengguna langsung tahu apa yang harus diklik pertama kali?`
        },
        kuis: [
            { pertanyaan: "Apa fungsi utama dari Whitespace (ruang kosong) dalam desain antarmuka?", opsi: ["Menghemat tinta", "Memberi ruang napas visual agar konten mudah dibaca", "Mempercepat loading internet", "Mengisi bagian yang belum selesai"], benar: 1, penjelasan: "Whitespace mengurangi kepadatan visual dan meningkatkan keterbacaan." },
            { pertanyaan: "Sketsa tata letak awal tanpa warna dan gambar detail disebut?", opsi: ["Mockup", "Wireframe", "Rendering", "Vector"], benar: 1, penjelasan: "Wireframe fokus pada struktur dan penempatan elemen sebelum masuk ke visual." }
        ]
    },
    publicspeaking: {
        kategori: "komunikasi",
        tingkat: "Pemula",
        labelKategori: "💬 Komunikasi",
        judul: "Dasar Public Speaking",
        deskripsi: "Atasi rasa gugup dan sampaikan idemu dengan percaya diri di depan umum.",
        tujuan: ["Menguasai teknik pernapasan anti gugup.", "Menyusun pembukaan presentasi yang memikat.", "Menggunakan bahasa tubuh yang terbuka."],
        modulSingkat: "Mengatasi Demam Panggung & Struktur Bicara.",
        materi: {
            judulUtama: "1.1 Bicara Percaya Diri di Depan Umum",
            subJudul: "Teknik Hook & Pernapasan",
            teks: "Gugup saat berbicara di depan banyak orang adalah hal manusiawi. Kuncinya adalah 30 detik pertama (Hook). Mulailah presentasi dengan pertanyaan menarik atau fakta mengejutkan, bukan sekadar membaca teks di layar.",
            labelContoh: "Struktur Pembukaan Memikat:",
            kode: `1. Tarik napas dalam selama 4 detik sebelum mulai.\n2. Berikan senyuman dan kontak mata ke audiens.\n3. Buka dengan pertanyaan: "Pernahkah kalian membayangkan...?"`
        },
        kuis: [
            { pertanyaan: "Apa istilah untuk kalimat pembuka yang memikat perhatian audiens di awal?", opsi: ["Closing", "Hook", "Buffer", "Script"], benar: 1, penjelasan: "Hook adalah 'kail' pembuka untuk menarik perhatian pendengar sejak detik pertama." },
            { pertanyaan: "Sikap mana yang sebaiknya dihindari saat presentasi?", opsi: ["Kontak mata", "Tersenyum", "Membaca seluruh teks slide tanpa menoleh", "Menggerakkan tangan sewajarnya"], benar: 2, penjelasan: "Membaca seluruh teks membuat audiens bosan dan menurunkan kredibilitas." }
        ]
    },
    copywriting: {
        kategori: "komunikasi",
        tingkat: "Pemula",
        labelKategori: "💬 Komunikasi",
        judul: "Menulis Persuasif (Copywriting)",
        deskripsi: "Pelajari seni merangkai kata yang mampu menggerakkan pembaca.",
        tujuan: ["Memahami formula AIDA.", "Menulis judul (headline) yang menarik.", "Membuat ajakan bertindak (Call to Action)."],
        modulSingkat: "Formula AIDA untuk Tulisan Memikat.",
        materi: {
            judulUtama: "1.1 Seni Merangkai Kata dengan AIDA",
            subJudul: "Formula Klasik Copywriting",
            teks: "Copywriting adalah teknik menulis untuk mengajak pembaca melakukan sesuatu (seperti mendaftar kursus atau mencoba aplikasi). Formula paling ampuh adalah AIDA: Attention (Perhatian), Interest (Minat), Desire (Keinginan), Action (Tindakan).",
            labelContoh: "Penerapan Formula AIDA:",
            kode: `• Attention: "Ingin bisa bikin website sendiri di usia 17 tahun?"\n• Interest: "Pelajari HTML & JS dari nol tanpa ribet."\n• Desire: "Dapatkan sertifikat digital dan pamerkan portofoliomu."\n• Action: "Klik Mulai Belajar Sekarang!"`
        },
        kuis: [
            { pertanyaan: "Apa kepanjangan huruf 'A' yang terakhir dalam formula AIDA?", opsi: ["Attention", "Action", "Analysis", "Audio"], benar: 1, penjelasan: "Action adalah ajakan bertindak bagi pembaca di akhir tulisan." },
            { pertanyaan: "Bagian pertama yang berfungsi mencuri perhatian pembaca disebut?", opsi: ["Attention", "Desire", "Footer", "Link"], benar: 0, penjelasan: "Attention bertugas membuat pembaca berhenti menggulir layar dan fokus." }
        ]
    },
    komunikasi_menengah: {
        kategori: "komunikasi",
        tingkat: "Menengah",
        labelKategori: "💬 Komunikasi",
        judul: "Storytelling & Presentasi Proyek",
        deskripsi: "Kemas penjelasan teknis menjadi cerita yang mudah dipahami semua orang.",
        tujuan: ["Menyusun alur Masalah - Solusi - Dampak.", "Menjelaskan fitur proyek tanpa bahasa yang terlalu rumit.", "Menjawab pertanyaan audiens dengan terstruktur."],
        modulSingkat: "Teknik Pitching Proyek & Storytelling.",
        materi: {
            judulUtama: "2.1 Mempresentasikan Karya dengan Storytelling",
            subJudul: "Kerangka Masalah → Solusi → Dampak",
            teks: "Saat memamerkan proyek seperti aplikasi web, jangan langsung membicarakan baris kodenya. Mulailah dari MASALAH yang dialami orang, tunjukkan bagaimana karyamu menjadi SOLUSI, dan jelaskan DAMPAK positifnya. Teknik ini membuat audiens non-teknis pun langsung paham nilai karyamu.",
            labelContoh: "Contoh Pitching Skill Bridge:",
            kode: `• Masalah: "Banyak pelajar bingung mulai belajar coding dari mana."\n• Solusi: "Saya membangun Skill Bridge, platform belajar interaktif dengan kuis & XP."\n• Dampak: "Belajar terasa seperti bermain game dan progres tersimpan otomatis."`
        },
        kuis: [
            { pertanyaan: "Urutan kerangka storytelling yang paling efektif saat mempresentasikan proyek adalah?", opsi: ["Kode → Harga → Penutup", "Masalah → Solusi → Dampak", "Sejarah → Teori → Daftar Pustaka", "Salam → Demo → Tanya Jawab"], benar: 1, penjelasan: "Menjelaskan masalah terlebih dahulu membuat audiens merasa relevan dengan solusi yang kamu tawarkan." },
            { pertanyaan: "Bagaimana cara terbaik menjelaskan proyek aplikasi kepada audiens umum?", opsi: ["Membacakan seluruh kode JavaScript", "Fokus pada manfaat dan kemudahan yang dirasakan pengguna", "Menggunakan istilah teknis yang rumit", "Berbicara secepat mungkin"], benar: 1, penjelasan: "Audiens umum lebih peduli pada manfaat dan solusi dibandingkan detail teknis di balik layar." }
        ]
    }
};


// --- 3. NAVIGASI & RENDER RUANG BELAJAR ---
function pindahHalaman(idHalaman) {
    document.querySelectorAll('.halaman').forEach(h => h.style.display = 'none');
    let tujuan = document.getElementById('halaman-' + idHalaman);
    if (tujuan) tujuan.style.display = 'block';

    document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('aktif'));
    let menuAktif = document.getElementById('menu-' + idHalaman);
    if (menuAktif) menuAktif.classList.add('aktif');
}

function bukaRuangBelajar(filterDipilih) {
    pindahHalaman('ruang-belajar');
    
    document.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('aktif'));
    let btnFilter = document.getElementById('filter-' + filterDipilih);
    if (btnFilter) btnFilter.classList.add('aktif');

    let wadah = document.getElementById("wadah-daftar-kursus");
    wadah.innerHTML = "";

    for (let idKursus in kurikulumSkillBridge) {
        let item = kurikulumSkillBridge[idKursus];
        let cocok = false;
        if (filterDipilih === 'semua') cocok = true;
        else if (filterDipilih === 'menengah' && item.tingkat === 'Menengah') cocok = true;
        else if (item.kategori === filterDipilih) cocok = true;

        if (cocok) {
            let isMateriSelesai = materiSelesai.includes(idKursus);
            let kelasBadgeTingkat = item.tingkat === "Menengah" ? "badge-menengah" : "badge";
            
            let kartu = document.createElement("div");
            kartu.className = "card-kursus" + (isMateriSelesai ? " sudah-selesai" : "");
            kartu.onclick = () => bukaDetailKursus(idKursus);
            
            kartu.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 5px;">
                    <div style="display: flex; gap: 6px; align-items: center;">
                        <span class="badge">${item.labelKategori}</span>
                        <span class="${kelasBadgeTingkat}">${item.tingkat}</span>
                    </div>
                    ${isMateriSelesai ? '<span class="badge-selesai">Materi Sudah Dipelajari ✓</span>' : ''}
                </div>
                <h4>${item.judul}</h4>
                <p>${item.deskripsi}</p>
                <span style="font-size: 12px; color: var(--primary-color); font-weight: bold;">
                    ${isMateriSelesai ? 'Ulangi Materi atau Kuis →' : '1 Modul & Kuis Interaktif →'}
                </span>
            `;
            wadah.appendChild(kartu);
        }
    }
}

function bukaDetailKursus(idKursus) {
    kursusAktif = idKursus;
    let kursus = kurikulumSkillBridge[idKursus];
    if (!kursus) return;

    let isMateriSelesai = materiSelesai.includes(idKursus);

    document.getElementById("badge-kategori-detail").innerText = `${kursus.labelKategori} • ${kursus.tingkat}`;
    document.getElementById("judul-detail-kursus").innerHTML = kursus.judul + (isMateriSelesai ? ' <span class="badge-selesai" style="vertical-align: middle; margin-left: 8px;">Materi Sudah Dipelajari ✓</span>' : '');
    document.getElementById("deskripsi-detail-kursus").innerText = kursus.deskripsi;
    document.getElementById("materi-detail-kursus").innerText = kursus.modulSingkat;

    let wadahTujuan = document.getElementById("tujuan-detail-kursus");
    wadahTujuan.innerHTML = "";
    kursus.tujuan.forEach(t => {
        let li = document.createElement("li");
        li.innerText = t;
        wadahTujuan.appendChild(li);
    });

    pindahHalaman("detail-kursus");
}

function mulaiMateri() {
    let kursus = kurikulumSkillBridge[kursusAktif];
    if (!kursus) return;

    document.getElementById("materi-judul-utama").innerText = kursus.materi.judulUtama;
    document.getElementById("materi-subjudul").innerText = kursus.materi.subJudul;
    document.getElementById("materi-teks").innerText = kursus.materi.teks;
    document.getElementById("label-contoh-praktik").innerText = kursus.materi.labelContoh;
    document.getElementById("materi-kode").innerText = kursus.materi.kode;

    let isMateriSelesai = materiSelesai.includes(kursusAktif);
    let btnSelesai = document.getElementById("btn-selesai-materi");

    if (isMateriSelesai) {
        document.getElementById("bar-progres-materi").style.width = "100%";
        document.getElementById("teks-progres-materi").innerText = "100%";
        btnSelesai.classList.remove("btn-outline");
        btnSelesai.classList.add("btn-disabled");
        btnSelesai.innerText = "Sudah Dipelajari ✓";
        btnSelesai.disabled = true;
    } else {
        document.getElementById("bar-progres-materi").style.width = "0%";
        document.getElementById("teks-progres-materi").innerText = "0%";
        btnSelesai.classList.remove("btn-disabled");
        btnSelesai.classList.add("btn-outline");
        btnSelesai.innerText = "Tandai Selesai ✓";
        btnSelesai.disabled = false;
    }

    pindahHalaman("materi-belajar");
}

function tandaiSelesai() {
    document.getElementById("bar-progres-materi").style.width = "100%";
    document.getElementById("teks-progres-materi").innerText = "100%";
    let btnSelesai = document.getElementById("btn-selesai-materi");
    btnSelesai.classList.remove("btn-outline");
    btnSelesai.classList.add("btn-disabled");
    btnSelesai.innerText = "Sudah Dipelajari ✓";
    btnSelesai.disabled = true;

    bunyikanSuara('benar');
    simpanStatusMateri(kursusAktif);

    let bonusXP = kurikulumSkillBridge[kursusAktif].tingkat === "Menengah" ? 25 : 15;
    let dapatKoin = 10;
    jumlahKoin += dapatKoin;
    perbaruiTampilanKoin();
    tampilkanNotifikasi(`Materi selesai! +${bonusXP} XP & +${dapatKoin} Koin! 🪙`);

    poinXP += bonusXP;
    localStorage.setItem(kunciAkun("xp"), poinXP);
    perbaruiLevel();
}


// --- 4. LOBI KUIS & KUIS DINAMIS ---
function bukaLobiKuis() {
    pindahHalaman('lobi-kuis');
    let wadah = document.getElementById("wadah-pilihan-kuis");
    wadah.innerHTML = "";

    for (let idKursus in kurikulumSkillBridge) {
        let item = kurikulumSkillBridge[idKursus];
        let isKuisSelesai = kuisSelesai.includes(idKursus);
        let kelasBadgeTingkat = item.tingkat === "Menengah" ? "badge-menengah" : "badge";
        
        let kartu = document.createElement("div");
        kartu.className = "card";
        kartu.style.minWidth = "270px";
        if (isKuisSelesai) kartu.style.borderLeft = "5px solid #10b981";
        
        kartu.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 5px; flex-wrap: wrap;">
                <div style="display: flex; gap: 5px;">
                    <span class="badge">${item.labelKategori}</span>
                    <span class="${kelasBadgeTingkat}">${item.tingkat}</span>
                </div>
                ${isKuisSelesai ? '<span class="badge-selesai">Kuis Selesai ✓</span>' : ''}
            </div>
            <h3 class="mt-10">${item.judul}</h3>
            <p style="font-size: 13px; color: var(--text-secondary); margin: 10px 0;">${item.kuis.length} Soal Pilihan Ganda</p>
            <button onclick="mulaiKuis('${idKursus}')" style="width: 100%;">
                ${isKuisSelesai ? 'Latihan Ulang 🎯' : 'Mulai Kuis 🎯'}
            </button>
        `;
        wadah.appendChild(kartu);
    }
}

let indeksSoalSaatIni = 0;
let skorKuis = 0;

function mulaiKuis(idTopik) {
    topikKuisAktif = idTopik || kursusAktif || "html";
    indeksSoalSaatIni = 0;
    skorKuis = 0;
    document.getElementById("skor-sementara").innerText = skorKuis;
    document.getElementById("badge-topik-kuis").innerText = `${kurikulumSkillBridge[topikKuisAktif].judul} (${kurikulumSkillBridge[topikKuisAktif].tingkat})`;
    
    pindahHalaman('kuis-interaktif');
    tampilkanSoal();
}

function tampilkanSoal() {
    let daftarSoal = kurikulumSkillBridge[topikKuisAktif].kuis;
    let soal = daftarSoal[indeksSoalSaatIni];

    document.getElementById("teks-pertanyaan").innerText = soal.pertanyaan;
    document.getElementById("teks-posisi-soal").innerText = `Soal ${indeksSoalSaatIni + 1} dari ${daftarSoal.length}`;
    document.getElementById("bar-progres-kuis").style.width = (((indeksSoalSaatIni + 1) / daftarSoal.length) * 100) + "%";

    let wadahOpsi = document.getElementById("wadah-opsi-kuis");
    wadahOpsi.innerHTML = "";
    document.getElementById("feedback-kuis").style.display = "none";
    document.getElementById("btn-lanjut-kuis").style.display = "none";

    soal.opsi.forEach((teksOpsi, index) => {
        let btn = document.createElement("button");
        btn.innerText = "ABCD"[index] + ". " + teksOpsi;
        btn.onclick = () => cekJawabanKuis(btn, index, soal.benar, soal.penjelasan);
        wadahOpsi.appendChild(btn);
    });
}

function cekJawabanKuis(tombolDipilih, indeksDipilih, indeksBenar, penjelasan) {
    let feedbackBox = document.getElementById("feedback-kuis");
    let teksFeedback = document.getElementById("teks-feedback");
    let btnLanjut = document.getElementById("btn-lanjut-kuis");
    let semuaOpsi = document.querySelectorAll("#wadah-opsi-kuis button");

    semuaOpsi.forEach(btn => btn.disabled = true);

    if (indeksDipilih === indeksBenar) {
        bunyikanSuara('benar');
        tombolDipilih.classList.add("benar");
        teksFeedback.innerText = "Benar! " + penjelasan;
        feedbackBox.style.borderLeftColor = "#34d399";
        skorKuis += 1;
        document.getElementById("skor-sementara").innerText = skorKuis;
    } else {
        bunyikanSuara('salah');
        tombolDipilih.classList.add("salah");
        semuaOpsi[indeksBenar].classList.add("benar");
        teksFeedback.innerText = "Kurang tepat. " + penjelasan;
        feedbackBox.style.borderLeftColor = "#f87171";
    }

    feedbackBox.style.display = "block";
    let daftarSoal = kurikulumSkillBridge[topikKuisAktif].kuis;
    btnLanjut.innerText = (indeksSoalSaatIni === daftarSoal.length - 1) ? "Selesai & Klaim XP 🏆" : "Soal Berikutnya →";
    btnLanjut.style.display = "inline-block";
}

function lanjutSoal() {
    let daftarSoal = kurikulumSkillBridge[topikKuisAktif].kuis;
    indeksSoalSaatIni++;
    if (indeksSoalSaatIni < daftarSoal.length) {
        tampilkanSoal();
    } else {
        let pengaliXP = kurikulumSkillBridge[topikKuisAktif].tingkat === "Menengah" ? 15 : 10;
        let totalXPDidapat = skorKuis * pengaliXP;
        
        simpanStatusKuis(topikKuisAktif);
        if (skorKuis === daftarSoal.length) {
            localStorage.setItem(kunciAkun("sempurna"), "true");
        }
        
        let dapatKoin = skorKuis * 5;
        jumlahKoin += dapatKoin;
        perbaruiTampilanKoin();
        
        poinXP += totalXPDidapat;
        localStorage.setItem(kunciAkun("xp"), poinXP);
        perbaruiLevel();

        // Nyalakan api streak jika kuis ini dikerjakan dari Tantangan Harian
        let tanggalHariIni = new Date().toLocaleDateString();
        if (sedangMengerjakanTantanganHarian && localStorage.getItem(kunciAkun("daily_date")) !== tanggalHariIni) {
            localStorage.setItem(kunciAkun("daily_date"), tanggalHariIni);
            jumlahStreak += 1;
            localStorage.setItem(kunciAkun("streak"), jumlahStreak);
            sedangMengerjakanTantanganHarian = false;
            cekTantanganHarian();
            
            bunyikanSuara('benar');
            tampilkanNotifikasi(`Api Menyala! Streak ${jumlahStreak} hari! +${totalXPDidapat} XP & +${dapatKoin} Koin! 🔥🏆`, false);
        } else {
            sedangMengerjakanTantanganHarian = false;
            tampilkanNotifikasi(`Kuis Selesai! Benar ${skorKuis}/${daftarSoal.length}. +${totalXPDidapat} XP & +${dapatKoin} Koin! 🏆`);
        }

        bukaLobiKuis();
    }
}


// --- 5. STUDIO PROYEK & MODAL KONFIRMASI MODERN ---
let daftarProyek = JSON.parse(localStorage.getItem(kunciAkun("proyek"))) || [];
let indeksProyekAkanDihapus = null;

function tampilkanProyek() {
    let wadah = document.getElementById("koleksi-proyek");
    if (!wadah) return;
    wadah.innerHTML = "";
    if (daftarProyek.length === 0) {
        wadah.innerHTML = "<p style='color: gray; font-style: italic;'>Belum ada proyek. Yuk pamerkan karya pertamamu!</p>";
        return;
    }
    daftarProyek.forEach((proyek, index) => {
        let kartu = document.createElement("div");
        kartu.className = "card";
        kartu.style.minWidth = "250px";
        kartu.innerHTML = `
            <h4>${proyek.nama}</h4>
            <p style="font-size: 12px; margin: 10px 0;">
                <a href="${proyek.link.startsWith('http') ? proyek.link : 'https://' + proyek.link}" target="_blank" style="color: #8b5cf6; text-decoration: none;">🔗 Buka Tautan Proyek</a>
            </p>
            <button onclick="bukaModalHapus(${index})" style="background-color: #ef4444; padding: 6px 12px; font-size: 12px;">Hapus 🗑️</button>
        `;
        wadah.appendChild(kartu);
    });
}

function simpanProyek() {
    let nama = document.getElementById("input-nama-proyek").value;
    let link = document.getElementById("input-link-proyek").value;
    if (!nama || !link) {
        tampilkanNotifikasi("Pengingat: Nama dan Link proyek wajib diisi! ⚠️");
        return;
    }
    daftarProyek.push({ nama, link });
    localStorage.setItem(kunciAkun("proyek"), JSON.stringify(daftarProyek));
    document.getElementById("input-nama-proyek").value = "";
    document.getElementById("input-link-proyek").value = "";
    tampilkanProyek();

    let dapatKoin = 15;
    jumlahKoin += dapatKoin;
    perbaruiTampilanKoin();
    bunyikanSuara('benar');

    tampilkanNotifikasi(`Proyek berhasil disimpan! +20 XP & +${dapatKoin} Koin! 🚀🪙`, false);
    poinXP += 20;
    localStorage.setItem(kunciAkun("xp"), poinXP);
    perbaruiLevel();
}

function bukaModalHapus(index) {
    indeksProyekAkanDihapus = index;
    let namaProyek = daftarProyek[index].nama;
    document.getElementById("pesan-modal").innerText = `Apakah kamu yakin ingin menghapus proyek "${namaProyek}"?`;
    document.getElementById("modal-konfirmasi").style.display = "flex";
    document.getElementById("btn-konfirmasi-ya").onclick = () => {
        eksekusiHapusProyek();
    };
}

function tutupModalKonfirmasi() {
    document.getElementById("modal-konfirmasi").style.display = "none";
    indeksProyekAkanDihapus = null;
}

function eksekusiHapusProyek() {
    if (indeksProyekAkanDihapus !== null) {
        let namaTerhapus = daftarProyek[indeksProyekAkanDihapus].nama;
        daftarProyek.splice(indeksProyekAkanDihapus, 1);
        localStorage.setItem(kunciAkun("proyek"), JSON.stringify(daftarProyek));
        
        bunyikanSuara('salah');
        tampilkanProyek();
        tutupModalKonfirmasi();
        tampilkanNotifikasi(`Proyek "${namaTerhapus}" telah dihapus. 🗑️`, false);
    }
}
tampilkanProyek();

document.getElementById("input-nama-proyek").addEventListener("keydown", function(e) {
    if (e.key === "Enter") {
        e.preventDefault();
        if (this.value.trim() !== "") {
            document.getElementById("input-link-proyek").focus();
        }
    }
});

document.getElementById("input-link-proyek").addEventListener("keydown", function(e) {
    if (e.key === "Enter") {
        e.preventDefault();
        let namaTerisi = document.getElementById("input-nama-proyek").value.trim() !== "";
        let linkTerisi = this.value.trim() !== "";
        if (namaTerisi && linkTerisi) {
            simpanProyek();
        } else if (!namaTerisi) {
            document.getElementById("input-nama-proyek").focus();
        }
    }
});


// --- 6. TANTANGAN HARIAN & STREAK (API PADAM JIKA TUGAS BELUM SELESAI) ---
let sedangMengerjakanTantanganHarian = false;

function cekTantanganHarian() {
    let tanggalTerakhir = localStorage.getItem(kunciAkun("daily_date"));
    let hariIni = new Date();
    let tanggalHariIni = hariIni.toLocaleDateString();
    let kemarin = new Date();
    kemarin.setDate(hariIni.getDate() - 1);
    let tanggalKemarin = kemarin.toLocaleDateString();

    // Reset streak jika terlewat lebih dari 1 hari
    if (tanggalTerakhir && tanggalTerakhir !== tanggalHariIni && tanggalTerakhir !== tanggalKemarin) {
        jumlahStreak = 0;
        localStorage.setItem(kunciAkun("streak"), 0);
    }

    let sudahSelesaiHariIni = (tanggalTerakhir === tanggalHariIni);
    let elStreak = document.getElementById("tampilan-streak");
    let btnMulai = document.getElementById("btn-mulai-harian");
    let kartuTantangan = document.getElementById("kartu-tantangan");

    if (elStreak) {
        elStreak.classList.remove("streak-padam", "streak-menyala");
        if (sudahSelesaiHariIni && jumlahStreak > 0) {
            // Api menyala terang karena tugas hari ini sudah selesai
            elStreak.classList.add("streak-menyala");
            elStreak.innerText = `🔥 ${jumlahStreak} Hari Beruntun`;
        } else {
            // Api padam karena pengguna belum menyelesaikan tugas hari ini
            elStreak.classList.add("streak-padam");
            elStreak.innerText = jumlahStreak > 0 
                ? `🕯️ ${jumlahStreak} Hari (Belum Nyala Hari Ini)` 
                : `🕯️ 0 Hari (Api Padam)`;
        }
    }

    if (btnMulai) {
        if (sudahSelesaiHariIni) {
            btnMulai.innerText = "Tugas Hari Ini Selesai ✓";
            btnMulai.classList.add("selesai");
            btnMulai.disabled = true;
            if (kartuTantangan) kartuTantangan.style.opacity = "0.75";
        } else {
            btnMulai.innerText = "Kerjakan Tantangan →";
            btnMulai.classList.remove("selesai");
            btnMulai.disabled = false;
            if (kartuTantangan) kartuTantangan.style.opacity = "1";
        }
    }
}

function mulaiTantanganHarian() {
    // Tandai bahwa pengguna sedang mengerjakan misi harian (streak belum ditambah sebelum kuis selesai)
    sedangMengerjakanTantanganHarian = true;
    tampilkanNotifikasi("Selesaikan 1 kuis hingga tuntas untuk menyalakan api streak hari ini! 🕯️→🔥");
    
    // Pilih otomatis 1 topik kuis acak agar langsung mulai mengerjakan tugas
    let daftarIdKursus = Object.keys(kurikulumSkillBridge);
    let topikAcak = daftarIdKursus[Math.floor(Math.random() * daftarIdKursus.length)];
    mulaiKuis(topikAcak);
}
cekTantanganHarian();

// Pengingat ceria otomatis jika tantangan harian belum dikerjakan hari ini
if (akunAktif && localStorage.getItem(kunciAkun("daily_date")) !== new Date().toLocaleDateString()) {
    setTimeout(() => {
        tampilkanNotifikasi("Api harianmu masih padam! Selesaikan tantangan hari ini untuk menyalakannya! 🕯️");
    }, 1200);
}


// --- 7. PENGATURAN (TOKO MASKOT, PROFIL, TEMA, BACKUP) ---
function renderTokoMaskot() {
    let wadah = document.getElementById("wadah-pilihan-maskot");
    if (!wadah) return;
    wadah.innerHTML = "";
    perbaruiTampilanKoin();

    katalogMaskot.forEach(item => {
        let sudahPunya = maskotDimiliki.includes(item.emoji);
        let sedangDipakai = (maskotAktif === item.emoji);

        let kartu = document.createElement("div");
        kartu.className = "card-maskot";
        if (sedangDipakai) kartu.classList.add("dipakai");
        else if (!sudahPunya) kartu.classList.add("terkunci");

        let labelStatus = "";
        if (sedangDipakai) {
            labelStatus = `<span class="status-maskot-tag tag-dipakai">✓ Sedang Dipakai</span>`;
        } else if (sudahPunya) {
            labelStatus = `<span class="status-maskot-tag tag-milik">Dimiliki (Pakai)</span>`;
        } else {
            labelStatus = `<span class="status-maskot-tag tag-harga">🔒 ${item.harga} 🪙</span>`;
        }

        kartu.innerHTML = `
            <div style="font-size: 36px;">${item.emoji}</div>
            <strong style="font-size: 13px;">${item.nama}</strong>
            ${labelStatus}
        `;

        kartu.onclick = () => klikKartuMaskot(item);
        wadah.appendChild(kartu);
    });
}

function klikKartuMaskot(item) {
    let sudahPunya = maskotDimiliki.includes(item.emoji);

    if (sudahPunya) {
        maskotAktif = item.emoji;
        localStorage.setItem(kunciAkun("maskot"), maskotAktif);
        document.getElementById("maskot-beranda").innerText = maskotAktif;
        renderTokoMaskot();
        tampilkanNotifikasi(`Karakter diubah menjadi ${item.nama} ${item.emoji}!`, false);
    } else {
        if (jumlahKoin >= item.harga) {
            // Munculkan modal konfirmasi pembelian terlebih dahulu
            let modal = document.getElementById("modal-konfirmasi");
            let judulModal = document.getElementById("judul-modal");
            let pesanModal = document.getElementById("pesan-modal");
            let btnYa = document.getElementById("btn-konfirmasi-ya");

            judulModal.innerText = `Beli ${item.nama} ${item.emoji}?`;
            pesanModal.innerText = `Harga karakter ini adalah ${item.harga} 🪙 (Sisa koinmu nanti: ${jumlahKoin - item.harga} 🪙). Lanjutkan pembelian?`;
            btnYa.innerText = `Ya, Beli (${item.harga} 🪙)`;
            btnYa.style.backgroundColor = "#10b981"; // Hijau konfirmasi beli

            modal.style.display = "flex";

            btnYa.onclick = () => {
                jumlahKoin -= item.harga;
                maskotDimiliki.push(item.emoji);
                maskotAktif = item.emoji;

                localStorage.setItem(kunciAkun("maskot_dimiliki"), JSON.stringify(maskotDimiliki));
                localStorage.setItem(kunciAkun("maskot"), maskotAktif);
                document.getElementById("maskot-beranda").innerText = maskotAktif;

                // Kembalikan gaya tombol modal ke default (untuk hapus proyek nanti)
                judulModal.innerText = "Hapus Proyek?";
                btnYa.innerText = "Ya, Hapus 🗑️";
                btnYa.style.backgroundColor = "#ef4444";
                tutupModalKonfirmasi();

                bunyikanSuara('benar');
                renderTokoMaskot();
                tampilkanNotifikasi(`Berhasil membeli & memakai ${item.nama} ${item.emoji}! 🎉`, false);
            };
        } else {
            bunyikanSuara('salah');
            let kurang = item.harga - jumlahKoin;
            tampilkanNotifikasi(`Koin belum cukup! Butuh ${kurang} 🪙 lagi. Selesaikan materi atau kuis!`, false);
        }
    }
}
renderTokoMaskot();

function simpanProfil() {
    let nama = document.getElementById("input-nama-profil").value.trim();
    if (!nama) {
        tampilkanNotifikasi("Nama tidak boleh kosong! ⚠️");
        return;
    }
    localStorage.setItem(kunciAkun("nama"), nama);
    document.getElementById("sapaan-profil").innerText = "Halo, " + nama + "! Selamat belajar.";
    document.getElementById("sapaan-beranda").innerText = `Halo ${nama}, siap mengembangkan keahlianmu hari ini?`;
    tampilkanNotifikasi("Profil berhasil disimpan! 💾");
}

document.getElementById("input-nama-profil").addEventListener("keydown", function(e) {
    if (e.key === "Enter") {
        e.preventDefault();
        simpanProfil();
    }
});

function toggleTema() {
    document.body.classList.toggle("dark-mode");
    let isDark = document.body.classList.contains("dark-mode");
    localStorage.setItem("skillbridge_tema", isDark ? "gelap" : "terang");
    document.getElementById("tombol-tema").innerText = isDark ? "Beralih ke Mode Terang ☀️" : "Beralih ke Mode Gelap 🌙";
}

function tampilkanNotifikasi(pesan, putarSuaraPengingat = true) {
    let wadah = document.getElementById("wadah-notifikasi");
    if (!wadah) return;
    
    if (putarSuaraPengingat) {
        bunyikanSuara('pengingat');
    }
    
    let notif = document.createElement("div");
    notif.className = "notifikasi";
    notif.innerText = pesan;
    wadah.appendChild(notif);
    setTimeout(() => notif.remove(), 3200);
}

function salinKodeBackup() {
    let paketData = {
        user: akunAktif,
        xp: poinXP,
        koin: jumlahKoin,
        streak: jumlahStreak,
        materi: materiSelesai,
        kuis: kuisSelesai,
        proyek: daftarProyek,
        maskot: maskotAktif,
        koleksiMaskot: maskotDimiliki
    };
    let kodeTeks = btoa(JSON.stringify(paketData));
    navigator.clipboard.writeText(kodeTeks).then(() => {
        tampilkanNotifikasi("Kode cadangan disalin! Simpan di catatan HP-mu. 📋");
    });
}

function bukaModalPulihkan() {
    let kodeInput = prompt("Tempelkan (Paste) Kode Cadangan Progresmu di sini:");
    if (!kodeInput) return;
    try {
        let dataPulih = JSON.parse(atob(kodeInput.trim()));
        localStorage.setItem(kunciAkun("xp"), dataPulih.xp || 0);
        localStorage.setItem(kunciAkun("koin"), dataPulih.koin || 0);
        localStorage.setItem(kunciAkun("streak"), dataPulih.streak || 0);
        localStorage.setItem(kunciAkun("materi_selesai"), JSON.stringify(dataPulih.materi || []));
        localStorage.setItem(kunciAkun("kuis_selesai"), JSON.stringify(dataPulih.kuis || []));
        localStorage.setItem(kunciAkun("proyek"), JSON.stringify(dataPulih.proyek || []));
        localStorage.setItem(kunciAkun("maskot"), dataPulih.maskot || "🌟");
        localStorage.setItem(kunciAkun("maskot_dimiliki"), JSON.stringify(dataPulih.koleksiMaskot || ["🌟"]));
        tampilkanNotifikasi("Progres berhasil dipulihkan! Memuat ulang... 🔄");
        setTimeout(() => location.reload(), 1000);
    } catch (e) {
        tampilkanNotifikasi("Kode cadangan tidak valid! ⚠️");
    }
}


// --- 8. FITUR INSTALL APLIKASI KE HP (PWA) ---
let promptInstallPWA;

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
}

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    promptInstallPWA = e;
});

function installAplikasi() {
    if (promptInstallPWA) {
        promptInstallPWA.prompt();
        promptInstallPWA.userChoice.then((choice) => {
            if (choice.outcome === 'accepted') {
                tampilkanNotifikasi("Skill Bridge sedang di-install ke perangkatmu! 📲");
            }
            promptInstallPWA = null;
        });
    } else {
        tampilkanNotifikasi("Buka lewat Chrome HP setelah di-upload ke GitHub, lalu pilih 'Install App' di menu titik tiga (⋮). 📲");
    }
}


// --- 9. FITUR PROGRES SAYA & PENCAPAIAN (ACHIEVEMENTS) ---
function bukaHalamanProgres() {
    pindahHalaman('progres');

    let namaUser = localStorage.getItem(kunciAkun("nama")) || akunAktif || "Pengguna SkillBridge";
    document.getElementById("progres-nama-pengguna").innerText = namaUser;
    document.getElementById("progres-avatar").innerText = maskotAktif;

    let levelText = "Pelajar Pemula (Level 1)";
    if (poinXP >= 50 && poinXP < 150) levelText = "Pelajar Menengah (Level 2)";
    else if (poinXP >= 150 && poinXP < 300) levelText = "Pelajar Mahir (Level 3)";
    else if (poinXP >= 300) levelText = "Master SkillBridge (Level 4)";
    document.getElementById("progres-badge-level").innerText = levelText;

    let totalKursus = Object.keys(kurikulumSkillBridge).length;
    document.getElementById("stat-materi-selesai").innerText = `${materiSelesai.length} / ${totalKursus}`;
    document.getElementById("stat-kuis-selesai").innerText = `${kuisSelesai.length} / ${totalKursus}`;
    document.getElementById("stat-total-xp").innerText = `${poinXP} XP`;

    let wadahRiwayat = document.getElementById("wadah-riwayat-selesai");
    if (materiSelesai.length === 0 && kuisSelesai.length === 0) {
        wadahRiwayat.innerHTML = `<p style="color: var(--text-secondary); font-size: 14px;">Belum ada materi atau kuis yang diselesaikan. Yuk mulai belajar!</p>`;
    } else {
        let htmlRiwayat = "";
        materiSelesai.forEach(id => {
            if (kurikulumSkillBridge[id]) {
                htmlRiwayat += `<span class="chip-riwayat">📖 Materi: ${kurikulumSkillBridge[id].judul} ✓</span>`;
            }
        });
        kuisSelesai.forEach(id => {
            if (kurikulumSkillBridge[id]) {
                htmlRiwayat += `<span class="chip-riwayat" style="background-color: #e0e7ff; color: #3730a3;">🎯 Kuis: ${kurikulumSkillBridge[id].judul} ✓</span>`;
            }
        });
        wadahRiwayat.innerHTML = htmlRiwayat;
    }

    let pernahSempurna = localStorage.getItem(kunciAkun("sempurna")) === "true";
    let sudahBikinProyek = daftarProyek.length >= 1;

    const daftarPencapaian = [
        { judul: "Langkah Pertama", deskripsi: "Selesaikan 1 materi pembelajaran.", ikon: "🌱", terbuka: materiSelesai.length >= 1 },
        { judul: "Pelajar Rajin", deskripsi: "Selesaikan 5 materi pembelajaran.", ikon: "📘", terbuka: materiSelesai.length >= 5 },
        { judul: "Mulai Eksplorasi", deskripsi: "Selesaikan setidaknya 1 kuis latihan.", ikon: "🎒", terbuka: kuisSelesai.length >= 1 },
        { judul: "Sempurna!", deskripsi: "Dapatkan nilai 100% (benar semua) di kuis.", ikon: "🏆", terbuka: pernahSempurna },
        { judul: "Si Ratusan", deskripsi: "Kumpulkan total 100 XP.", ikon: "⭐", terbuka: poinXP >= 100 },
        { judul: "Si Pemburu XP", deskripsi: "Kumpulkan total 300 XP.", ikon: "👑", terbuka: poinXP >= 300 },
        { judul: "Api Konsisten (3 Hari)", deskripsi: "Pertahankan streak harian 3 hari tanpa padam.", ikon: "🔥", terbuka: jumlahStreak >= 3 },
        { judul: "Api Abadi (7 Hari)", deskripsi: "Pertahankan streak harian 7 hari tanpa padam.", ikon: "☄️", terbuka: jumlahStreak >= 7 },
        { judul: "Kreator Muda", deskripsi: "Simpan minimal 1 karya di Studio Proyek.", ikon: "🎨", terbuka: sudahBikinProyek },
        { judul: "Kolektor Karakter", deskripsi: "Miliki minimal 3 karakter maskot.", ikon: "🎭", terbuka: maskotDimiliki.length >= 3 }
    ];

    let wadahAchievement = document.getElementById("wadah-achievement");
    wadahAchievement.innerHTML = "";

    daftarPencapaian.forEach(item => {
        let kartu = document.createElement("div");
        kartu.className = "card-achievement " + (item.terbuka ? "terbuka" : "terkunci");
        kartu.innerHTML = `
            <div class="ikon-achievement">${item.terbuka ? item.ikon : "🔒"}</div>
            <div>
                <h4 style="margin-bottom: 4px; font-size: 15px;">${item.judul}</h4>
                <p style="font-size: 12px; color: var(--text-secondary);">${item.deskripsi}</p>
            </div>
        `;
        wadahAchievement.appendChild(kartu);
    });
}


// --- 10. FITUR MINI GAME (LOBI PEMILIH + MAZE + POLA ANGKA + TANGKAP BINTANG) ---
let timerGameTangkap = null;

function bukaHalamanGame() {
    pindahHalaman('game');
    kembaliKeLobiGame();
}

function kembaliKeLobiGame() {
    if (timerGameTangkap) {
        clearInterval(timerGameTangkap);
        timerGameTangkap = null;
    }
    document.getElementById("lobi-mini-game").style.display = "block";
    document.getElementById("arena-mini-game").style.display = "none";
}

function bukaArenaGame(mode) {
    document.getElementById("lobi-mini-game").style.display = "none";
    document.getElementById("arena-mini-game").style.display = "block";

    document.getElementById("wadah-game-maze").style.display = "none";
    document.getElementById("wadah-game-pola").style.display = "none";
    document.getElementById("wadah-game-tangkap").style.display = "none";

    if (mode === 'maze') {
        document.getElementById("wadah-game-maze").style.display = "block";
        renderMaze();
    } else if (mode === 'pola') {
        document.getElementById("wadah-game-pola").style.display = "block";
        muatSoalPola();
    } else if (mode === 'tangkap') {
        document.getElementById("wadah-game-tangkap").style.display = "block";
        siapkanArenaTangkap();
    }
}

// Fungsi pembantu khusus untuk menambah XP dan Koin dari Mini Game
function beriHadiahGame(tambahXP, tambahKoin, pesanNotif) {
    poinXP += tambahXP;
    jumlahKoin += tambahKoin;
    
    localStorage.setItem(kunciAkun("xp"), poinXP);
    localStorage.setItem(kunciAkun("koin"), jumlahKoin);
    
    perbaruiLevel();
    perbaruiTampilanKoin();
    
    // Pastikan tampilan toko maskot juga ikut ter-update jika sedang terbuka
    if (typeof renderTokoMaskot === "function") {
        renderTokoMaskot();
    }
    
    bunyikanSuara('benar');
    tampilkanNotifikasi(pesanNotif, false);
}

// === GAME 1: LABIRIN LOGIKA ===
const petaMaze = [
    [
        [0, 0, 1, 0, 0, 0, 1, 0],
        [1, 0, 1, 0, 1, 0, 1, 0],
        [1, 0, 0, 0, 1, 0, 0, 0],
        [1, 1, 1, 0, 1, 1, 1, 0],
        [0, 0, 0, 0, 0, 0, 1, 0],
        [0, 1, 1, 1, 1, 0, 1, 0],
        [0, 1, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 1, 1, 1, 1, 2]
    ],
    [
        [0, 1, 0, 0, 0, 1, 0, 0],
        [0, 1, 0, 1, 0, 1, 0, 1],
        [0, 0, 0, 1, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 0, 1],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 0, 1, 1, 1],
        [0, 0, 0, 1, 0, 0, 0, 1],
        [1, 1, 0, 0, 0, 1, 0, 2]
    ],
    [
        [0, 0, 0, 1, 0, 0, 0, 0],
        [1, 1, 0, 1, 0, 1, 1, 0],
        [0, 0, 0, 0, 0, 1, 0, 0],
        [0, 1, 1, 1, 1, 1, 0, 1],
        [0, 1, 0, 0, 0, 0, 0, 1],
        [0, 1, 0, 1, 1, 1, 1, 1],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [1, 1, 1, 1, 1, 1, 1, 2]
    ],
    [
        [0, 1, 0, 0, 0, 1, 0, 0],
        [0, 1, 0, 1, 0, 1, 0, 1],
        [0, 1, 0, 1, 0, 1, 0, 1],
        [0, 1, 0, 1, 0, 1, 0, 1],
        [0, 1, 0, 1, 0, 1, 0, 1],
        [0, 1, 0, 1, 0, 1, 0, 1],
        [0, 0, 0, 1, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 0, 2]
    ],
    [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [1, 1, 1, 1, 1, 1, 1, 0],
        [0, 0, 0, 0, 0, 0, 1, 0],
        [0, 1, 1, 1, 1, 0, 1, 0],
        [0, 1, 2, 0, 1, 0, 1, 0],
        [0, 1, 1, 0, 1, 0, 1, 0],
        [0, 0, 0, 0, 1, 0, 1, 0],
        [1, 1, 1, 1, 1, 0, 0, 0]
    ],
    [
        [0, 0, 0, 0, 1, 0, 0, 0],
        [0, 1, 1, 0, 1, 0, 1, 0],
        [0, 1, 0, 0, 0, 0, 1, 0],
        [0, 1, 0, 1, 1, 1, 1, 0],
        [0, 0, 0, 1, 0, 0, 0, 0],
        [1, 1, 1, 1, 0, 1, 1, 1],
        [0, 0, 0, 0, 0, 1, 0, 0],
        [0, 1, 1, 1, 0, 0, 0, 2]
    ]
];

let levelMazeSaatIni = 0;
let posisiPemain = { x: 0, y: 0 };
let langkahMaze = 0;

function renderMaze() {
    let papan = document.getElementById("papan-maze");
    if (!papan) return;
    papan.innerHTML = "";

    let peta = petaMaze[levelMazeSaatIni];
    document.getElementById("label-level-maze").innerText = `Level ${levelMazeSaatIni + 1} dari ${petaMaze.length}`;
    document.getElementById("jumlah-langkah-maze").innerText = langkahMaze;

    for (let y = 0; y < peta.length; y++) {
        for (let x = 0; x < peta[y].length; x++) {
            let sel = document.createElement("div");
            sel.className = "sel-maze";

            if (peta[y][x] === 1) sel.classList.add("sel-tembok");
            else if (peta[y][x] === 2) {
                sel.classList.add("sel-finis");
                sel.innerText = "🏆";
            } else sel.classList.add("sel-jalan");

            if (posisiPemain.x === x && posisiPemain.y === y) {
                sel.innerText = maskotAktif;
            }

            papan.appendChild(sel);
        }
    }
}

function gerakMaze(dx, dy) {
    let targetX = posisiPemain.x + dx;
    let targetY = posisiPemain.y + dy;
    let peta = petaMaze[levelMazeSaatIni];

    if (targetY >= 0 && targetY < peta.length && targetX >= 0 && targetX < peta[0].length) {
        if (peta[targetY][targetX] !== 1) {
            posisiPemain.x = targetX;
            posisiPemain.y = targetY;
            langkahMaze++;
            renderMaze();

            if (peta[targetY][targetX] === 2) {
                beriHadiahGame(15, 10, `Level ${levelMazeSaatIni + 1} selesai! +15 XP & +10 Koin! 🏆🪙`);

                setTimeout(() => {
                    levelMazeSaatIni = (levelMazeSaatIni + 1) % petaMaze.length;
                    resetMaze();
                }, 700);
            }
        }
    }
}

function resetMaze() {
    posisiPemain = { x: 0, y: 0 };
    langkahMaze = 0;
    renderMaze();
}

document.addEventListener("keydown", function(e) {
    let halamanGame = document.getElementById("halaman-game");
    let arenaGame = document.getElementById("arena-mini-game");
    let gameMazeAktif = document.getElementById("wadah-game-maze").style.display !== "none";
    
    if (halamanGame && halamanGame.style.display === "block" && arenaGame && arenaGame.style.display === "block" && gameMazeAktif) {
        if (e.key === "ArrowUp") { e.preventDefault(); gerakMaze(0, -1); }
        else if (e.key === "ArrowDown") { e.preventDefault(); gerakMaze(0, 1); }
        else if (e.key === "ArrowLeft") { e.preventDefault(); gerakMaze(-1, 0); }
        else if (e.key === "ArrowRight") { e.preventDefault(); gerakMaze(1, 0); }
    }
});


// === GAME 2: TEBAK POLA ANGKA ===
const bankSoalPola = [
    { deret: [2, 4, 6, 8], jawaban: 10, petunjuk: "Setiap langkah ditambah 2." },
    { deret: [3, 6, 12, 24], jawaban: 48, petunjuk: "Setiap angka dikalikan 2 dari angka sebelumnya." },
    { deret: [1, 4, 9, 16], jawaban: 25, petunjuk: "Pola bilangan kuadrat (1×1, 2×2, 3×3, 4×4...)." },
    { deret: [50, 45, 40, 35], jawaban: 30, petunjuk: "Pola menurun, dikurangi 5 setiap langkah." },
    { deret: [1, 1, 2, 3, 5], jawaban: 8, petunjuk: "Deret Fibonacci: jumlahkan dua angka sebelumnya." },
    { deret: [5, 10, 20, 40], jawaban: 80, petunjuk: "Kelipatan dua dari angka sebelumnya." },
    { deret: [10, 13, 16, 19], jawaban: 22, petunjuk: "Setiap langkah ditambah 3." },
    { deret: [100, 90, 81, 73], jawaban: 66, petunjuk: "Pengurangannya mengecil: -10, -9, -8, lalu -7." },
    { deret: [2, 6, 18, 54], jawaban: 162, petunjuk: "Setiap angka dikalikan 3." },
    { deret: [4, 5, 7, 10, 14], jawaban: 19, petunjuk: "Penambahannya naik bertahap: +1, +2, +3, +4, lalu +5." },
    { deret: [64, 32, 16, 8], jawaban: 4, petunjuk: "Setiap langkah dibagi 2." },
    { deret: [1, 8, 27, 64], jawaban: 125, petunjuk: "Pola bilangan pangkat tiga (1³, 2³, 3³, 4³, 5³)." }
];

let indeksPolaSaatIni = 0;

function muatSoalPola() {
    let soal = bankSoalPola[indeksPolaSaatIni];
    document.getElementById("label-soal-pola").innerText = `Soal ${indeksPolaSaatIni + 1} dari ${bankSoalPola.length}`;
    
    let wadahDeret = document.getElementById("deret-angka-box");
    wadahDeret.innerHTML = "";

    soal.deret.forEach(angka => {
        let kotak = document.createElement("div");
        kotak.className = "kotak-angka";
        kotak.innerText = angka;
        wadahDeret.appendChild(kotak);
    });

    let kotakTanya = document.createElement("div");
    kotakTanya.className = "kotak-angka tanda-tanya";
    kotakTanya.innerText = "?";
    wadahDeret.appendChild(kotakTanya);

    let inputEl = document.getElementById("input-jawaban-pola");
    inputEl.value = "";
    inputEl.focus();
    document.getElementById("petunjuk-pola").innerText = "";
}

function cekJawabanPola() {
    let inputUser = parseInt(document.getElementById("input-jawaban-pola").value);
    let soal = bankSoalPola[indeksPolaSaatIni];

    if (isNaN(inputUser)) {
        tampilkanNotifikasi("Masukkan angka jawabanmu terlebih dahulu! ⚠️");
        return;
    }

    if (inputUser === soal.jawaban) {
        beriHadiahGame(10, 5, "Tepat sekali! +10 XP & +5 Koin! 🧠🪙");

        indeksPolaSaatIni = (indeksPolaSaatIni + 1) % bankSoalPola.length;
        muatSoalPola();
    } else {
        bunyikanSuara('salah');
        document.getElementById("petunjuk-pola").innerText = "💡 Petunjuk: " + soal.petunjuk;
        tampilkanNotifikasi("Kurang tepat, coba perhatikan petunjuknya! 🔍", false);
    }
}

document.getElementById("input-jawaban-pola").addEventListener("keydown", function(e) {
    if (e.key === "Enter") {
        e.preventDefault();
        cekJawabanPola();
    }
});


// === GAME 3: TANGKAP BINTANG ===
let skorTangkap = 0;
let sisaWaktuTangkap = 15;

function siapkanArenaTangkap() {
    skorTangkap = 0;
    sisaWaktuTangkap = 15;
    document.getElementById("skor-tangkap").innerText = "0";
    document.getElementById("waktu-tangkap").innerText = "15";
    document.getElementById("target-tangkap").style.display = "none";
    document.getElementById("overlay-mulai-tangkap").style.display = "flex";
}

function mulaiGameTangkap() {
    skorTangkap = 0;
    sisaWaktuTangkap = 15;
    document.getElementById("skor-tangkap").innerText = skorTangkap;
    document.getElementById("waktu-tangkap").innerText = sisaWaktuTangkap;
    document.getElementById("overlay-mulai-tangkap").style.display = "none";

    let target = document.getElementById("target-tangkap");
    target.innerText = maskotAktif;
    target.style.display = "flex";
    pindahkanTargetAcak();

    if (timerGameTangkap) clearInterval(timerGameTangkap);
    timerGameTangkap = setInterval(() => {
        sisaWaktuTangkap--;
        document.getElementById("waktu-tangkap").innerText = sisaWaktuTangkap;

        if (sisaWaktuTangkap <= 0) {
            clearInterval(timerGameTangkap);
            timerGameTangkap = null;
            target.style.display = "none";
            document.getElementById("overlay-mulai-tangkap").style.display = "flex";

            let bonusXP = Math.max(5, skorTangkap);
            let bonusKoin = skorTangkap > 0 ? Math.max(2, Math.floor(skorTangkap / 2)) : 1;
            
            beriHadiahGame(bonusXP, bonusKoin, `Waktu habis! Tertangkap ${skorTangkap}x. +${bonusXP} XP & +${bonusKoin} Koin! ⚡🪙`);
        }
    }, 1000);
}

function pindahkanTargetAcak() {
    let arena = document.getElementById("arena-tangkap");
    let target = document.getElementById("target-tangkap");
    let maksX = arena.clientWidth - 65;
    let maksY = arena.clientHeight - 65;

    let acakX = Math.floor(Math.random() * Math.max(10, maksX));
    let acakY = Math.floor(Math.random() * Math.max(10, maksY));

    target.style.left = acakX + "px";
    target.style.top = acakY + "px";
}

function klikTargetTangkap() {
    if (sisaWaktuTangkap > 0) {
        bunyikanSuara('klik');
        skorTangkap++;
        document.getElementById("skor-tangkap").innerText = skorTangkap;
        pindahkanTargetAcak();
    }
}
