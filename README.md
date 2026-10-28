# uadochoiha 🧸

Website cửa hàng đồ chơi — trang giới thiệu, tìm kiếm và đặt hàng sản phẩm. Nhận order Taobao, chốt đơn qua inbox, ship toàn quốc.

> Demo: https://cucromoi.github.io/uadochoiha/ *(nếu bật GitHub Pages)*

## Tính năng

- **Danh sách sản phẩm** — tên, giá, mô tả, ảnh (hoặc emoji đại diện), link bài viết
- **Tìm kiếm & lọc** — tìm theo tên/mô tả (không phân biệt dấu tiếng Việt), lọc theo khoảng giá, sắp xếp theo giá / tên / thời gian
- **Phân trang** — 8 sản phẩm mỗi trang
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

## Liên hệ

- Đặt hàng qua inbox Instagram / Threads (link trên trang chủ)
- Ship toàn quốc, thanh toán chuyển khoản

---

© 2026 uadochoiha · Made with 💜 by Trương Nhật Nam
