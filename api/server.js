import express from 'express'
import cors from 'cors'
import compression from 'compression'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA = path.join(__dirname, '..', 'data')

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(compression())
app.use(express.json())

// ---- Helpers ----

function parseCsvLine(line, delim) {
  const cols = []
  let current = '', inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { current += '"'; i++ }
        else { inQuotes = false }
      } else { current += ch }
    } else {
      if (ch === '"') { inQuotes = true }
      else if (ch === delim) { cols.push(current.trim()); current = '' }
      else { current += ch }
    }
  }
  cols.push(current.trim())
  return cols
}

function loadCsv(filename, customHeaders = null) {
  const raw = fs.readFileSync(path.join(DATA, filename), 'utf-8').replace(/^﻿/, '')
  const lines = raw.trim().split('\n').filter(l => l.trim())
  if (lines.length < 1) return []
  // Auto-detect delimiter: count both in first line (outside quotes)
  const first = lines[0]
  let semi = 0, comma = 0, inQ = false
  for (const ch of first) {
    if (ch === '"') inQ = !inQ
    else if (!inQ && ch === ';') semi++
    else if (!inQ && ch === ',') comma++
  }
  const delim = comma > semi ? ',' : ';'

  let headers, dataStart
  if (customHeaders) {
    headers = customHeaders
    dataStart = 0
  } else {
    headers = parseCsvLine(first, delim)
    dataStart = 1
  }

  return lines.slice(dataStart).map(line => {
    const cols = parseCsvLine(line, delim)
    const obj = {}
    headers.forEach((h, i) => { obj[h] = (cols[i] || '').trim() })
    return obj
  })
}

function compact(str) {
  return (str || '').toLowerCase().replace(/\s+/g, '')
}

function paginate(data, page = 1, limit = 50) {
  const start = (page - 1) * limit
  return {
    total: data.length,
    page,
    limit,
    total_pages: Math.ceil(data.length / limit),
    data: data.slice(start, start + limit)
  }
}

// Load all data in memory (all CSVs combined ~45MB, fits easily)
console.log('Loading datasets...')
const schools = loadCsv('schools.csv')
const universities = loadCsv('universities.csv')
const majors = loadCsv('majors.csv')
const dictionary = loadCsv('dictionary.csv')
const kataBaku = loadCsv('kata-baku.csv')

const wilayah = {
  provinces: loadCsv('wilayah/provinces.csv', ['id', 'name']),
  regencies: loadCsv('wilayah/regencies.csv', ['id', 'province_id', 'name']),
  districts: loadCsv('wilayah/districts.csv', ['id', 'regency_id', 'name']),
  villages: loadCsv('wilayah/villages.csv', ['id', 'district_id', 'name'])
}

// Map wilayah parent references for fast lookup
const regencyByProvince = {}
wilayah.regencies.forEach(r => {
  const pid = r.province_id || r.parent_id
  if (!regencyByProvince[pid]) regencyByProvince[pid] = []
  regencyByProvince[pid].push(r)
})

const districtByRegency = {}
wilayah.districts.forEach(d => {
  const pid = d.regency_id || d.parent_id
  if (!districtByRegency[pid]) districtByRegency[pid] = []
  districtByRegency[pid].push(d)
})

const villageByDistrict = {}
wilayah.villages.forEach(v => {
  const pid = v.district_id || v.parent_id
  if (!villageByDistrict[pid]) villageByDistrict[pid] = []
  villageByDistrict[pid].push(v)
})

console.log(`  schools: ${schools.length.toLocaleString()}`)
console.log(`  universities: ${universities.length}`)
console.log(`  majors: ${majors.length.toLocaleString()}`)
console.log(`  dictionary: ${dictionary.length.toLocaleString()}`)
console.log(`  kata-baku: ${kataBaku.length}`)
console.log(`  wilayah: ${wilayah.provinces.length} prov, ${wilayah.regencies.length} kab/kota, ${wilayah.districts.length} kec, ${wilayah.villages.length} desa`)
console.log('Ready.\n')

// ---- Download endpoints ----

app.get('/download/schools.csv', (req, res) => {
  res.download(path.join(DATA, 'schools.csv'))
})
app.get('/download/universities.csv', (req, res) => {
  res.download(path.join(DATA, 'universities.csv'))
})
app.get('/download/majors.csv', (req, res) => {
  res.download(path.join(DATA, 'majors.csv'))
})
app.get('/download/dictionary.csv', (req, res) => {
  res.download(path.join(DATA, 'dictionary.csv'))
})
app.get('/download/kata-baku.csv', (req, res) => {
  res.download(path.join(DATA, 'kata-baku.csv'))
})
app.get('/download/wilayah/:file', (req, res) => {
  const file = req.params.file
  if (!['provinces.csv', 'regencies.csv', 'districts.csv', 'villages.csv'].includes(file)) {
    return res.status(404).json({ error: 'File not found' })
  }
  res.download(path.join(DATA, 'wilayah', file))
})

// ---- API: Schools ----

app.get('/api/schools', (req, res) => {
  const { search, province, city, type, page = 1, limit = 50 } = req.query
  let result = schools

  if (search) {
    const q = search.toLowerCase()
    const qCompact = compact(search)
    result = result.filter(s =>
      s.name.toLowerCase().includes(q) ||
      compact(s.name).includes(qCompact) ||
      s.npsn === q
    )
  }
  if (province) {
    result = result.filter(s => s.province.toLowerCase() === province.toLowerCase())
  }
  if (city) {
    result = result.filter(s => s.city.toLowerCase().includes(city.toLowerCase()))
  }
  if (type) {
    result = result.filter(s => s.type.toUpperCase() === type.toUpperCase())
  }

  res.json(paginate(result, parseInt(page), Math.min(parseInt(limit), 500)))
})

app.get('/api/schools/:npsn', (req, res) => {
  const s = schools.find(s => s.npsn === req.params.npsn)
  if (!s) return res.status(404).json({ error: 'School not found' })
  res.json(s)
})

// ---- API: Universities ----

app.get('/api/universities', (req, res) => {
  const { search, region, type } = req.query
  let result = universities

  if (search) {
    const q = search.toLowerCase()
    result = result.filter(u => u.name.toLowerCase().includes(q) || u.code?.toLowerCase().includes(q))
  }
  if (region) {
    result = result.filter(u => u.region.toLowerCase() === region.toLowerCase())
  }
  if (type) {
    result = result.filter(u => u.type?.toLowerCase() === type.toLowerCase())
  }

  res.json(result)
})

app.get('/api/universities/:id', (req, res) => {
  const u = universities.find(u => u.id === req.params.id)
  if (!u) return res.status(404).json({ error: 'University not found' })

  const uniMajors = majors.filter(m => m.university_id === u.id)
  res.json({ ...u, majors: uniMajors })
})

// ---- API: Majors ----

app.get('/api/majors', (req, res) => {
  const { search, university, category, degree, region, type, page = 1, limit = 50 } = req.query
  let result = majors

  if (search) {
    const q = search.toLowerCase()
    result = result.filter(m => m.name.toLowerCase().includes(q))
  }
  if (university) {
    const q = university.toLowerCase()
    result = result.filter(m =>
      m.university_name.toLowerCase().includes(q) ||
      m.university_code?.toLowerCase() === q
    )
  }
  if (category) {
    result = result.filter(m => m.category?.toUpperCase() === category.toUpperCase())
  }
  if (degree) {
    result = result.filter(m => m.degree?.toLowerCase().includes(degree.toLowerCase()))
  }
  if (region) {
    result = result.filter(m => m.university_region?.toLowerCase() === region.toLowerCase())
  }
  if (type) {
    result = result.filter(m => m.university_type?.toLowerCase() === type.toLowerCase())
  }

  res.json(paginate(result, parseInt(page), Math.min(parseInt(limit), 500)))
})

app.get('/api/majors/:id', (req, res) => {
  const m = majors.find(m => m.id === req.params.id)
  if (!m) return res.status(404).json({ error: 'Major not found' })
  res.json(m)
})

// ---- API: Dictionary ----

app.get('/api/dictionary/search', (req, res) => {
  const { q, limit = 20 } = req.query
  if (!q) return res.json({ data: [] })

  const query = q.toLowerCase()
  const results = dictionary
    .filter(d => d.word?.toLowerCase().startsWith(query))
    .slice(0, parseInt(limit))

  res.json({ query: q, total: results.length, data: results })
})

app.get('/api/dictionary/:word', (req, res) => {
  const word = req.params.word.toLowerCase()
  const results = dictionary.filter(d => d.word?.toLowerCase() === word)
  if (results.length === 0) return res.status(404).json({ error: 'Word not found' })
  res.json(results)
})

// ---- API: Kata Baku ----

app.get('/api/kata-baku', (req, res) => {
  const { search } = req.query
  if (search) {
    const q = search.toLowerCase()
    const results = kataBaku.filter(k =>
      k.salah?.toLowerCase().includes(q) || k.benar?.toLowerCase().includes(q)
    )
    return res.json({ total: results.length, data: results })
  }
  res.json({ total: kataBaku.length, data: kataBaku })
})

app.get('/api/kata-baku/check/:word', (req, res) => {
  const word = req.params.word.toLowerCase()
  const match = kataBaku.find(k => k.salah?.toLowerCase() === word)
  if (match) {
    return res.json({ word, is_baku: false, correction: match.benar })
  }
  res.json({ word, is_baku: true, correction: null })
})

// ---- API: Wilayah ----

app.get('/api/wilayah/provinces', (req, res) => {
  res.json(wilayah.provinces)
})

app.get('/api/wilayah/regencies/:provinceId', (req, res) => {
  const list = regencyByProvince[req.params.provinceId] || []
  res.json(list)
})

app.get('/api/wilayah/districts/:regencyId', (req, res) => {
  const list = districtByRegency[req.params.regencyId] || []
  res.json(list)
})

app.get('/api/wilayah/villages/:districtId', (req, res) => {
  const list = villageByDistrict[req.params.districtId] || []
  res.json(list)
})

// ---- Stats ----

app.get('/api/stats', (req, res) => {
  res.json({
    schools: schools.length,
    universities: universities.length,
    majors: majors.length,
    dictionary: dictionary.length,
    kata_baku: kataBaku.length,
    wilayah: {
      provinces: wilayah.provinces.length,
      regencies: wilayah.regencies.length,
      districts: wilayah.districts.length,
      villages: wilayah.villages.length
    }
  })
})

// ---- Health ----

app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() })
})

// ---- 404 ----

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found', docs: '/api/stats' })
})

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`)
  console.log(`Try: http://localhost:${PORT}/api/stats`)
})
