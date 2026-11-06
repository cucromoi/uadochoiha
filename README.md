# uadochoiha 🧸

Website cửa hàng đồ chơi — trang giới thiệu, tìm kiếm và đặt hàng sản phẩm. Nhận order Taobao, chốt đơn qua inbox, ship toàn quốc.

> Website: https://cucromoi.github.io/uadochoiha/

## Tính năng

- **Danh sách sản phẩm** — tên, giá, mô tả, ảnh (hoặc emoji đại diện), link bài viết
- **Tìm kiếm & lọc** — tìm theo tên/mô tả (không phân biệt dấu tiếng Việt), lọc theo khoảng giá, sắp xếp theo giá / tên / thời gian
- **Phân trang** — 12 sản phẩm mỗi trang
- **Upload ảnh** — tự nén qua Canvas (tối đa 700px, JPEG ~78%) và lưu dạng Base64
- **Chế độ quản trị** — đăng nhập mật khẩu để thêm / sửa / xóa sản phẩm
- **Lưu trữ linh hoạt** — Google Apps Script (đồng bộ đám mây), file `products.json`, hoặc `localStorage`
- **Xuất dữ liệu** — xuất `products.json` để đẩy lên GitHub
- **Hiệu ứng vui** — emoji bay, nhũ lấp lánh theo con trỏ, confetti tim khi bấm, thẻ bật nhẹ

## Công nghệ

- HTML, CSS, JavaScript thuần — không framework, không build step
- Google Apps Script Web App (tùy chọn) làm backend lưu trữ
- Font và logo tùy chỉnh đi kèm trong repo

## Cấu trúc repo

```
uadochoiha/
├── index.html    # Giao diện chính
├── style.css     # Kiểu dáng, theme cửa hàng đồ chơi
├── script.js     # Logic: sản phẩm, tìm kiếm, phân trang, admin, lưu trữ
├── effects.js    # Hiệu ứng hình ảnh (confetti, sparkle, ...)
├── logo          # Hình logo
└── font          # Font tùy chỉnh
```

## Cấu hình

Trong `script.js`:

| Biến | Ý nghĩa |
|---|---|
| `API_URL` | URL Google Apps Script Web App (để trống nếu chỉ dùng `localStorage`) |
| `ADMIN_PASSWORD` | Mật khẩu quản trị khi không dùng API |
| Link Instagram / Threads | Mạng xã hội của shop |

Dữ liệu `localStorage` nằm dưới key `uadochoiha_products_v1`.

## Phân loại danh mục (từ khoá)

Danh mục không lưu trong dữ liệu sản phẩm mà **suy ra từ tên món hàng** (`CATS` và `catOf` trong `script.js`), nên shop chỉ cần đăng bài, không phải chọn nhóm tay.

Quy tắc đang chạy:

1. Lấy **6 từ đầu của tên**, sau khi bỏ emoji/dấu câu và cắt các prefix rác (`hàng off`, `chính hãng`, `tổng hợp`, `gom`, ...). **Không đọc mô tả** — mô tả toàn "phụ phí", "giá đã ff" và tên nhân vật, từng làm 115 món bị nhét nhầm vào Thú bông.
2. **Giữ nguyên dấu tiếng Việt**: `chó` ≠ `cho`, `bìa` ≠ `bia`, `kệ` ≠ `xe`. (Tìm kiếm thì vẫn bỏ dấu, khách gõ không dấu vẫn thấy.)
3. Từ khớp **trái nhất** thắng; cùng vị trí thì **cụm dài hơn** thắng — `hộp bút` trước `bút`, `khăn trải bàn` trước `kệ`, `gấu bông` trước `bông`.
4. Tên chỉ có nhân vật (`chiikawa gõ mõ`, `usagi ngái ngủ`) → Thú bông; không khớp gì → Khác.
5. Thứ tự từ trong mảng **không** quan trọng, bộ máy tự sắp theo độ dài giảm dần. Chỉ khi hai từ bằng độ dài và cùng khớp ở một vị trí thì nhóm ghi trước thắng.

Số liệu trên 406 món thật — 13 nhóm, 229 từ khoá: 121 từ thắng ít nhất một món, 16 từ luôn bị từ dài hơn che, 92 từ chưa từng khớp (phần lớn là từ để dành), 10 món đi nhờ tên nhân vật, 1 món "Khác" là bản ghi lỗi `#ERROR!`:

| Nhóm | Món | Từ đang thực sự gánh |
|---|---|---|
| Balo & túi | 62 | 10/16 |
| Văn phòng phẩm | 52 | 20/52 |
| Phụ kiện điện thoại | 55 | 5/16 |
| Quần áo & mang | 29 | 14/23 |
| Nhà cửa & decor | 27 | 10/15 |
| Móc khóa & charm | 26 | 4/9 |
| Đồ chơi & mô hình | 26 | 18/26 |
| Sticker & decal | 26 | 4/7 |
| Thú bông | 24 (14 theo từ + 10 theo tên nhân vật) | 5/8 |
| Trang sức & làm đẹp | 24 | 11/19 |
| Phụ kiện tóc | 24 | 7/13 |
| Đèn & gối & nệm | 17 | 7/9 |
| Cốc & bình & bàn ăn | 13 | 6/16 |

**Thêm từ khoá cho an toàn** (đợt hàng văn phòng phẩm sắp tới đã chừa sẵn `bút máy, bút bi, bút lông, bút nhớ dòng, highlighter, sổ còng, sổ tay, planner, journal, bìa kiếng, bìa lỗ, file, name card, stamp, mực, gôm, tẩy, compa, keo, thước kẻ, kẹp bướm, kẹp còng, paperclip, bút xóa`):

- Đã đo trên 406 món: 205 từ khóa cũ + 24 từ để dành ra đúng cùng một bảng phân loại, không món nào đổi nhóm (4 món có chứa một từ để dành nhưng từ trái nhất vẫn thắng). Thêm từ chỉ an toàn khi phép so trước/sau này vẫn bằng nhau.
- Thêm từ **cụ thể, có dấu, càng dài càng tốt**; tránh từ một âm tiết đã là tiếng thông dụng (`cho`, `ke`, `de`, `di`, `vi`, `lam`) vì bỏ dấu thì dính, giữ dấu vẫn dễ ăn nhầm.
- Từ mới nên được thử bằng cách chạy lại `catOf` trên nguyên danh sách hiện có và so số món từng nhóm **trước / sau**; chỉ số món của nhóm dự kiến được cộng thêm, các nhóm khác phải đứng nguyên.
- Đã biết là mong manh, cân nhắc kỹ trước khi dùng làm từ khoá đơn: `bông` (ăn cả "ốp couple chó con", "khăn lông"), `giấy` (ăn "giấy vệ sinh"), `card` (ăn "card holder" — đã phải chặn bằng cụm dài hơn), `note` (ăn "death note"), `ô`, `đế`, `kệ`, `đai`.

## Liên hệ

- Đặt hàng qua inbox Instagram / Threads (link trên trang chủ)
- Ship toàn quốc, thanh toán chuyển khoản

---

© 2026 uadochoiha · Made with 💜 by Trương Nhật Nam
