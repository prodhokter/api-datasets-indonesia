# API Datasets Indonesia

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![API Status](https://img.shields.io/badge/status-live-green)](https://api.ibnuhabib.web.id/api/stats)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)

REST API publik untuk dataset Indonesia: **sekolah**, **perguruan tinggi**, **program studi**, **KBBI**, **kata baku**, dan **wilayah administratif**. Semua data (~45MB) diload ke memory, response time <10ms.

**Base URL:** `https://api.ibnuhabib.web.id`

---

## Dataset Terkait

| Dataset | Repo | Records |
|---------|------|---------|
| Sekolah | [dataset-sekolah-indonesia](https://github.com/prodhokter/dataset-sekolah-indonesia) | 547.019 |
| Perguruan Tinggi | [dataset-perguruan-tinggi-indonesia](https://github.com/prodhokter/dataset-perguruan-tinggi-indonesia) | 143 |
| Program Studi | [dataset-program-studi-indonesia](https://github.com/prodhokter/dataset-program-studi-indonesia) | 4.971 |
| KBBI | [dataset-kbbi-indonesia](https://github.com/prodhokter/dataset-kbbi-indonesia) | 209.868 |
| Wilayah | [dataset-wilayah-indonesia](https://github.com/prodhokter/dataset-wilayah-indonesia) | 88.297 |

---

## Menjalankan Lokal

```bash
cd api
npm install
npm start
```

Server berjalan di `http://localhost:3333`.

**Environment variable:**
- `PORT` — port server (default `3333`)

---

## Endpoints

### Stats

```
GET /api/stats
```

**Response:**
```json
{
  "schools": 547019,
  "universities": 143,
  "majors": 4971,
  "dictionary": 209868,
  "kata_baku": 1453,
  "wilayah": {
    "provinces": 34,
    "regencies": 514,
    "districts": 7215,
    "villages": 80534
  }
}
```

### Health

```
GET /health
```

```json
{ "status": "ok", "uptime": 123456.789 }
```

---

### Sekolah

```
GET /api/schools?search=sman1&province=jawa+barat&city=kab.+sukabumi&type=sma&page=1&limit=50
GET /api/schools/:npsn
```

| Param | Tipe | Deskripsi |
|-------|------|-----------|
| `search` | string | Nama sekolah atau NPSN. Support compact matching: `sman1` cocok dengan `SMA NEGERI 1` |
| `province` | string | Provinsi (exact, case-insensitive) |
| `city` | string | Kabupaten/kota (partial, case-insensitive) |
| `type` | string | Jenjang: `SMA`, `SMK`, `MA`, `SMP`, `SD` |
| `page` | int | Halaman (default 1) |
| `limit` | int | Per halaman (max 500, default 50) |

**Response:**
```json
{
  "total": 2920,
  "page": 1,
  "limit": 3,
  "total_pages": 974,
  "data": [
    {
      "npsn": "20253979",
      "name": "SMA NEGERI 1 SURADE",
      "province": "JAWA BARAT",
      "city": "KAB. SUKABUMI",
      "district": "SURADE",
      "type": "SMA",
      "accreditation": "A",
      "rank_national": ""
    }
  ]
}
```

**Contoh:**
```bash
# Cari SMA di Bandung
curl "https://api.ibnuhabib.web.id/api/schools?search=sma&city=kota+bandung&type=sma&limit=5"

# Detail via NPSN
curl "https://api.ibnuhabib.web.id/api/schools/20253979"

# Compact search — spasi diabaikan
curl "https://api.ibnuhabib.web.id/api/schools?search=sman1surade"
```

---

### Perguruan Tinggi

```
GET /api/universities?search=universitas&region=jawa+barat&type=negeri
GET /api/universities/:id
```

| Param | Deskripsi |
|-------|-----------|
| `search` | Nama atau kode PT (case-insensitive) |
| `region` | Provinsi (exact) |
| `type` | `Negeri`, `Swasta`, `Kedinasan` |

`GET /api/universities/:id` menyertakan daftar program studi PT tersebut.

**Response (list):**
```json
[
  {
    "id": "006077d9-df05-486d-a020-3192db4967f9",
    "name": "Universitas Indonesia",
    "code": "UI",
    "city": "Kota Depok",
    "region": "Jawa Barat",
    "type": "Negeri",
    "logo_url": "",
    "total_majors": "79",
    "total_quota": "3247",
    "total_applicants": "102197"
  }
]
```

**Contoh:**
```bash
# Cari PT dengan kata "institut"
curl "https://api.ibnuhabib.web.id/api/universities?search=institut"

# PT negeri di Jawa Timur
curl "https://api.ibnuhabib.web.id/api/universities?region=jawa+timur&type=negeri"

# Detail + daftar prodi
curl "https://api.ibnuhabib.web.id/api/universities/006077d9-df05-486d-a020-3192db4967f9"
```

---

### Program Studi

```
GET /api/majors?search=informatika&university=ui&category=saintek&degree=sarjana&region=jawa+barat&type=negeri&page=1&limit=50
GET /api/majors/:id
```

| Param | Deskripsi |
|-------|-----------|
| `search` | Nama program studi |
| `university` | Nama atau kode PT |
| `category` | `SAINTEK` atau `SOSHUM` |
| `degree` | `Sarjana`, `Sarjana Terapan`, `Diploma Tiga` |
| `region` | Provinsi PT |
| `type` | Tipe PT: `Negeri`, `Swasta`, `Kedinasan` |
| `page` | Halaman (default 1) |
| `limit` | Per halaman (max 500, default 50) |

**Contoh:**
```bash
# Cari prodi informatika
curl "https://api.ibnuhabib.web.id/api/majors?search=informatika&limit=5"

# Prodi saintek di UI
curl "https://api.ibnuhabib.web.id/api/majors?university=ui&category=saintek"

# Prodi Sarjana kedokteran PTN
curl "https://api.ibnuhabib.web.id/api/majors?search=kedokteran&degree=sarjana&type=negeri"
```

---

### KBBI

```
GET /api/dictionary/search?q=cinta&limit=20
GET /api/dictionary/:word
```

**Contoh:**
```bash
# Prefix search
curl "https://api.ibnuhabib.web.id/api/dictionary/search?q=cinta&limit=5"

# Exact match
curl "https://api.ibnuhabib.web.id/api/dictionary/cinta"
```

**Response:**
```json
{
  "word": "cinta",
  "arti": "suka sekali; sayang benar",
  "type": "1"
}
```

---

### Kata Baku

```
GET /api/kata-baku?search=praktek
GET /api/kata-baku/check/:word
```

**Contoh:**
```bash
# Cari pasangan baku-tidak baku
curl "https://api.ibnuhabib.web.id/api/kata-baku?search=praktek"

# Cek apakah kata sudah baku
curl "https://api.ibnuhabib.web.id/api/kata-baku/check/praktek"
```

**Response (`/check`):**
```json
{ "word": "praktek", "is_baku": false, "correction": "praktik" }
```

---

### Wilayah

```
GET /api/wilayah/provinces
GET /api/wilayah/regencies/:provinceId
GET /api/wilayah/districts/:regencyId
GET /api/wilayah/villages/:districtId
```

**Contoh:**
```bash
# Semua provinsi
curl "https://api.ibnuhabib.web.id/api/wilayah/provinces"

# Kabupaten/kota di Jawa Barat (id=32)
curl "https://api.ibnuhabib.web.id/api/wilayah/regencies/32"

# Kecamatan di Kota Bandung (id=3273)
curl "https://api.ibnuhabib.web.id/api/wilayah/districts/3273"

# Desa/kelurahan di kecamatan tertentu
curl "https://api.ibnuhabib.web.id/api/wilayah/villages/3273050"
```

---

### Download CSV

```
GET /download/schools.csv
GET /download/universities.csv
GET /download/majors.csv
GET /download/dictionary.csv
GET /download/kata-baku.csv
GET /download/wilayah/provinces.csv
GET /download/wilayah/regencies.csv
GET /download/wilayah/districts.csv
GET /download/wilayah/villages.csv
```

```bash
curl -O "https://api.ibnuhabib.web.id/download/schools.csv"
```

---

## Error Handling

Semua endpoint mengembalikan HTTP 404 dengan body JSON jika resource tidak ditemukan:

```json
{ "error": "School not found" }
```

Rate limiting: tidak ada. Gunakan dengan bijak.

---

## Deployment

### VPS (PM2)

```bash
cd api
npm install
npm install -g pm2
pm2 start server.js --name datasets-api
pm2 save
pm2 startup
```

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY api/package.json .
RUN npm install
COPY api/ .
COPY data/ ../data/
EXPOSE 3333
CMD ["node", "server.js"]
```

```bash
docker build -t datasets-api .
docker run -p 3333:3333 datasets-api
```

---

## Lisensi

MIT — © 2025 [Ibnul Habib](https://github.com/prodhokter). Data bersumber dari institusi pemerintah Indonesia.
