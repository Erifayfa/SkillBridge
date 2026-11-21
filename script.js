function bukaLobiKuis(filterDipilih = 'semua') {
    pindahHalaman('lobi-kuis');

    document.querySelectorAll('.btn-filter-kuis').forEach(b => b.classList.remove('aktif'));
    let btnFilter = document.getElementById('filter-kuis-' + filterDipilih);
    if (btnFilter) btnFilter.classList.add('aktif');

    let wadah = document.getElementById("wadah-pilihan-kuis");
    wadah.innerHTML = "";

    for (let idKursus in kurikulumSkillBridge) {
        let item = kurikulumSkillBridge[idKursus];
        let cocok = (filterDipilih === 'semua' || item.kategori === filterDipilih);

        if (cocok) {
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
}
