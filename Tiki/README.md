# 🎁 Tiki Gift Code Automation

Script Node.js tự động nạp mã quà tặng vào tài khoản Tiki.vn sử dụng Puppeteer.

## ✨ Tính năng

- ✅ Đọc mã từ file `codes.txt` hoặc `data.csv`
- ✅ Chạy trình duyệt không headless để đăng nhập thủ công
- ✅ Tự động chọn nhà cung cấp (UrBox, Tiki, v.v.)
- ✅ Xử lý từng mã với delay an toàn (tránh spam)
- ✅ Ghi log chi tiết và báo cáo kết quả
- ✅ Xử lý lỗi thông minh, không dừng khi gặp mã lỗi

## 📋 Yêu cầu

- Node.js (phiên bản 14 trở lên)
- NPM hoặc Yarn

## 🚀 Cài đặt

### Bước 1: Cài đặt dependencies

```bash
npm install
```

### Bước 2: Chuẩn bị dữ liệu

#### Sử dụng file codes.txt (mặc định)

Mở file `codes.txt` và thêm mã của bạn, mỗi dòng một mã:

```
GIFT-CODE-001
GIFT-CODE-002
GIFT-CODE-003
```

#### Hoặc sử dụng file data.csv

Mở file `data.csv` và thêm dữ liệu theo định dạng:

```csv
code,description
GIFT-CODE-CSV-001,Mã quà tặng 1
GIFT-CODE-CSV-002,Mã quà tặng 2
```

Sau đó, cập nhật `config.json`:

```json
{
  "dataSource": "data.csv"
}
```

### Bước 3: Cấu hình

Chỉnh sửa file `config.json` theo nhu cầu:

```json
{
  "provider": "UrBox", // Nhà cung cấp: "UrBox", "Tiki", v.v.
  "delayBetweenCodes": 5000, // Thời gian delay giữa các mã (ms)
  "url": "https://tiki.vn/customer/reward?searchredirect=1",
  "inputSelector": "input[placeholder=\"Mã Phiếu quà tặng\"]",
  "submitButtonSelector": "button[type=\"submit\"]",
  "dataSource": "codes.txt" // File nguồn: "codes.txt" hoặc "data.csv"
}
```

## 💻 Sử dụng

### Chạy script

```bash
npm start
```

hoặc

```bash
node index.js
```

### Quy trình

1. **Script khởi động trình duyệt** → Trang Tiki sẽ mở ra
2. **Đăng nhập thủ công** → Đăng nhập vào tài khoản Tiki của bạn
3. **Nhấn Enter trong terminal** → Script sẽ bắt đầu nạp mã tự động
4. **Chờ đợi** → Script sẽ xử lý từng mã một
5. **Xem kết quả** → Kết quả sẽ được hiển thị trong terminal và lưu vào `log.txt`

## 📊 Kết quả

Sau khi hoàn thành, bạn sẽ thấy báo cáo tổng hợp:

```
=================================================
              📊 KẾT QUẢ TỔNG HỢP
=================================================
✓ Tổng số mã:        5
✓ Thành công:        4
✗ Thất bại:          1

❌ Danh sách mã lỗi:
   1. GIFT-CODE-003 - Mã không hợp lệ
=================================================
```

Chi tiết log cũng được lưu trong file `log.txt`.

## ⚙️ Tùy chỉnh nâng cao

### Thay đổi selector

Nếu Tiki thay đổi giao diện, bạn có thể cập nhật selector trong `config.json`:

```json
{
  "inputSelector": "input[placeholder=\"Mã Phiếu quà tặng\"]",
  "submitButtonSelector": "button[type=\"submit\"]"
}
```

### Điều chỉnh thời gian delay

Tăng/giảm thời gian delay để phù hợp:

```json
{
  "delayBetweenCodes": 5000 // 5 giây
}
```

### Thêm provider mới

Cập nhật tên provider trong `config.json`:

```json
{
  "provider": "TênProviderMới"
}
```

## 🔧 Xử lý lỗi

### Script không tìm thấy input selector

- Kiểm tra lại selector trong DevTools của trình duyệt
- Cập nhật `inputSelector` trong `config.json`

### Script bị treo

- Tăng thời gian `delayBetweenCodes`
- Kiểm tra kết nối internet
- Đăng nhập lại Tiki

### Mã không được nạp

- Kiểm tra mã có đúng định dạng không
- Thử nạp thủ công để xem lỗi của Tiki
- Xem chi tiết lỗi trong terminal hoặc `log.txt`

## 📝 Lưu ý

- ⚠️ **Anti-spam**: Script có delay 5 giây giữa các mã để tránh bị Tiki chặn
- ⚠️ **Đăng nhập thủ công**: Do Tiki có Captcha và xác thực 2FA, bạn cần đăng nhập thủ công
- ⚠️ **Sử dụng có trách nhiệm**: Chỉ sử dụng với mã hợp lệ của bạn

## 🔮 Tính năng tương lai

- [ ] Hỗ trợ đọc từ file Excel (.xlsx)
- [ ] Lưu trạng thái vào MongoDB
- [ ] Giao diện web để quản lý
- [ ] Hỗ trợ đa tài khoản
- [ ] Chạy theo lịch (cron job)

## 📄 License

MIT

## 👨‍💻 Tác giả

Script được phát triển để tự động hóa quá trình nạp mã quà tặng Tiki.

---

**Happy Coding! 🚀**
