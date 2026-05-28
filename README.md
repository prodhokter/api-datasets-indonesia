# API Datasets Indonesia

REST API untuk mengakses dataset publik Indonesia: sekolah, perguruan tinggi, program studi, KBBI, dan wilayah administratif.

## Dataset Terkait

API ini melayani dataset dari repositori berikut:

- [dataset-sekolah-indonesia](https://github.com/prodhokter/dataset-sekolah-indonesia)
- [dataset-perguruan-tinggi-indonesia](https://github.com/prodhokter/dataset-perguruan-tinggi-indonesia)
- [dataset-program-studi-indonesia](https://github.com/prodhokter/dataset-program-studi-indonesia)
- [dataset-kbbi-indonesia](https://github.com/prodhokter/dataset-kbbi-indonesia)
- [dataset-wilayah-indonesia](https://github.com/prodhokter/dataset-wilayah-indonesia)

---

## Menjalankan

```bash
cd api
npm install
npm start
```

Server berjalan di `http://localhost:3000`. Semua data (~45MB) diload ke memory, response time <10ms.

**Environment variable:**
- `PORT` — port server (default `3000`)

---

## Endpoints

### Stats
```
GET /api/stats
```

### Sekolah
```
GET /api/schools?search=sman1&province=jawa+barat&city=kab.+sukabumi&type=sma&page=1&limit=50
GET /api/schools/:npsn
```

| Param | Deskripsi |
|-------|-----------|
| `search` | Nama sekolah atau NPSN (support compact: "sman1" → "SMA NEGERI 1") |
| `province` | Provinsi (exact) |
| `city` | Kabupaten/kota (partial) |
| `type` | Jenjang: SMA, SMK, MA, SMP, SD |
| `page` | Halaman (default 1) |
| `limit` | Per halaman (max 500, default 50) |

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

### Perguruan Tinggi
```
GET /api/universities?search=universitas&region=jawa+barat&type=negeri
GET /api/universities/:id
```

`GET /api/universities/:id` menyertakan daftar program studi PT tersebut.

### Program Studi
```
GET /api/majors?search=informatika&university=ui&category=saintek&degree=sarjana&region=jawa+barat&type=negeri&page=1&limit=50
GET /api/majors/:id
```

### KBBI
```
GET /api/dictionary/search?q=cinta&limit=20
GET /api/dictionary/:word
```

### Kata Baku
```
GET /api/kata-baku?search=praktek
GET /api/kata-baku/check/:word
```

### Wilayah
```
GET /api/wilayah/provinces
GET /api/wilayah/regencies/:provinceId
GET /api/wilayah/districts/:regencyId
GET /api/wilayah/villages/:districtId
```

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
EXPOSE 3000
CMD ["node", "server.js"]
```

---

## Lisensi

MIT. Data bersumber dari institusi pemerintah Indonesia.
