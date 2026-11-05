/**
 * Backend cho uadochoiha: Google Sheet lưu sản phẩm, Google Drive lưu hình.
 * Mật khẩu admin đặt trong Project Settings > Script properties (tên: ADMIN_PASSWORD).
 */
const SHEET_NAME  = 'products';
const FOLDER_NAME = 'uadochoiha';
const HEADERS = ['id', 'name', 'price', 'color', 'desc', 'img', 'emoji', 'link'];
const VERSION = 8; // Mở link /exec trên trình duyệt: thấy "version":2 là đang chạy bản cũ

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
  }
  // Sheet cũ chưa có cột link: tự thêm tiêu đề ở cột H
  if (sh.getRange(1, 8).getValue() !== 'link') sh.getRange(1, 8).setValue('link');
  return sh;
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o))
    .setMimeType(ContentService.MimeType.JSON);
}

function checkPw_(pw) {
  const real = PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD');
  return !!real && pw === real;
}

function readAll_() {
  const v = sheet_().getDataRange().getValues();
  v.shift(); // bỏ dòng tiêu đề
  return v.filter(r => r[0] !== '').map(r => ({
    id: Number(r[0]), name: r[1], price: Number(r[2]),
    color: r[3], desc: r[4], img: r[5], emoji: r[6] || '🧸', link: r[7] || ''
  }));
}

// Khách xem sản phẩm và bộ đếm lượt truy cập: ai cũng gọi được
function doGet(e) {
  const a = (e && e.parameter && e.parameter.action) || 'list';
  if (a === 'visit') return json_(visit_(e.parameter.n === '1'));
  if (a === 'stats') return json_(stats_());
  return json_({ ok: true, version: VERSION, products: readAll_() });
}

// Bộ đếm lưu trong Script properties: VISITS = tổng lượt, VISITORS = số trình duyệt khác nhau
function stats_() {
  const p = PropertiesService.getScriptProperties();
  return { ok: true, visits: Number(p.getProperty('VISITS') || 0), visitors: Number(p.getProperty('VISITORS') || 0) };
}

function visit_(isNew) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const p = PropertiesService.getScriptProperties();
    const v = Number(p.getProperty('VISITS') || 0) + 1;
    p.setProperty('VISITS', String(v));
    let u = Number(p.getProperty('VISITORS') || 0);
    if (isNew) { u++; p.setProperty('VISITORS', String(u)); }
    return { ok: true, visits: v, visitors: u };
  } finally {
    lock.releaseLock();
  }
}

// Admin thêm / sửa / xóa: bắt buộc đúng mật khẩu
function doPost(e) {
  try {
    const b = JSON.parse(e.postData.contents);
    if (!checkPw_(b.password)) return json_({ ok: false, error: 'Sai mật khẩu' });
    if (b.action === 'auth') return json_({ ok: true });
    if (b.action === 'ig') return json_(igFetch_(String(b.url || '')));

    const lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      if (b.action === 'save')   return json_(save_(b.product, b.image));
      if (b.action === 'delete') return json_(delete_(Number(b.id)));
    } finally {
      lock.releaseLock();
    }
    return json_({ ok: false, error: 'Hành động không hợp lệ' });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function findRow_(sh, id) {
  const ids = sh.getRange(1, 1, sh.getLastRow(), 1).getValues().flat();
  return ids.indexOf(id) + 1; // 0 nếu không thấy
}

function save_(p, image) {
  const sh = sheet_();
  p.id = Number(p.id);
  p.price = Number(p.price) || 0;
  p.link = /^https?:\/\//i.test(p.link || '') ? p.link : '';
  if (image) p.img = uploadImage_(image, p.id);
  const row = [p.id, p.name, p.price, p.color || '', p.desc, p.img || '', p.emoji || '🧸', p.link];
  const r = findRow_(sh, p.id);
  if (r > 0) sh.getRange(r, 1, 1, row.length).setValues([row]);
  else sh.appendRow(row);
  return { ok: true, product: { id: p.id, name: p.name, price: p.price, color: p.color || '',
           desc: p.desc, img: p.img || '', emoji: p.emoji || '🧸', link: p.link } };
}

function delete_(id) {
  const sh = sheet_();
  const r = findRow_(sh, id);
  if (r > 1) sh.deleteRow(r);
  return { ok: true };
}

function uploadImage_(dataUrl, id) {
  const m = String(dataUrl).match(/^data:(image\/[\w+.-]+);base64,(.+)$/);
  if (!m) throw new Error('Ảnh không hợp lệ');
  const blob = Utilities.newBlob(Utilities.base64Decode(m[2]), m[1], 'sp_' + id + '_' + Date.now() + '.jpg');
  const it = DriveApp.getFoldersByName(FOLDER_NAME);
  const folder = it.hasNext() ? it.next() : DriveApp.createFolder(FOLDER_NAME);
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return 'https://drive.google.com/thumbnail?id=' + file.getId() + '&sz=w800';
}

/**
 * Lấy caption + ảnh từ link bài viết Instagram (chỉ admin gọi được).
 * Instagram có thể chặn hoặc đòi đăng nhập, khi đó trả lỗi và admin dán caption tay.
 */
function decode_(s) {
  return String(s || '')
    .replace(/&#x([0-9a-f]+);/gi, (m, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (m, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}

function igFetch_(url) {
  const m = String(url).match(/^https:\/\/(www\.)?instagram\.com\/(p|reel)\/([\w-]+)/i);
  if (!m) return { ok: false, error: 'Đây không phải link bài viết Instagram (dạng instagram.com/p/...)' };
  const code = m[3], base = 'https://www.instagram.com/p/' + code;
  // Ảnh lấy trước: /media/ là route riêng, vẫn chạy tốt khi trang HTML bị đẩy về trang đăng nhập
  let img = igImage_(base + '/media/?size=l', 'goc') || igImage_(base + '/media/?size=p', 'goc-p');
  let cap = igCaption_(code);
  // Trang post bị đẩy về đăng nhập thì vẫn còn route /embed/captioned/ (trang nhúng), caption nằm
  // thẳng trong <div class="Caption"> và không phải qua og:description nên ít bị chặn hơn.
  if (!cap.caption) {
    const emb = igEmbedCaption_(code);
    if (emb) { cap.caption = emb; cap.wall = false; }
  }
  // Link CDN của og:image hết hạn sau vài giờ nên không được cache; khi /media/ hỏng mới xin bản tươi.
  // Chỉ xin lại khi caption lấy được từ cache (cap.wall thì gọi thêm cũng vô ích).
  if (!img && !cap.ogImage && !cap.wall) cap = igCaption_(code, true);
  if (!img && cap.ogImage) img = igImage_(cap.ogImage, 'og-image-crop');
  if (!img && !cap.caption) return { ok: false, error: cap.wall ? IG_WALL : 'Instagram không trả dữ liệu (bài riêng tư hoặc đã xoá)' };
  return { ok: true, caption: cap.caption, wall: !!cap.wall, image: img ? img.data : '', via: img ? img.via : '', bytes: img ? img.bytes : 0 };
}

const IG_WALL = 'Instagram đang chặn IP của Apps Script (trả trang đăng nhập). Chờ 15-30 phút thử lại, hoặc tự tải ảnh và dán caption tay.';
// /media/?size=l trả đủ khung hình gốc. og:image thì Instagram đã cắt vuông lệch (stp=c239.0.717.717a)
// nên ảnh vỡ khung và trông như bị phóng to; chỉ dùng og:image khi Instagram chặn /media/.
const IG_UAS = ['facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
                'Googlebot/2.1 (+http://www.google.com/bot.html)'];

/**
 * Caption thật luôn có dạng "412 likes, 0 comments - tênshop on October 27, 2026: "nội dung...""
 * nên trang đăng nhập (cũng có og:description, nhưng là chữ "Tạo tài khoản hoặc đăng nhập...")
 * bị loại bằng chính cái mốc đó thay vì đoán theo từ khóa.
 */
function igCaption_(code, force) {
  const cache = CacheService.getScriptCache();
  const hit = force ? null : cache.get('igc_' + code);
  if (hit) return { caption: hit, ogImage: '', wall: false };
  let ogImage = '';
  for (let i = 0; i < IG_UAS.length; i++) {
    try {
      const res = UrlFetchApp.fetch('https://www.instagram.com/p/' + code + '/', {
        muteHttpExceptions: true, followRedirects: true,
        headers: { 'User-Agent': IG_UAS[i], 'Accept-Language': 'en-US,en;q=0.9' }
      });
      if (res.getResponseCode() === 200) {
        const html = res.getContentText();
        // Trang đăng nhập VẪN còn og:image, nên phải giữ nó làm đường lùi cho ảnh dù caption bị loại
        if (!ogImage) ogImage = meta_(html, 'og:image');
        const desc = meta_(html, 'og:description') || meta_(html, 'description');
        const q = desc.match(/^[^"“]*?(?:likes?|lượt thích|comments?|bình luận)[^"“]*?:\s*["“]([\s\S]*)$/i);
        if (q) {
          const caption = q[1].replace(/["”]\.?\s*$/, '');
          try { cache.put('igc_' + code, caption, 21600); } catch (e) {}
          return { caption: caption, ogImage: ogImage, wall: false };
        }
      }
    } catch (e) {}
    if (i < IG_UAS.length - 1) Utilities.sleep(700);
  }
  return { caption: '', ogImage: ogImage, wall: true };
}

/**
 * Route nhúng /embed/captioned/ trả caption nguyên văn trong <div class="Caption">,
 * không cần parse "N likes, M comments - ..." nên đường này sống được lúc trang post bị tường.
 */
function igEmbedCaption_(code) {
  const cache = CacheService.getScriptCache();
  const hit = cache.get('ige_' + code);
  if (hit) return hit;
  try {
    const res = UrlFetchApp.fetch('https://www.instagram.com/p/' + code + '/embed/captioned/', {
      muteHttpExceptions: true, followRedirects: true,
      headers: { 'User-Agent': IG_UAS[0], 'Accept-Language': 'en-US,en;q=0.9' }
    });
    if (res.getResponseCode() !== 200) return '';
    const m = res.getContentText().match(/class="Caption"[^>]*>(?:<a[^>]*>[\s\S]*?<\/a>)?([\s\S]*?)<\/div>/i);
    if (!m) return '';
    const caption = decode_(m[1].replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, ''))
      .replace(/[ \t]+\n/g, '\n').replace(/^\s+|\s+$/g, '').slice(0, 4000);
    // Trang nhúng bị chặn cũng có div Caption nhưng chỉ chứa chữ mời đăng nhập
    if (caption.length < 2 || IG_WALL_TXT_.test(caption)) return '';
    try { cache.put('ige_' + code, caption, 21600); } catch (e) {}
    return caption;
  } catch (e) { return ''; }
}

const IG_WALL_TXT_ = /tạo tài khoản hoặc|đăng nhập để xem|log ?in ?to instagram|sign ?in ?to instagram|sign ?up (?:for instagram|to see)/i;

function meta_(html, p) {
  const m = html.match(new RegExp('<meta[^>]+(?:property|name)="' + p + '"[^>]+content="([^"]*)"', 'i'))
         || html.match(new RegExp('<meta[^>]+content="([^"]*)"[^>]+(?:property|name)="' + p + '"', 'i'));
  return m ? decode_(m[1]) : '';
}

function igImage_(u, via) {
  try {
    const r = UrlFetchApp.fetch(u, { muteHttpExceptions: true, followRedirects: true,
      headers: { 'User-Agent': IG_UAS[0], 'Accept-Language': 'en-US,en;q=0.9' } });
    const hs = r.getHeaders();
    const ct = String(hs['Content-Type'] || hs['content-type'] || '').split(';')[0];
    const b = r.getContent();
    if (r.getResponseCode() !== 200 || !/^image\//.test(ct) || b.length < 2000) return null;
    return { data: 'data:' + ct + ';base64,' + Utilities.base64Encode(b), via: via, bytes: b.length };
  } catch (e) { return null; }
}

/**
 * Chạy hàm này trong trình soạn thảo (KHÔNG cần deploy) khi nút "Lấy từ link" không ra ảnh:
 * chọn igSelfTest ở mũi tên bên cạnh Chạy rồi bấm Chạy, mở Nhật ký để xem Instagram
 * trả gì cho IP của Google. Dòng nào ra KHÔNG/BỊ TƯỜNG/mã 4xx là thủ phạm.
 */
function igSelfTest() {
  const code = 'DfBgD8VI78Y'; // đổi sang shortcode bài đang thử nếu cần
  const base = 'https://www.instagram.com/p/' + code;
  const head = ua => ({ 'User-Agent': ua, 'Accept-Language': 'en-US,en;q=0.9' });
  let og = '';
  IG_UAS.forEach(ua => {
    const r = UrlFetchApp.fetch(base + '/', { muteHttpExceptions: true, followRedirects: true, headers: head(ua) });
    const html = r.getResponseCode() === 200 ? r.getContentText() : '';
    const desc = meta_(html, 'og:description') || meta_(html, 'description');
    if (!og) og = meta_(html, 'og:image');
    Logger.log('page  ' + r.getResponseCode() + ' html=' + html.length +
      ' caption=' + (/^[^"“]*?(?:likes?|lượt thích|comments?|bình luận)[^"“]*?:\s*["“]/i.test(desc) ? 'OK' : 'BỊ TƯỜNG') +
      ' og:image=' + (meta_(html, 'og:image') ? 'CÓ' : 'KHÔNG') + '  [' + ua.split(' ')[0] + ']');
  });
  ['l', 'p'].forEach(sz => {
    const r = UrlFetchApp.fetch(base + '/media/?size=' + sz, { muteHttpExceptions: true, followRedirects: true, headers: head(IG_UAS[0]) });
    const hs = r.getHeaders();
    const ct = String(hs['Content-Type'] || hs['content-type'] || '?').split(';')[0];
    Logger.log('/media/?size=' + sz + ' -> ' + r.getResponseCode() + ' ' + ct +
      ' bytes=' + (ct.indexOf('image/') === 0 ? r.getContent().length : 0));
  });
  if (og) {
    const r = UrlFetchApp.fetch(og, { muteHttpExceptions: true, followRedirects: true, headers: head(IG_UAS[0]) });
    const hs = r.getHeaders();
    Logger.log('og:image -> ' + r.getResponseCode() + ' ' + String(hs['Content-Type'] || hs['content-type'] || '?').split(';')[0] +
      ' bytes=' + r.getContent().length);
  } else Logger.log('og:image -> không có trong trang');
  // Đường lùi caption: nếu dòng này ra caption=OK thì bản v8 hết phải dán tay
  const e = UrlFetchApp.fetch(base + '/embed/captioned/', { muteHttpExceptions: true, followRedirects: true, headers: head(IG_UAS[0]) });
  const ec = igEmbedCaption_(code);
  Logger.log('embed/captioned -> ' + e.getResponseCode() + ' html=' + (e.getResponseCode() === 200 ? e.getContentText().length : 0) +
    ' caption=' + (ec ? 'OK: ' + ec.slice(0, 60).replace(/\n/g, ' / ') : 'BỊ TƯỜNG'));
}

/**
 * Chạy hàm này MỘT LẦN trong trình soạn thảo (chọn authorize rồi bấm Chạy)
 * để cấp đủ quyền: Sheet, Drive và gọi ra ngoài (UrlFetchApp).
 */
function authorize() {
  SpreadsheetApp.getActiveSpreadsheet().getName();
  DriveApp.getRootFolder().getName();
  UrlFetchApp.fetch('https://www.instagram.com/', { muteHttpExceptions: true });
  Logger.log('Đã cấp đủ quyền');
}
