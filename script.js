/* ===== CẤU HÌNH (sửa ở đây) ===== */
const ADMIN_PASSWORD = 'admin123';              // Chỉ dùng khi API_URL để trống. Khi dùng Google, mật khẩu đặt trong Apps Script
const INSTAGRAM_URL  = 'https://www.instagram.com/uadochoiha';   // Đổi thành trang Instagram của shop
const THREADS_URL    = 'https://www.threads.com/@uadochoiha';     // Đổi thành trang Threads của shop
const PER_PAGE       = 8;                       // Số sản phẩm mỗi trang
const API_URL        = 'https://script.google.com/macros/s/AKfycbwk7rG37bPO5h6j8KE0j626zJwgjhn6aGbXt2CwnRnL8ETbgkZF0oqMmrivcjnpq0mw/exec';  // Dán URL Web App của Google Apps Script vào đây. Để trống = lưu trong trình duyệt
const STORE_KEY      = 'uadochoiha_products_v1';

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
    (isNaN(mn) || p.price >= mn) && (isNaN(mx) || p.price <= mx));
  const s = $('#sort').value;
  if(s==='asc') list.sort((a,b)=>a.price-b.price);
  else if(s==='desc') list.sort((a,b)=>b.price-a.price);
  else if(s==='name') list.sort((a,b)=>a.name.localeCompare(b.name,'vi'));
  else list.sort((a,b)=>b.id-a.id);
  return list;
}
function render(){
  const list = filtered(), pages = Math.max(1, Math.ceil(list.length/PER_PAGE));
  if(page > pages) page = pages;
  const slice = list.slice((page-1)*PER_PAGE, page*PER_PAGE);
  $('#count').textContent = list.length + ' món đáng yêu';
  $('#grid').innerHTML = slice.length ? slice.map(p => `
   <article class="card">
    <div class="pic">${p.img ? `<img src="${esc(p.img)}" alt="${esc(p.name)}" loading="lazy">` : esc(p.emoji||'🧸')}</div>
    <div class="info">
     <h3>${esc(p.name)}</h3>
     <p class="desc">${esc(p.desc)}</p>
     <div class="price">${vnd(p.price)}</div>
     ${safeUrl(p.link) ? `<a class="more" href="${esc(safeUrl(p.link))}" target="_blank" rel="noopener noreferrer">Xem bài viết</a>` : ''}
     ${admin ? `<div class="row"><button class="btn" data-edit="${p.id}">Sửa</button><button class="btn g" data-del="${p.id}">Xóa</button></div>` : ''}
    </div>
   </article>`).join('')
   : '<div class="empty">Chưa có món nào khớp. Thử đổi từ khóa, khoảng giá hoặc màu khác nhé!</div>';
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
$('#reset').onclick = () => {['q','min','max'].forEach(i=>$('#'+i).value='');$('#sort').value='new';page=1;render()};
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
function parseCaption(text){
  const out = {};
  const url = text.match(/https?:\/\/[^\s]+/);
  if(url) out.link = url[0];
  let t = text.replace(/https?:\/\/[^\s]+/g, '').trim();
  let m = t.match(/(\d+(?:[.,]\d+)?)\s*k\b/i);
  if(m) out.price = Math.round(parseFloat(m[1].replace(',', '.')) * 1000);
  else if((m = t.match(/(\d{1,3}(?:[.,]\d{3})+)\s*(?:đ|d|vnd)?/i))) out.price = parseInt(m[1].replace(/[.,]/g, ''), 10);
  const emo = /[\p{Extended_Pictographic}\u200d\ufe0f]+/gu;
  const lines = t.split(/\n/).map(l => l.trim()).filter(Boolean);
  const isPrice = l => /^(price|giá|gia)\b/i.test(l);
  const first = (lines.find(l => !isPrice(l)) || '');
  let name = first.split(emo)[0].split(/\s+size\b/i)[0].replace(/[,:;.\s]+$/, '').trim();
  if(name) out.name = name.charAt(0).toUpperCase() + name.slice(1);
  let desc = t.replace(emo, ' ').split(/\n/).map(l => l.trim()).filter(l => l && !isPrice(l)).join(' ');
  if(name) desc = desc.replace(name, '').trim();
  desc = desc.replace(/\s*>\s*<\s*/g, ' ').replace(/\s{2,}/g, ' ').trim();
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
const shrinkDataUrl = src => new Promise(res => {
  const i = new Image();
  i.onload = () => { const k = Math.min(1, 700/Math.max(i.width, i.height)), c = document.createElement('canvas');
    c.width = Math.round(i.width*k); c.height = Math.round(i.height*k); c.getContext('2d').drawImage(i,0,0,c.width,c.height); res(c.toDataURL('image/jpeg',.78)); };
  i.onerror = () => res('');
  i.src = src;
});
$('#igBtn').onclick = async () => {
  const url = $('#fIgUrl').value.trim().split('?')[0];
  if(!/^https?:\/\/(www\.)?instagram\.com\//i.test(url)) return toast('Hãy dán link bài viết Instagram');
  const btn = $('#igBtn'); btn.disabled = true; toast('Đang lấy dữ liệu từ Instagram...');
  try{
    const r = await api('ig', {url}, true);
    if(!r.ok) throw new Error(r.error === 'Hành động không hợp lệ' ? 'Apps Script chưa là bản mới (cần Code.gs có hàm lấy link)' : r.error);
    $('#fQuick').value = r.caption || '';
    fillFrom((r.caption || '') + '\n' + url);
    $('#fLink').value = url;
    if(r.image){ const small = await shrinkDataUrl(r.image); if(small){ imgData = small; $('#prev').src = small; $('#prev').style.display = 'block'; } }
    toast(r.image ? 'Đã lấy ảnh, tên, giá. Kiểm tra lại rồi lưu nhé' : 'Đã lấy caption, chưa lấy được ảnh. Hãy chọn ảnh tay');
  }catch(err){ toast('Không lấy được: ' + err.message + '. Hãy dán caption tay nhé'); }
  btn.disabled = false;
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
load().then(render);