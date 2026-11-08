/*
  make-pages.js — sinh trang tĩnh cho từng món (p/<id>.html) + sitemap.xml

  Chạy:  node make-pages.js
  Đọc dữ liệu từ Apps Script (API_URL trong script.js), nhóm danh mục bằng đúng đoạn code
  của script.js (marker CATS_DATA / CATS_LOGIC) nên không thể lệch với trang chủ.
*/
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SITE = 'https://cucromoi.github.io/uadochoiha';
const ZALO = 'https://zalo.me/0931328825';
const ROOT = __dirname;

const cut = (src, name) => {
  const m = src.match(new RegExp('// >>> ' + name + '\\n([\\s\\S]*?)\\n// <<< ' + name));
  if (!m) throw new Error('Không tìm thấy marker ' + name + ' trong script.js');
  return m[1];
};

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const jsonLdEsc = s => JSON.stringify(String(s ?? ''));
const vnd = n => Number(n).toLocaleString('vi-VN') + ' đ';
const thumb = (u, w) => String(u || '').replace(/sz=w\d+/, 'sz=w' + w);

// Bỏ emoji + dấu "…" lộn xộn trong tên món, viết hoa chữ đầu cho gọn
const cleanName = s => String(s || '')
  .replace(/[\p{Extended_Pictographic}\u200d\ufe0f]/gu, ' ')
  .replace(/[…]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .replace(/^./, c => c.toUpperCase());

const metaDesc = (name, price, desc) => {
  const base = `${name} giá ${vnd(price)}${desc ? ': ' + desc : ''}`;
  return base.length > 155 ? base.slice(0, 152).trimEnd() + '…' : base;
};

function page(p, cat, prev, next) {
  const name = cleanName(p.name);
  const url = `${SITE}/p/${p.id}.html`;
  const img = thumb(p.img, 800);
  const ld = {
    '@context': 'https://schema.org', '@type': 'Product',
    name, image: [img], description: p.desc || name, sku: String(p.id),
    brand: { '@type': 'Brand', name: 'uadochoiha' },
    offers: { '@type': 'Offer', price: String(p.price), priceCurrency: 'VND', url },
  };
  const nav = [`<a href="../">‹ Tất cả sản phẩm</a>`];
  if (prev) nav.push(`<a href="${prev.id}.html">Món trước: ${esc(cleanName(prev.name))}</a>`);
  if (next) nav.push(`<a href="${next.id}.html">Món kế tiếp: ${esc(cleanName(next.name))}</a>`);

  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(name)} ${vnd(p.price)} – uadochoiha</title>
<meta name="description" content="${esc(metaDesc(name, p.price, p.desc))}">
<link rel="canonical" href="${url}">
<meta name="theme-color" content="#36425f">
<meta property="og:type" content="product">
<meta property="og:site_name" content="uadochoiha">
<meta property="og:title" content="${esc(name)}">
<meta property="og:description" content="${esc(metaDesc(name, p.price, p.desc))}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${esc(img)}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/png" href="../avatar.png">
<link rel="apple-touch-icon" href="../avatar.png">
<link rel="preload" href="../CookieRun-VN.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preconnect" href="https://drive.google.com">
<link rel="preconnect" href="https://lh3.googleusercontent.com">
<link rel="stylesheet" href="../style.css">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
</head>
<body>
<div class="topbar"><div class="wrap tb"><a class="tb-brand" href="../">uadochoiha</a></div></div>
<main class="wrap item">
 <nav class="crumb"><a href="../">Danh mục</a><i>›</i><span>${esc(cat)}</span><i>›</i><span>${esc(name)}</span></nav>
 <div class="item-grid">
  <div class="item-pic"><img src="${esc(img)}" alt="${esc(name)}" width="800" height="800" fetchpriority="high"></div>
  <div class="item-info">
   <h1>${esc(name)}</h1>
   <p class="price">${vnd(p.price)}</p>
   ${p.desc ? `<p class="item-desc">${esc(p.desc)}</p>` : ''}
   <p class="item-cat">Danh mục: <b>${esc(cat)}</b></p>
   <div class="contacts">
    <a class="contact" href="${ZALO}" target="_blank" rel="noopener">Nhắn Zalo đặt món này</a>
    ${/^https?:\/\//i.test(p.link || '') ? `<a class="contact alt" href="${esc(p.link)}" target="_blank" rel="noopener noreferrer">Xem bài viết</a>` : ''}
   </div>
   <p class="item-note">Giá có thể đổi theo đợt hàng – nhắn Zalo 0931 328 825 để chốt.</p>
  </div>
 </div>
 <nav class="pager2">${nav.join('')}</nav>
</main>
<footer><div class="wrap ft ft2">
 <div class="ft-col">
  <h3>uadochoiha</h3>
  <p>Đồ chơi order nội địa Trung – Taobao, 1688, Pinduoduo. Ship toàn quốc từ HCM.</p>
  <p><a href="../">Xem tất cả sản phẩm</a></p>
 </div>
 <div class="ft-col">
  <h3>Liên hệ</h3>
  <a href="${ZALO}" target="_blank" rel="noopener">Zalo 0931 328 825</a>
  <a href="https://www.instagram.com/uadochoiha" target="_blank" rel="noopener">Instagram</a>
  <a href="https://www.tiktok.com/@uadochoiha" target="_blank" rel="noopener">TikTok</a>
 </div>
</div></footer>
</body>
</html>`;
}

async function main(){
  const src = fs.readFileSync(path.join(ROOT, 'script.js'), 'utf8');
  const apiUrl = src.match(/const API_URL\s*=\s*'([^']*)'/)[1];
  if (!apiUrl) throw new Error('API_URL trống – không lấy được dữ liệu từ Google');

  const res = await fetch(apiUrl + '?action=list');
  const data = await res.json();
  if (!data.ok || !Array.isArray(data.products)) throw new Error('API trả về không hợp lệ: ' + JSON.stringify(data).slice(0, 200));
  const products = data.products;

  const ctx = vm.createContext({ products });
  vm.runInContext(cut(src, 'CATS_DATA') + '\n' + cut(src, 'CATS_LOGIC') + '\nthis.cats = products.map(p => catOf(p));', ctx);
  const cats = ctx.cats;

  const sorted = products.map((p, i) => ({ p, cat: cats[i] })).sort((a, b) => a.p.id - b.p.id);
  const dir = path.join(ROOT, 'p');
  fs.mkdirSync(dir, { recursive: true });
  const prevHtml = new Map();
  for (const f of fs.readdirSync(dir)) if (f.endsWith('.html')) prevHtml.set(f, fs.readFileSync(path.join(dir, f), 'utf8'));
  // giữ lastmod cũ của món không đổi nội dung: Google chỉ tin ngày sửa khi nó thật sự sửa
  const prevMod = new Map();
  for (const f of ['sitemap.xml', 'sitemap-pages.xml', 'sitemap-products.xml']) {
    const p = path.join(ROOT, f);
    if (!fs.existsSync(p)) continue;
    for (const m of fs.readFileSync(p, 'utf8').matchAll(/<loc>([^<]+)<\/loc><lastmod>([^<]+)/g)) prevMod.set(m[1], m[2]);
  }

  const today = new Date().toISOString().slice(0, 10);
  const rows = sorted.map((row, i) => {
    const html = page(row.p, row.cat, sorted[i - 1] && sorted[i - 1].p, sorted[i + 1] && sorted[i + 1].p);
    const url = `${SITE}/p/${row.p.id}.html`;
    return { ...row, html, url, lastmod: prevHtml.get(row.p.id + '.html') === html ? (prevMod.get(url) || today) : today };
  });

  for (const f of fs.readdirSync(dir)) if (f.endsWith('.html')) fs.unlinkSync(path.join(dir, f));
  let bytes = 0, noImg = 0;
  rows.forEach(r => {
    if (!r.p.img) noImg++;
    fs.writeFileSync(path.join(dir, r.p.id + '.html'), r.html);
    bytes += Buffer.byteLength(r.html);
  });

  const urlset = list => '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    list.map(u => `  <url><loc>${u.url}</loc><lastmod>${u.lastmod}</lastmod></url>`).join('\n') + '\n</urlset>\n';
  const pages = [{ url: SITE + '/', lastmod: today }];
  fs.writeFileSync(path.join(ROOT, 'sitemap-pages.xml'), urlset(pages));
  fs.writeFileSync(path.join(ROOT, 'sitemap-products.xml'), urlset(rows));
  // sitemap.xml là index: Google đọc file này chỉ ~400 bytes rồi tải từng file con, hỏng 1 file con vẫn còn file kia
  const children = [['sitemap-pages.xml', pages], ['sitemap-products.xml', rows]];
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'),
    '<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    children.map(([f, list]) => {
      const mod = list.map(u => u.lastmod).sort().slice(-1)[0];
      return `  <sitemap><loc>${SITE}/${f}</loc><lastmod>${mod}</lastmod></sitemap>`;
    }).join('\n') + '\n</sitemapindex>\n');
  const urls = pages.concat(rows);
  // Trang chủ chỉ gắn link tới món có trang tĩnh thật; món mới thêm chưa chạy lệnh này thì không bị link 404
  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(sorted.map(r => r.p.id)));

  const byCat = {};
  sorted.forEach(r => { byCat[r.cat] = (byCat[r.cat] || 0) + 1; });
  console.log('món:', products.length, '| trang đã sinh:', sorted.length,
    '| dung lượng:', (bytes / 1048576).toFixed(2) + 'MB', '| trung bình:', Math.round(bytes / sorted.length) + ' bytes');
  console.log('sitemap index:', urls.length, 'URL trong 2 file con | trang viết lại:', rows.filter(r => prevHtml.get(r.p.id + '.html') !== r.html).length, '| ngày sửa khác nhau:', new Set(rows.map(r => r.lastmod)).size);
  if (noImg) console.log('lưu ý:', noImg, 'món không có ảnh (trang vẫn sinh, chỉ thiếu og:image)');
  console.log('danh mục:', Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + ' ' + v).join(' · '));
}

main().catch(e => { console.error('Lỗi:', e.message); process.exit(1); });
