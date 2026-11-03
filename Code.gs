/**
 * Backend cho uadochoiha: Google Sheet lưu sản phẩm, Google Drive lưu hình.
 * Mật khẩu admin đặt trong Project Settings > Script properties (tên: ADMIN_PASSWORD).
 */
const SHEET_NAME  = 'products';
const FOLDER_NAME = 'uadochoiha';
const HEADERS = ['id', 'name', 'price', 'color', 'desc', 'img', 'emoji', 'link'];
const VERSION = 5; // Mở link /exec trên trình duyệt: thấy "version":2 là đang chạy bản cũ

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
  const code = m[3];
  const head = { 'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)', 'Accept-Language': 'vi-VN,vi;q=0.9' };
  const res = UrlFetchApp.fetch('https://www.instagram.com/p/' + code + '/', {
    muteHttpExceptions: true, followRedirects: true, headers: head
  });
  if (res.getResponseCode() !== 200) return { ok: false, error: 'Instagram trả về mã ' + res.getResponseCode() };
  const html = res.getContentText();
  const meta = p => {
    const h = html.match(new RegExp('<meta[^>]+(?:property|name)="' + p + '"[^>]+content="([^"]*)"', 'i'))
           || html.match(new RegExp('<meta[^>]+content="([^"]*)"[^>]+(?:property|name)="' + p + '"', 'i'));
    return h ? decode_(h[1]) : '';
  };
  const desc = meta('og:description') || meta('description');
  const img = meta('og:image');
  if (!desc && !img) return { ok: false, error: 'Instagram không trả dữ liệu (cần đăng nhập hoặc bài riêng tư)' };
  // og:description có dạng: 500 likes, 2 comments - tênshop on October 12, 2026: "caption..."
  // Bỏ phần đầu (số like, comment, ngày) chỉ lấy nội dung trong dấu ngoặc kép
  let caption = desc;
  const q = desc.match(/^[^"“]*?(?:likes?|lượt thích|comments?|bình luận)[^"“]*?:\s*["“]([\s\S]*)$/i);
  if (q) caption = q[1].replace(/["”]\.?\s*$/, '');
  // /media/?size=l trả đủ khung hình gốc. og:image thì Instagram đã cắt vuông lệch (stp=c239.0.717.717a)
  // nên ảnh vỡ khung và trông như bị phóng to; chỉ dùng og:image khi Instagram chặn /media/.
  const got = igImage_('https://www.instagram.com/p/' + code + '/media/?size=l', 'goc', head)
           || igImage_('https://www.instagram.com/p/' + code + '/media/?size=p', 'goc-p', head)
           || igImage_(img, 'og-image-crop', head);
  return { ok: true, caption: caption, image: got ? got.data : '', via: got ? got.via : '', bytes: got ? got.bytes : 0 };
}

function igImage_(u, via, head) {
  try {
    const r = UrlFetchApp.fetch(u, { muteHttpExceptions: true, followRedirects: true, headers: head });
    const hs = r.getHeaders();
    const ct = String(hs['Content-Type'] || hs['content-type'] || '').split(';')[0];
    const b = r.getContent();
    if (r.getResponseCode() !== 200 || !/^image\//.test(ct) || b.length < 2000) return null;
    return { data: 'data:' + ct + ';base64,' + Utilities.base64Encode(b), via: via, bytes: b.length };
  } catch (e) { return null; }
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
