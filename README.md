# ITSS-NATEAT (Convenient Grocery & Meal Planning System)

> **Hệ thống Quản lý Đi chợ Tiện lợi & Lên Kế hoạch Bữa ăn Gia đình**
> Một giải pháp toàn diện giúp quản lý tủ lạnh, đề xuất thực đơn thông minh, lập danh sách mua sắm và tối ưu hóa chi tiêu thực phẩm dành cho gia đình.

---

## 📌 Tổng quan dự án

**ITSS-NATEAT** là ứng dụng hỗ trợ người dùng và các gia đình tối ưu hóa việc quản lý thực phẩm hàng ngày. Bằng cách kết nối tủ lạnh thông minh, danh sách mua sắm dùng chung và kế hoạch bữa ăn dinh dưỡng, hệ thống giúp giảm thiểu tình trạng lãng phí thực phẩm, tiết kiệm thời gian đi chợ và tự động hóa việc theo dõi hạn sử dụng nguyên liệu.

### Thành viên nhóm phát triển (Nhóm 27 - Lớp ITSS)

| Họ và tên | MSSV | Vai trò / Nhiệm vụ chính |
|---|---|---|
| **Nguyễn Đức Nam Khánh** | 20235755 | Nhóm trưởng, Cấu hình hệ thống, Devops, CSDL |
| **Nguyễn Mạnh Hùng** | 20235735 | Fullstack Developer, Quản lý Tủ lạnh & Auth |
| **Nguyễn Thiệu Thành** | 20235832 | Frontend Developer, Quản lý Gia đình & Kế hoạch bữa ăn |
| **Nguyễn Xuân Thành Hưng** | 20235743 | Frontend Developer, Quản lý Mua sắm & Gợi ý công thức |
| **Nguyễn Quốc Cường** | 20235667 | Backend Developer, RESTful API & Tích hợp CSDL |

---

## ✨ Các tính năng chính

1. **Quản lý Tài khoản & Nhóm Gia đình (Family Management)**:
   - Đăng ký, đăng nhập bảo mật bằng cơ chế JWT (AccessToken & RefreshToken).
   - Tạo nhóm gia đình, sinh mã mời (Invite Code) để các thành viên khác tham gia.
   - Chia sẻ dữ liệu thời gian thực giữa các thành viên: dùng chung danh sách mua sắm, tủ lạnh và thực đơn tuần.

2. **Quản lý Tủ lạnh thông minh (Fridge Inventory)**:
   - Thêm mới, chỉnh sửa thông tin thực phẩm hiện có.
   - Phân loại vị trí lưu trữ cụ thể (Ngăn đông, ngăn mát, cánh tủ, tủ khô).
   - Theo dõi số lượng thực tế và hạn sử dụng của từng nguyên liệu.
   - Tự động gửi thông báo nhắc nhở khi thực phẩm sắp hết hạn (cận date).

3. **Quản lý Danh sách Mua sắm (Shopping List)**:
   - Tạo danh sách mua sắm nhanh chóng. Phân công thành viên chịu trách nhiệm đi chợ.
   - Đánh dấu các mặt hàng đã mua hoặc mua một phần.
   - **Đồng bộ tự động**: Khi hoàn thành danh sách mua sắm, hệ thống tự động cộng dồn số lượng thực phẩm đã mua vào Tủ lạnh gia đình.

4. **Gợi ý món ăn thông minh & Quản lý Công thức (Recipes)**:
   - Kho công thức nấu ăn phong phú, hỗ trợ tìm kiếm theo tên hoặc danh mục.
   - **Thuật toán gợi ý**: Tự động phân tích các nguyên liệu hiện có trong tủ lạnh để đề xuất các công thức nấu ăn phù hợp nhất, giảm thiểu tối đa thực phẩm dư thừa.
   - Cho phép người dùng tự đóng góp công thức cá nhân hoặc yêu cầu admin duyệt công thức công khai.

5. **Lên kế hoạch bữa ăn khoa học (Meal Planning)**:
   - Thiết lập thực đơn chi tiết theo ngày hoặc tuần (Bữa sáng, bữa trưa, bữa tối, bữa phụ).
   - Theo dõi trạng thái nấu nướng ("Đã nấu" / "Chưa nấu") để kiểm soát thực tế tiêu thụ.

6. **Thống kê & Báo cáo tiêu dùng (Statistics)**:
   - Biểu đồ trực quan hóa lượng thực phẩm tiêu thụ.
   - Báo cáo chi phí đi chợ theo tháng/tuần giúp cân đối tài chính gia đình.

---

## 🏗️ Kiến trúc & Công nghệ (Tech Stack)

Hệ thống được thiết kế theo mô hình **Client-Server** phân rã, kết nối trực tiếp đến Cloud Database:

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT TIER                          │
│                                                             │
│  frontend-user (React + Vite + TS)  - Cổng: 5173            │
│  frontend-admin (React + Vite + TS) - Cổng: 5174            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ HTTP/REST (Bearer JWT)
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                    APPLICATION TIER                         │
│                                                             │
│  backend (Node.js + Express.js)     - Cổng: 3000            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Connection Pool (pg - node-postgres)
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                       DATA TIER                             │
│                                                             │
│  Supabase PostgreSQL (Hosted Cloud Database)                │
└─────────────────────────────────────────────────────────────┘
```

### Chi tiết các công nghệ sử dụng:
* **Backend**: Node.js, Express.js, `pg` (node-postgres), JSON Web Token (JWT), `bcryptjs` (mã hóa mật khẩu), `nodemon` (hot-reload trong môi trường phát triển).
* **Frontend User & Admin**: React.js, Vite, TypeScript, Zustand (quản lý state toàn cục), Axios (kết nối API), Tailwind CSS & Shadcn/ui (giao diện người dùng hiện đại, responsive).
* **Database**: PostgreSQL lưu trữ trực tiếp trên nền tảng Supabase Cloud.
* **DevOps & Triển khai**: Docker, Docker Compose cho môi trường local; Cloudflare Workers (Wrangler) hỗ trợ triển khai nhanh frontend.

---

## 📂 Cấu trúc thư mục dự án

```
Convenient-Grocery-Shopping-System/
├── backend/                            # Mã nguồn API Server (Node.js Express)
│   ├── src/
│   │   ├── config/                     # Cấu hình kết nối DB & schema mapping
│   │   ├── controllers/                # Tiếp nhận request & điều phối service
│   │   ├── middleware/                 # Xác thực người dùng (Auth middleware)
│   │   ├── models/                     # Thực hiện các câu lệnh truy vấn SQL (Postgres)
│   │   ├── routes/                     # Định nghĩa API routes (Endpoints)
│   │   ├── services/                   # Xử lý logic nghiệp vụ chính
│   │   └── utils/                      # Các hàm trợ giúp (Helper functions)
│   ├── server.js                       # Điểm khởi chạy API Server chính
│   ├── Dockerfile                      # Cấu hình container hóa backend
│   └── .env.example                    # File mẫu cấu hình biến môi trường
│
├── frontend/                           # Thư mục chứa các ứng dụng frontend
│   ├── frontend-user/                  # SPA React dành cho Người dùng cuối
│   │   ├── src/
│   │   │   ├── app/                    # Routing & Providers chính
│   │   │   ├── components/             # Các UI components dùng chung (Shadcn/ui)
│   │   │   ├── layouts/                # Bố cục màn hình (Header, BottomNav)
│   │   │   └── modules/                # Chia nhỏ theo chức năng (auth, fridge, shopping, recipe...)
│   │   ├── Dockerfile                  # Cấu hình Nginx + Static Build cho User Client
│   │   └── nginx.conf                  # Cấu hình SPA routing cho Nginx
│   │
│   └── frontend-admin/                 # SPA React dành cho Quản trị viên (Admin)
│       ├── src/                        # Chứa các chức năng quản lý danh mục, món ăn
│       ├── Dockerfile                  # Cấu hình Nginx + Static Build cho Admin Client
│       └── nginx.conf                  # Cấu hình SPA routing cho Nginx
│
├── database/                           # Các script thiết lập cơ sở dữ liệu
│   └── supabase/
│       └── database-schema.md          # Đặc tả chi tiết cấu trúc bảng dữ liệu (PostgreSQL)
│
├── deploy/
│   └── docker/
│       └── docker-compose.yml          # Kịch bản Docker Compose chạy nhanh 3 services
│
├── docs/                               # Tài liệu đặc tả kỹ thuật dự án
│   ├── srs/
│   │   └── SRS_NATEAT.md               # Phần mềm Đặc tả Yêu cầu Hệ thống (SRS)
│   ├── api-spec.md                     # Đặc tả chi tiết danh sách REST APIs
│   ├── NATEAT_Design_Spec.md           # Tài liệu thiết kế Landing Page giao diện
│   └── topic.md                        # Giới thiệu đề tài môn học
│
├── package.json                        # Cấu hình Root NPM Workspaces
└── README.md                           # Tài liệu hướng dẫn chính này
```

---

## 🚀 Hướng dẫn Cài đặt & Chạy dự án

### Yêu cầu hệ thống trước khi cài đặt:
* **Node.js** >= 18.x (khuyên dùng bản LTS)
* **NPM** >= 9.x
* **Docker & Docker Compose** (nếu muốn triển khai bằng container)

---

### Cách 1: Chạy trực tiếp trên máy cục bộ (Local Development)

Nhờ cấu hình **NPM Workspaces** tại thư mục gốc, bạn không cần phải di chuyển thủ công (`cd`) vào từng thư mục con để cài đặt dependency hay chạy dev server.

#### Bước 1: Clone dự án và cài đặt dependencies
Mở Terminal tại thư mục gốc của dự án và chạy:
```bash
npm install
```
Lệnh này sẽ tự động phân tích và cài đặt tất cả các gói thư viện cần thiết cho cả 3 thành phần: `backend`, `frontend-user`, và `frontend-admin`.

#### Bước 2: Cấu hình biến môi trường (.env)
1. **Cấu hình Backend**:
   - Truy cập vào thư mục `backend/`
   - Tạo file `.env` từ file mẫu: `cp .env.example .env` (hoặc copy bằng tay trên Windows)
   - Chỉnh sửa các giá trị kết nối cơ sở dữ liệu và mã khóa JWT:
     ```env
     PORT=3000
     DATABASE_URL=postgresql://<username>:<password>@<host>:<port>/<dbname>
     JWT_SECRET=your-custom-jwt-secret
     JWT_SECRET_ACCESS=your-custom-access-secret
     JWT_SECRET_REFRESH=your-custom-refresh-secret
     DB_SSL=true
     DB_POOL_MAX=10
     ```

2. **Cấu hình Frontends**:
   - Tương tự, copy file `.env.example` thành `.env` trong cả hai thư mục:
     - `frontend/frontend-user/.env`
     - `frontend/frontend-admin/.env`
   - Cấu hình địa chỉ gọi API backend (mặc định trỏ về `http://localhost:3000/api`):
     ```env
     VITE_API_BASE_URL=http://localhost:3000/api
     VITE_SUPABASE_URL=https://your-supabase-url.supabase.co
     VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-public-key
     ```

#### Bước 3: Khởi chạy dự án bằng lệnh Workspace ở root
Tại thư mục gốc của dự án, bạn hãy mở các cửa sổ Terminal riêng biệt và chạy các lệnh tương ứng:

* **Chạy API Backend**:
  ```bash
  npm run dev:backend
  ```
  *(Server backend sẽ chạy tại cổng `http://localhost:3000`)*

* **Chạy App Người Dùng (User)**:
  ```bash
  npm run dev:user
  ```
  *(Truy cập qua trình duyệt tại: `http://localhost:5173`)*

* **Chạy Trang Quản Trị (Admin)**:
  ```bash
  npm run dev:admin
  ```
  *(Truy cập qua trình duyệt tại: `http://localhost:5174`)*

---

### Cách 2: Triển khai nhanh bằng Docker Compose (Khuyên dùng)

Dự án đã tích hợp đầy đủ cấu hình Docker cho cả 3 dịch vụ. Nginx được sử dụng làm reverse proxy để phân phối file tĩnh của React SPA một cách tối ưu.

#### Bước 1: Cấu hình biến môi trường
Trước khi chạy, hãy mở file [deploy/docker/docker-compose.yml](file:///c:/Users/KHANH/Documents/GitHub/Convenient-Grocery-Shopping-System/deploy/docker/docker-compose.yml) và kiểm tra lại biến môi trường `DATABASE_URL` trong mục cấu hình của service `backend` để đảm bảo kết nối đúng cơ sở dữ liệu Supabase của bạn.

#### Bước 2: Build và Khởi chạy Containers
Chạy lệnh duy nhất sau tại thư mục gốc của dự án:
```bash
docker compose -f deploy/docker/docker-compose.yml up --build
```

#### Bước 3: Truy cập hệ thống
Sau khi các container khởi động thành công, bạn có thể truy cập các địa chỉ sau:
* **Giao diện Người dùng (User)**: [http://localhost:5173](http://localhost:5173)
* **Giao diện Quản trị (Admin)**: [http://localhost:5174](http://localhost:5174)
* **Backend API Health Check**: [http://localhost:3000/health](http://localhost:3000/health)

Để dừng hệ thống, nhấn `Ctrl + C` hoặc chạy lệnh:
```bash
docker compose -f deploy/docker/docker-compose.yml down
```

---

## 📖 Tài liệu tham khảo dự án

Hệ thống tài liệu đầy đủ hỗ trợ quá trình nghiên cứu cấu trúc dự án:
* 📄 **Đặc tả Yêu cầu (SRS)**: [SRS_NATEAT.md](docs/srs/SRS_NATEAT.md) — Phân tích chi tiết usecase, sơ đồ luồng dữ liệu và giao diện.
* 🛡️ **Thiết kế Cơ sở dữ liệu**: [database-schema.md](database/supabase/database-schema.md) — Chi tiết 20 bảng cơ sở dữ liệu PostgreSQL kèm khóa ngoại và giải thích trường dữ liệu.
* 🔌 **Tài liệu API Endpoints**: [api-spec.md](docs/api-spec.md) — Chi tiết cấu trúc dữ liệu gửi lên và kết quả trả về của các API.
* 🎨 **Thiết kế Landing Page**: [NATEAT_Design_Spec.md](docs/NATEAT_Design_Spec.md) — Mô tả phong cách thiết kế UI/UX và các khối thông tin landing page.
* 🎯 **Tổng quan Đề tài**: [topic.md](docs/topic.md) — Giới thiệu mục tiêu ban đầu của hệ thống.
