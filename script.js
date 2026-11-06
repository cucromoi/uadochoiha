/* ===== CẤU HÌNH (sửa ở đây) ===== */
const ADMIN_PASSWORD = 'admin123';              // Chỉ dùng khi API_URL để trống. Khi dùng Google, mật khẩu đặt trong Apps Script
const INSTAGRAM_URL  = 'https://www.instagram.com/uadochoiha';   // Đổi thành trang Instagram của shop
const THREADS_URL    = 'https://www.threads.com/@uadochoiha';     // Đổi thành trang Threads của shop
const PER_PAGE       = 12;                      // Số sản phẩm mỗi trang
const API_URL        = 'https://script.google.com/macros/s/AKfycbx6MHi1WtpljvuJdGSi6LdmTej8wSMFKyGSXMexoo6fnuHrmin8fU4w9SrJHR1qmf4o/exec';  // Dán URL Web App của Google Apps Script vào đây. Để trống = lưu trong trình duyệt
const STORE_KEY      = 'uadochoiha_products_v1';
// Dấu shop ghi tay trong tên/mô tả khi không còn nhận món đó
const OFF_RE = /hàng off|\[off|off\]|đã bán|sold ?out|ngừng nhận/i;
// Danh mục suy từ 6 từ ĐẦU của tên món hàng, không đọc mô tả: mô tả toàn "phụ phí", "giá đã ff"
// và tên nhân vật (kitty/usagi) chen lung, bản regex cũ bỏ dấu nên "cho" trong "dành cho bé"
// thành "chó" -> 115 món bị nhét vào Thú bông.
// Từ nào khớp TRÁI NHẤT thắng; cùng vị trí thì cụm dài hơn thắng ("hộp bút" trước "bút").
// Viết CÓ DẤU vì "bìa" khác "bia", "kệ" khác "xe". Đo lại trên 406 món: 13 nhóm, chỉ 1 món vào "Khác".
const CATS = [
  ['Thú bông', ['gấu bông', 'thú bông', 'cục bông', 'plush', 'chó rách', 'chó rán', 'bông', 'gấu']],
  ['Balo & túi', ['balo', 'ba lô', 'tote', 'pouch', 'itabag', 'crossbag', 'card holder', 'ví cầm', 'ví gập', 'ví đựng', 'ví', 'bóp', 'thắt lưng', 'dây thắt', 'dây rút', 'túi']],
  ['Phụ kiện điện thoại', ['case', 'ốp lưng', 'ốp', 'giá đỡ', 'chân sạc', 'dây sạc', 'sạc dự phòng', 'airpods', 'iphone', 'ipad', 'laptop', 'máy tính', 'miếng dán màn hình', 'lót chuột', 'gáy điện thoại', 'đế']],
  ['Móc khóa & charm', ['móc khóa', 'móc khoá', 'keychains', 'keychain', 'charm', 'lanyard', 'bùa treo', 'badge', 'huy hiệu']],
  ['Sticker & decal', ['sticker', 'decal', 'stk', 'nailbox', 'masking', 'washitape', 'băng dính']],
  ['Văn phòng phẩm', ['bóp viết', 'hộp bút', 'túi bút', 'cây viết', 'viết', 'bút', 'chì', 'thước', 'dập ghim', 'kẹp giấy', 'sổ', 'vở', 'note', 'bìa', 'folder', 'binder', 'lịch', 'schedule', 'bookmark', 'thiệp', 'postcard', 'polaroid', 'card', 'name tag', 'băng keo', 'con dấu', 'giấy', 'bảng',
    // để dành cho đợt hàng văn phòng phẩm sau này (406 món hiện tại chưa món nào khớp, thêm không làm đổi nhóm món cũ)
    'bút máy', 'bút bi', 'bút lông', 'bút nhớ dòng', 'bút xóa', 'highlighter', 'paperclip', 'kẹp bướm', 'kẹp còng', 'sổ còng', 'sổ tay', 'planner', 'journal', 'bìa kiếng', 'bìa lỗ', 'file', 'name card', 'stamp', 'mực', 'gôm', 'tẩy', 'compa', 'keo', 'thước kẻ']],
  ['Phụ kiện tóc', ['kẹp tóc', 'cài tóc', 'kẹo tóc', 'quấn tóc', 'băng đô', 'lược', 'dây buộc tóc', 'kẹp càng cua', 'kẹp gắp', 'miếng dán giữ nếp tóc', 'kẹp mai', 'kẹp tăm', 'bờm']],
  ['Đèn & gối & nệm', ['đèn', 'gối ôm', 'gối kê', 'gối', 'nệm', 'chăn', 'đệm', 'bịt mắt', 'lót ghế']],
  ['Cốc & bình & bàn ăn', ['cốc', 'ly', 'lót ly', 'bình', 'nồi', 'đĩa', 'dĩa', 'muỗng', 'ống hút', 'bento', 'hộp cơm', 'thìa', 'khay', 'ấm', 'chén', 'bát']],
  ['Đồ chơi & mô hình', ['mô hình', 'lego', 'xếp hình', 'búp bê', 'figure', 'doll', 'squishy', 'fidget', 'lắp ráp', 'standee', 'puzzle', 'blindbox', 'blind box', 'tượng', 'gậy chỉ', 'gậy chiến', 'bài uno', 'bài tarot', 'bộ bài', 'đồ chơi', 'phao bơi', 'outfit', 'bóng bay', 'đầu bếp', 'bánh danisa', 'roleplay']],
  ['Quần áo & mang', ['vớ', 'tất', 'quần', 'áo thun', 'áo dây', 'áo', 'dép', 'giày', 'nón', 'mũ', 'tạp dề', 'bikini', 'áo khoác', 'váy', 'gang tay', 'bao tay', 'khăn tắm', 'khăn mặt', 'khăn choàng', 'khăn quàng', 'khăn lông', 'áo len', 'belt']],
  ['Trang sức & làm đẹp', ['dây chuyền', 'vòng cổ', 'khuyên tai', 'nhẫn', 'lắc chân', 'son', 'phấn mắt', 'má hồng', 'makeup', 'mascara', 'kẻ mắt', 'nước hoa', 'gương', 'kính mát', 'kính', 'choker', 'bông tai', 'bấm móng', 'kềm']],
  ['Nhà cửa & decor', ['khăn trải bàn', 'thảm', 'kệ', 'giường', 'thùng rác', 'hộp đựng', 'rổ', 'chậu', 'bồn tắm', 'đồng hồ', 'ô', 'chặn góc', 'nhang muỗi', 'ống heo', 'quạt']]
];
// Tên kiểu "chiikawa gõ mõ", "usagi ngái ngủ" không có danh từ chỉ loại -> figure/thú bông của nhà đó
const CAT_CHARS = ['chiikawa', 'hachiware', 'usagi', 'rilakkuma', 'korilakkuma', 'miffy', 'melody', 'kitty', 'pompompurin', 'cinnamoroll', 'snoopy', 'sumikko', 'hamtaro', 'pingu', 'momonga', 'aiko', 'kuromi', 'pochacco'];
const CAT_PREFIX_DROP = ['hàng off', 'chính hãng', 'tổng hợp', 'gom', 'error', 'restock', 'sale', 'new', 'only'];

const SAMPLE = [
 {id:1,name:'Gấu bông Bunny tai dài',price:129000,desc:'Thỏ bông mềm mịn, ôm êm, cao 30cm. Quà tặng siêu dễ thương.',img:'',emoji:'🐰'},
 {id:2,name:'Cốc sứ mèo thần tài',price:89000,desc:'Cốc sứ in hình mèo vẫy tay, dung tích 350ml, có nắp đậy.',img:'',emoji:'🐱'},
 {id:3,name:'Kẹp tóc nơ cyan',price:25000,desc:'Set 3 kẹp tóc nơ màu xanh ngọc nhẹ nhàng.',img:'',emoji:'🎀'},
 {id:4,name:'Sổ tay kẹo ngọt',price:45000,desc:'Sổ bìa cứng họa tiết kẹo, 120 trang, giấy dày.',img:'',emoji:'📒'},
 {id:5,name:'Đèn ngủ đám mây',price:159000,desc:'Đèn LED hình đám mây, ánh sáng ấm, dùng pin hoặc cáp USB.',img:'',emoji:'☁️'},
 {id:6,name:'Móc khóa cá heo',price:35000,desc:'Móc khóa silicon mềm, treo balo hoặc chìa khóa.',img:'',emoji:'🐬'},
 {id:7,name:'Bình nước dâu tây',price:99000,desc:'Bình nhựa 500ml có ống hút, hình trái dâu mọng.',img:'',emoji:'🍓'},
 {id:8,name:'Hộp bút ếch xanh',price:55000,desc:'Hộp bút vải bông, khóa kéo, đựng được 20 cây bút.',img:'',emoji:'🐸'},
 {id:9,name:'Gối ôm vịt vàng',price:139000,desc:'Gối ôm hình vịt con, bông gòn cao cấp, giặt máy được.',img:'',emoji:'🐥'}
];

/* ===== TIỆN ÍCH ===== */
const $ = s => document.querySelector(s);
const norm = s => (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d');
const vnd = n => Number(n).toLocaleString('vi-VN') + ' đ';
const safeUrl = u => /^https?:\/\//i.test(u || '') ? u : '';
const esc = s => String(s??'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('on'),2200)}

let products = [], admin = sessionStorage.getItem('tbx_admin') === '1', page = 1, editId = null, imgData = '';
let cat = '';

/* ===== GIÚP HIỂN THỊ ===== */
const isOff = p => OFF_RE.test((p.name || '') + ' ' + (p.desc || ''));
// Bỏ emoji + dấu câu, giữ nguyên dấu tiếng Việt để "chó" không nhầm với "cho"
const plain = s => String(s || '').toLowerCase()
  .replace(/[\p{Extended_Pictographic}\u200d\ufe0f]/gu, ' ')
  .replace(/[^0-9a-zàáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ\s]/g, ' ')
  .replace(/\s+/g, ' ').trim();
const catWords = s => {
  let w = plain(s).split(' ');
  while (w.length && CAT_PREFIX_DROP.includes(w[0])) w = w.slice(1);
  return w.slice(0, 6).join(' ');
};
// Sắp xếp theo độ dài giảm dần để cụm 2 từ được xét trước từ đơn của nó ở cùng vị trí
const CAT_KW = CATS.flatMap(([c, ws]) => ws.map(w => ({ w, c }))).sort((a, b) => b.w.length - a.w.length);
const CAT_RE = new RegExp(CAT_KW.map((k, i) => '(?<k' + i + '>(?:^|\\s)' + k.w + '(?=\\s|$))').join('|'), 'u');
const CAT_CHAR_RE = new RegExp('(?:^|\\s)(?:' + CAT_CHARS.join('|') + ')(?=\\s|$)', 'u');
const catMemo = new Map();
function catOf(p) {
  const key = p.id + '|' + p.name;
  let c = catMemo.get(key);
  if (c !== undefined) return c;
  const h = catWords(p.name), m = h.match(CAT_RE);
  c = m ? CAT_KW[+Object.keys(m.groups).find(k => m.groups[k]).slice(1)].c
    : (CAT_CHAR_RE.test(h) ? 'Thú bông' : 'Khác');
  catMemo.set(key, c);
  return c;
}
// Thẻ chỉ rộng ~230-260px nên gọi bản 400px của Drive (đo: w800 = 47KB, w400 = 26KB)
const thumb = (u, w) => String(u || '').replace(/sz=w\d+/, 'sz=w' + w);

let PW = sessionStorage.getItem('tbx_pw') || '';
let apiVersion = 0;
const OLD_MSG = 'Apps Script đang chạy bản CŨ nên chưa lưu được link. Hãy dán lại Code.gs mới, rồi vào Triển khai > Quản lý bản triển khai > biểu tượng bút chì > Phiên bản mới > Triển khai. Nếu bạn tạo "triển khai mới" thì URL đã đổi, hãy dán URL mới vào API_URL trong script.js.';
async function api(action, data = {}, post = false){
  const r = post
    ? await fetch(API_URL, {method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'}, body:JSON.stringify({action, password:PW, ...data})})
    : await fetch(API_URL + '?action=' + action);
  return r.json();
}
async function load(){
  if(API_URL){
    try{ const r = await api('list'); products = r.products || []; apiVersion = r.version || 0; }
    catch(e){ products = []; toast('Không tải được dữ liệu từ Google, kiểm tra lại API_URL'); }
    return;
  }
  try{ const s = localStorage.getItem(STORE_KEY); if(s){ products = JSON.parse(s); return; } }catch(e){}
  try{ const r = await fetch('products.json',{cache:'no-store'}); if(r.ok){ products = await r.json(); return; } }catch(e){}
  products = SAMPLE.slice();
}
function save(){
  if(API_URL) return;
  try{ localStorage.setItem(STORE_KEY, JSON.stringify(products)); }
  catch(e){ toast('Bộ nhớ trình duyệt đầy, hãy xuất JSON rồi xóa bớt ảnh'); }
}

/* ===== LỌC + HIỂN THỊ ===== */
function filtered(){
  const toks = norm($('#q').value.trim()).split(/\s+/).filter(Boolean), mn = parseFloat($('#min').value), mx = parseFloat($('#max').value);
  let list = products.filter(p =>
    toks.every(t => (norm(p.name) + ' ' + norm(p.desc)).includes(t)) &&
    (!cat || catOf(p) === cat) &&
    (isNaN(mn) || p.price >= mn) && (isNaN(mx) || p.price <= mx));
  const s = $('#sort').value;
  if(s==='asc') list.sort((a,b)=>a.price-b.price);
  else if(s==='desc') list.sort((a,b)=>b.price-a.price);
  else if(s==='name') list.sort((a,b)=>a.name.localeCompare(b.name,'vi'));
  else list.sort((a,b)=>b.id-a.id);
  return list;
}
function renderCats(){
  const n = {}; products.forEach(p => n[catOf(p)] = (n[catOf(p)] || 0) + 1);
  const chip = (v, name) => `<button data-cat="${esc(v)}" ${cat===v?'aria-current="true"':''}>${esc(name)}<i>${v ? n[name] : products.length}</i></button>`;
  $('#cats').innerHTML = chip('', 'Tất cả')
    + CATS.filter(c => n[c[0]]).map(c => chip(c[0], c[0])).join('')
    + (n['Khác'] ? chip('Khác', 'Khác') : '');
}
function render(){
  const list = filtered(), pages = Math.max(1, Math.ceil(list.length/PER_PAGE));
  if(page > pages) page = pages;
  const slice = list.slice((page-1)*PER_PAGE, page*PER_PAGE);
  $('#count').textContent = list.length + ' sản phẩm' + (cat ? ' · ' + cat : '');
  $('#grid').innerHTML = slice.length ? slice.map(p => `
   <article class="card">
    <div class="pic">${p.img ? `<img src="${esc(thumb(p.img,400))}" alt="${esc(p.name)}" loading="lazy">` : esc(p.emoji||'🧸')}</div>
    <div class="info">
     <h3 title="${esc(p.name)}">${esc(p.name)}</h3>
     <p class="desc">${esc(p.desc)}</p>
     <div class="price">${vnd(p.price)}</div>
     ${safeUrl(p.link) ? `<a class="more" href="${esc(safeUrl(p.link))}" target="_blank" rel="noopener noreferrer">Xem bài viết</a>` : ''}
     ${admin ? `<div class="row"><button class="btn" data-edit="${p.id}">Sửa</button><button class="btn g" data-del="${p.id}">Xóa</button></div>` : ''}
    </div>
   </article>`).join('')
   : '<div class="empty">Chưa có món nào khớp. Thử đổi từ khóa, khoảng giá hoặc danh mục khác nhé!</div>';
  const b = [`<button ${page===1?'disabled':''} data-pg="${page-1}" aria-label="Trang trước">‹</button>`];
  for(let i=1;i<=pages;i++) if(pages<=7 || i===1 || i===pages || Math.abs(i-page)<=1)
    b.push(`<button data-pg="${i}" ${i===page?'aria-current="true"':''}>${i}</button>`);
  else if(b[b.length-1] !== '<span>…</span>') b.push('<span>…</span>');
  b.push(`<button ${page===pages?'disabled':''} data-pg="${page+1}" aria-label="Trang sau">›</button>`);
  $('#pager').innerHTML = pages>1 ? b.join('') : '';
  $('#adminBar').hidden = !admin;
}

/* ===== SỰ KIỆN ===== */
['q','min','max','sort'].forEach(id => $('#'+id).addEventListener('input', () => {page=1;render()}));
$('#reset').onclick = () => {['q','min','max'].forEach(i=>$('#'+i).value='');$('#sort').value='new';cat='';page=1;renderCats();render()};
$('#cats').onclick = e => {const b=e.target.closest('[data-cat]'); if(b){cat=b.dataset.cat;page=1;renderCats();render()}};
$('#pager').onclick = e => {const b=e.target.closest('[data-pg]'); if(b&&!b.disabled){page=+b.dataset.pg;render();scrollTo({top:$('#grid').offsetTop-120})}};


/* ===== QUẢN TRỊ ===== */
$('#loginBtn').onclick = async () => {
  if(admin) return toast('Bạn đã đăng nhập quản trị');
  const p = prompt('Nhập mật khẩu quản trị:');
  if(p === null) return;
  let ok = false;
  if(API_URL){
    PW = p;
    try{ ok = (await api('auth', {}, true)).ok; }catch(e){ return toast('Không kết nối được Google Apps Script'); }
  } else ok = (p === ADMIN_PASSWORD);
  if(ok){admin=true;sessionStorage.setItem('tbx_admin','1');sessionStorage.setItem('tbx_pw',PW);render();toast('Đăng nhập thành công'); if(API_URL && apiVersion < 2) alert(OLD_MSG)}
  else {PW='';toast('Sai mật khẩu, thử lại nhé')}
};
$('#outBtn').onclick = () => {admin=false;PW='';sessionStorage.removeItem('tbx_admin');sessionStorage.removeItem('tbx_pw');render()};

function openForm(p){
  editId = p ? p.id : null; imgData = p ? (p.img||'') : '';
  $('#dlgTitle').textContent = p ? 'Sửa sản phẩm' : 'Thêm sản phẩm';
  $('#fName').value = p?.name||''; $('#fPrice').value = p?.price??''; $('#fDesc').value = p?.desc||''; $('#fLink').value = p?.link||''; $('#fImg').value=''; $('#fQuick').value=''; $('#fIgUrl').value='';
  const pv = $('#prev'); pv.src = imgData; pv.style.display = imgData ? 'block' : 'none';
  $('#dlg').showModal();
}
/* Điền nhanh từ caption Instagram: lấy tên, giá, mô tả, link */
const IG_WALL_TXT = /tạo tài khoản hoặc|đăng nhập vào instagram|đăng nhập để xem|log ?in ?to instagram|sign ?in ?to instagram|sign ?up (?:for instagram|to see)/i;
function parseCaption(text){
  const out = {};
  // Khi IP Google bị Instagram chặn, nội dung lấy về là câu của trang đăng nhập, không phải caption
  if(IG_WALL_TXT.test(text) && !/["“]/.test(text)) return out;
  const url = text.match(/https?:\/\/[^\s]+/);
  if(url) out.link = url[0];
  let t = text.replace(/https?:\/\/[^\s]+/g, '').trim();
  // Bỏ phần đầu kiểu '500 likes, 2 comments - shop trên October 12, 2026: "' nếu có
  t = t.replace(/^[^"“\n]*?(?:likes?|lượt thích|comments?|bình luận)[^"“\n]*?:\s*["“]/i, '').replace(/["”]\.?\s*$/, '').trim();
  let m = t.match(/(\d+(?:[.,]\d+)?)\s*k\b/i);
  if(m) out.price = Math.round(parseFloat(m[1].replace(',', '.')) * 1000);
  else if((m = t.match(/(\d{1,3}(?:[.,]\d{3})+)\s*(?:đ|d|vnd)?/i))) out.price = parseInt(m[1].replace(/[.,]/g, ''), 10);
  const emo = /[\p{Extended_Pictographic}\u200d\ufe0f]+/gu;
  const lines = t.split(/\n/).map(l => l.trim()).filter(Boolean);
  const isPrice = l => /^(price|giá|gia)\b/i.test(l);
  const first = (lines.find(l => !isPrice(l)) || '');
  let name = first.split(emo)[0].split(/\s+size\b/i)[0].split(/\s*(?:=\)+|:\)+|><|\.{2,})/)[0].replace(/[,:;.\s]+$/, '').trim();
  if(name) out.name = name.charAt(0).toUpperCase() + name.slice(1);
  let desc = t.replace(emo, ' ').split(/\n/).map(l => l.trim()).filter(l => l && !isPrice(l)).join(' ');
  if(name) desc = desc.replace(name, '').trim();
  desc = desc.replace(/\s*>\s*<\s*/g, ' ').replace(/\s{2,}/g, ' ').trim();
  desc = desc.replace(/^[=:;)>< ]+/, '').trim();
  if(desc) out.desc = desc.charAt(0).toUpperCase() + desc.slice(1);
  return out;
}
function fillFrom(text){
  const r = parseCaption(text);
  if(r.name) $('#fName').value = r.name;
  if(r.price) $('#fPrice').value = r.price;
  if(r.desc) $('#fDesc').value = r.desc;
  if(r.link) $('#fLink').value = r.link;
  return Object.keys(r).length > 0;
}
$('#quickBtn').onclick = () => toast(fillFrom($('#fQuick').value) ? 'Đã điền, bạn kiểm tra lại rồi chọn ảnh nhé' : 'Không đọc được gì từ nội dung này');
const shrinkDataUrl = (src, maxPx) => new Promise(res => {
  const i = new Image();
  i.onload = () => { const k = Math.min(1, (maxPx||700)/Math.max(i.width, i.height)), c = document.createElement('canvas');
    c.width = Math.round(i.width*k); c.height = Math.round(i.height*k); c.getContext('2d').drawImage(i,0,0,c.width,c.height);
    res({ data: c.toDataURL('image/jpeg',.78), w: i.naturalWidth, h: i.naturalHeight }); };
  i.onerror = () => res(null);
  i.src = src;
});
$('#igBtn').onclick = async () => {
  const url = $('#fIgUrl').value.trim().split('?')[0];
  if(!/^https?:\/\/(www\.)?instagram\.com\//i.test(url)) return toast('Hãy dán link bài viết Instagram');
  const btn = $('#igBtn'); btn.disabled = true; toast('Đang lấy dữ liệu từ Instagram...');
  let msg = '';
  try{
    const r = await api('ig', {url}, true);
    if(!r.ok) throw new Error(r.error === 'Hành động không hợp lệ' ? 'Apps Script chưa là bản mới (cần Code.gs có hàm lấy link)' : r.error);
    // Code.gs v6 báo qua r.wall; bản cũ hơn thì caption là câu của trang đăng nhập
    const blocked = !!r.wall || IG_WALL_TXT.test(r.caption || '');
    const caption = blocked ? '' : (r.caption || '');
    $('#fQuick').value = caption;
    if(caption) fillFrom(caption + '\n' + url);
    $('#fLink').value = url;
    if(r.image){
      const s = await shrinkDataUrl(r.image, 1080);
      if(s){
        imgData = s.data; $('#prev').src = s.data; $('#prev').style.display = 'block';
        msg = r.via === 'og-image-crop'
          ? 'Instagram chặn bản gốc, tạm dùng ảnh cắt ' + s.w + '×' + s.h + '. Nên tải ảnh gốc lên tay'
          : 'Đã lấy ảnh gốc ' + s.w + '×' + s.h + 'px, đủ khung hình';
      }
    } else msg = 'Không lấy được ảnh';
    if(blocked) msg = (r.image ? 'Đã lấy được ảnh, nhưng ' : '') + 'caption bị trang đăng nhập che (IP Apps Script đang bị chặn) — chờ 15-30 phút thử lại, hoặc dán caption tay rồi bấm "Tự điền"';
  }catch(err){ msg = 'Không lấy được: ' + err.message; }
  btn.disabled = false;
  toast(msg + '. Kiểm tra lại rồi lưu nhé');
};
$('#addBtn').onclick = () => openForm();
$('#cancel').onclick = () => $('#dlg').close();

/* Nén ảnh về tối đa 700px để file JSON và bộ nhớ không quá nặng */
$('#fImg').onchange = e => {
  const f = e.target.files[0]; if(!f) return;
  const img = new Image(), url = URL.createObjectURL(f);
  img.onload = () => {
    const k = Math.min(1, 700/Math.max(img.width,img.height)), c = document.createElement('canvas');
    c.width = Math.round(img.width*k); c.height = Math.round(img.height*k);
    c.getContext('2d').drawImage(img,0,0,c.width,c.height);
    imgData = c.toDataURL('image/jpeg',.78); URL.revokeObjectURL(url);
    $('#prev').src = imgData; $('#prev').style.display='block';
  };
  img.onerror = () => toast('Không đọc được ảnh này');
  img.src = url;
};
$('#form').onsubmit = async e => {
  e.preventDefault();
  const d = {name:$('#fName').value.trim(), price:Math.max(0,+$('#fPrice').value||0), desc:$('#fDesc').value.trim(), link:safeUrl($('#fLink').value.trim()), img:imgData};
  let stale = false;
  if(API_URL){
    const btn = e.submitter, isNew = imgData.startsWith('data:');
    if(btn) btn.disabled = true;
    toast('Đang lưu lên Google...');
    try{
      const old = editId ? products.find(x=>x.id===editId) : null;
      const r = await api('save', {product:{...d, id:editId||Date.now(), emoji:old?.emoji||'🧸', img:isNew?(old?.img||''):imgData}, image:isNew?imgData:''}, true);
      if(!r.ok) throw new Error(r.error);
      if(d.link && !('link' in r.product)) stale = true;
      const k = products.findIndex(x=>x.id===r.product.id);
      if(k>=0) products[k] = r.product; else products.push(r.product);
    }catch(err){ if(btn) btn.disabled = false; return toast('Lỗi: ' + err.message); }
    if(btn) btn.disabled = false;
  } else {
    if(editId){ const p = products.find(x=>x.id===editId); Object.assign(p,d); }
    else products.push({id:Date.now(), emoji:'🧸', ...d});
    save();
  }
  $('#dlg').close(); render();
  if(stale) alert(OLD_MSG); else toast('Đã lưu sản phẩm');
};
$('#grid').onclick = async e => {
  const ed = e.target.closest('[data-edit]'), dl = e.target.closest('[data-del]');
  if(ed) openForm(products.find(p=>p.id===+ed.dataset.edit));
  if(dl && confirm('Xóa sản phẩm này?')){
    const id = +dl.dataset.del;
    if(API_URL){ try{ const r = await api('delete', {id}, true); if(!r.ok) throw new Error(r.error); }catch(err){ return toast('Lỗi: ' + err.message); } }
    products = products.filter(p=>p.id!==id); save(); render(); toast('Đã xóa');
  }
};

/* Dữ liệu có cấu trúc để Google và mạng xã hội đọc ra giá + tình trạng từng món */
function jsonLd(){
  const s = document.createElement('script'); s.type = 'application/ld+json';
  s.textContent = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'ItemList', name: 'uadochoiha – sản phẩm đang bán',
    itemListElement: products.slice(0, 60).map((p, i) => ({
      '@type': 'ListItem', position: i + 1, name: p.name, description: p.desc || '',
      url: location.href, image: p.img ? thumb(p.img, 800) : undefined,
      offers: {'@type': 'Offer', price: p.price, priceCurrency: 'VND',
        availability: isOff(p) ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock'}
    }))
  });
  document.head.appendChild(s);
}
$('#expBtn').onclick = () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(products,null,1)],{type:'application/json'}));
  a.download = 'products.json'; a.click(); URL.revokeObjectURL(a.href);
  toast('Đã xuất. Hãy đưa products.json lên GitHub để mọi người thấy');
};
$('#impBtn').onclick = () => $('#impFile').click();
$('#impFile').onchange = e => {
  const f = e.target.files[0]; if(!f) return;
  f.text().then(t => {const d = JSON.parse(t); if(!Array.isArray(d)) throw 0; products = d; save(); render(); toast('Đã nhập '+d.length+' sản phẩm')})
   .catch(() => toast('File JSON không hợp lệ'));
  e.target.value = '';
};

$('#ctIg').href = INSTAGRAM_URL;
$('#ctTh').href = THREADS_URL;
const noteDlg = $('#noteDlg');
['#noteBtn', '#noteBtn2'].forEach(id => $(id).onclick = () => noteDlg.showModal());
$('#noteClose').onclick = () => noteDlg.close();
noteDlg.addEventListener('click', e => {
  const r = noteDlg.getBoundingClientRect();
  if(e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) noteDlg.close();
});
$('#ftIg').href = INSTAGRAM_URL;
$('#ftTh').href = THREADS_URL;
$('#yr').textContent = new Date().getFullYear();

/* Bộ đếm lượt truy cập (cần Apps Script): mỗi lần mở web trong một phiên tính 1 lượt, admin đang đăng nhập không tính */
async function countVisit(){
  if(!API_URL) return;
  try{
    let url = API_URL + '?action=stats';
    if(!sessionStorage.getItem('uadochoiha_v') && !admin){
      let isNew = true;
      try{ isNew = !localStorage.getItem('uadochoiha_vid'); localStorage.setItem('uadochoiha_vid', '1'); }catch(e){}
      sessionStorage.setItem('uadochoiha_v', '1');
      url = API_URL + '?action=visit&n=' + (isNew ? 1 : 0);
    }
    const r = await (await fetch(url)).json();
    if(!r.ok) return;
    const el = $('#visitCount'), n = Number(r.visits) || 0;
    $('#visitBox').hidden = false;
    if(document.documentElement.classList.contains('fx-off') || n < 2){ el.textContent = n.toLocaleString('vi-VN'); return; }
    const t0 = performance.now();
    (function tick(t){ const k = Math.min(1, (t - t0) / 1200); el.textContent = Math.round(n * (1 - Math.pow(1 - k, 3))).toLocaleString('vi-VN'); if(k < 1) requestAnimationFrame(tick); })(t0);
  }catch(e){}
}
countVisit();
$('#toTop').onclick = () => scrollTo({top:0, behavior:'smooth'});
if(API_URL){ $('#expBtn').hidden = true; $('#impBtn').hidden = true; }
$('#igRow').hidden = !API_URL;
/* Đổi câu chữ trong lúc chờ tải dữ liệu, tự dừng khi danh sách hiện ra */
const loadMsgs = ['Đang gọi hàng về cho bạn...', 'Chờ xíu nhen 🫧', 'Đang thổi bong bóng nè...', 'Sắp xong rồi nè ☘️'];
let loadIdx = 0;
const loadTimer = setInterval(() => { const m = $('#loadMsg'); if(!m) return clearInterval(loadTimer); m.textContent = loadMsgs[++loadIdx % loadMsgs.length]; }, 1700);
load().then(() => { renderCats(); render(); jsonLd(); });
