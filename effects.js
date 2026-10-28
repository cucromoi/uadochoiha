/* Hiệu ứng cho uadochoiha. Tắt tự động nếu người dùng bật 'giảm chuyển động'. */
(function () {
  const $ = s => document.querySelector(s);

  // Bật/tắt hiệu ứng. Mặc định bật; nếu thiết bị đang bật 'giảm chuyển động' thì mặc định tắt
  // (khách vẫn tự bật được bằng nút ở góc phải). Lựa chọn được nhớ lại.
  const KEY = 'uadochoiha_fx';
  const saved = (() => { try { return localStorage.getItem(KEY); } catch (e) { return null; } })();
  let on = saved !== null ? saved === '1' : !matchMedia('(prefers-reduced-motion: reduce)').matches;
  const btn = document.createElement('button');
  btn.className = 'fx-toggle'; btn.type = 'button';
  function paint() {
    document.documentElement.classList.toggle('fx-off', !on);
    btn.setAttribute('aria-pressed', on);
    btn.textContent = on ? '✨ Hiệu ứng: bật' : 'Hiệu ứng: tắt';
  }
  btn.onclick = () => { on = !on; try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) {} paint(); };
  document.body.appendChild(btn);
  paint();

  // 1. Chữ logo rơi xuống từng chữ, rê chuột vào thì lắc
  const logo = $('.logo');
  if (logo && logo.firstChild && logo.firstChild.nodeType === 3) {
    const f = document.createDocumentFragment();
    [...logo.firstChild.textContent].forEach((c, i) => {
      const sp = document.createElement('span');
      sp.className = 'ch'; sp.style.setProperty('--k', i); sp.textContent = c;
      f.appendChild(sp);
    });
    logo.replaceChild(f, logo.firstChild);
  }

  // 2. Biểu tượng dễ thương bay lơ lửng ở nền
  const box = document.createElement('div');
  box.className = 'floaties'; box.setAttribute('aria-hidden', 'true');
  const em = ['🫧', '✨', '🫧', '💗', '☁️', '🫧', '🐾', '☘️', '⭐'];
  const n = innerWidth < 700 ? 8 : 14;
  for (let i = 0; i < n; i++) {
    const s = document.createElement('span');
    s.textContent = em[i % em.length];
    s.style.cssText = `left:${Math.random() * 100}%;font-size:${16 + Math.random() * 22}px;` +
      `animation-duration:${14 + Math.random() * 14}s;animation-delay:${-Math.random() * 20}s;` +
      `--dx:${(Math.random() - .5) * 160}px;--rot:${(Math.random() - .5) * 120}deg`;
    box.appendChild(s);
  }
  document.body.prepend(box);

  // 3. Thẻ sản phẩm nảy lên lần lượt mỗi khi danh sách đổi
  const grid = $('#grid');
  if (grid) {
    const tag = () => grid.querySelectorAll('.card').forEach((c, i) => c.style.setProperty('--i', i));
    new MutationObserver(tag).observe(grid, { childList: true });
    tag();
  }

  // 4. Lấp lánh theo con trỏ chuột, 5. Tim bắn ra khi bấm vào sản phẩm
  const marks = ['✨', '💗', '⭐', '🫧'];
  function spawn(x, y, ch, dx, dy) {
    const s = document.createElement('span');
    s.className = 'spark'; s.textContent = ch;
    s.style.cssText = `left:${x}px;top:${y}px;--x:${dx}px;--y:${dy}px;--rot:${(Math.random() - .5) * 120}deg;font-size:${12 + Math.random() * 10}px`;
    document.body.appendChild(s);
    s.addEventListener('animationend', () => s.remove());
  }
  let last = 0;
  addEventListener('pointermove', e => {
    if (!on || e.pointerType !== 'mouse') return;
    const t = performance.now();
    if (t - last < 70) return;
    last = t;
    spawn(e.clientX, e.clientY, marks[Math.random() * marks.length | 0], (Math.random() - .5) * 30, 20 + Math.random() * 20);
  });
  document.addEventListener('click', e => {
    if (!on || !e.target.closest('.card') || e.target.closest('button')) return;
    for (let i = 0; i < 7; i++) {
      const a = (Math.PI * 2 * i) / 7;
      spawn(e.clientX, e.clientY, '💗', Math.cos(a) * 60, Math.sin(a) * 60);
    }
  });
})();
