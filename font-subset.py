# Cắt SRN_CookieRun_Regular.ttf (6,7MB, nhét nguyên bộ Hangul+CJK) thành CookieRun-VN.woff2 ~68KB.
#   python font-subset.py            # cắt + báo dung lượng
#   python font-subset.py data.json  # kiểm thêm mọi ký tự trong dữ liệu món hàng đều còn glyph
# Cần: python -m pip install fonttools brotli
import os, sys, unicodedata
from fontTools.subset import main as pyftsubset
from fontTools.ttLib import TTFont

SRC, OUT = 'SRN_CookieRun_Regular.ttf', 'CookieRun-VN.woff2'
HERE = os.path.dirname(os.path.abspath(__file__))

# trang này chỉ cần chữ Latin có dấu tiếng Việt + dấu câu + ký hiệu tiền tệ
RANGES = [
    (0x0020, 0x007E),  # Latin cơ bản
    (0x00A0, 0x00FF),  # Latin-1
    (0x0100, 0x024F),  # Latin Extended A+B: ă â ê ô Ơ Ư đ và dấu thanh
    (0x0300, 0x036F),  # dấu kết hợp, phòng text gửi về dạng tổ hợp
    (0x1E00, 0x1EFF),  # Latin Extended Additional
    (0x2010, 0x201F),  # gạch nối, gạch dài, ngoặc kép
    (0x2026, 0x2027),  # …
    (0x2032, 0x2033),  # ′ ″
    (0x2039, 0x203A),  # ‹ ›
    (0x2044, 0x2044),  # ⁄
    (0x20AB, 0x20AB),  # ₫
    (0x2122, 0x2122),  # ™
    (0x2153, 0x215E),  # phân số ⅓ ½ …
    (0x02DA, 0x02DC),  # ˚ ˜
    (0x2190, 0x2193),  # →
    (0x2260, 0x2260),  # ≠
    (0x2500, 0x257F),  # ─ └ ├ (log trong Code.gs)
    (0x2600, 0x26FF),  # ★ ♀ ♂ ♡
]
KEEP = {u for a, b in RANGES for u in range(a, b + 1)}

src, out = os.path.join(HERE, SRC), os.path.join(HERE, OUT)
cmap = set(TTFont(src).getBestCmap().keys())
pyftsubset([src, '--output-file=' + out,
            '--unicodes=' + ','.join('%04X' % u for u in sorted(KEEP)),
            '--layout-features=*', '--name-IDs=*', '--notdef-outline', '--no-hinting'])
print('%s: %d glyph -> %s: %d glyph' % (SRC, len(cmap), OUT, len(set(TTFont(out).getBestCmap()))))
print('%9d bytes  ->  %7d bytes (%.1f%%)' % (os.path.getsize(src), os.path.getsize(out),
                                             100 * os.path.getsize(out) / os.path.getsize(src)))

# ký tự trang thật dùng mà font gốc có, nhưng tập cắt lại bỏ -> phải mở range thêm
used = set()
for f in ['index.html', 'script.js', 'style.css', 'effects.js', 'README.md', 'Code.gs']:
    p = os.path.join(HERE, f)
    if os.path.exists(p):
        used |= {ord(c) for c in open(p, encoding='utf8').read()}
if len(sys.argv) > 1:
    import json
    for p in json.load(open(sys.argv[1], encoding='utf8'))['products']:
        for k in ('name', 'desc'):
            used |= {ord(c) for c in str(p.get(k) or '')}
used = {u for u in used if 0x20 <= u <= 0x2B00 and not unicodedata.category(chr(u)).startswith('C')}
sub = set(TTFont(out).getBestCmap())
lost = sorted(u for u in used if u in cmap and u not in sub)
print('còn thiếu so với chữ dùng thật:', ''.join(chr(u) for u in lost) or 'không thiếu ký tự nào')
