# ITSS-NATEAT (Convenient Grocery & Meal Planning System)

Hệ thống hỗ trợ người dùng quản lý việc đi chợ, theo dõi thực phẩm trong tủ lạnh và lên thực đơn hàng ngày.

## Tính năng chính

- Quản lý tài khoản người dùng (đăng ký, đăng nhập, cập nhật thông tin)
- Quản lý nhóm gia đình (chia sẻ danh sách mua sắm, kế hoạch bữa ăn)
- Quản lý danh sách mua sắm (tạo, chia sẻ, theo dõi trạng thái)
- Quản lý thực phẩm trong tủ lạnh (nhập, theo dõi hạn dùng, nhắc nhở)
- Lên kế hoạch bữa ăn (theo ngày/tuần, gợi ý thực đơn)
- Gợi ý món ăn thông minh dựa trên nguyên liệu có sẵn
- Tìm kiếm công thức nấu ăn
- Báo cáo và thống kê tiêu dùng

## Tech Stack

| Thành phần | Công nghệ |
|-----------|-----------|
| Backend | Node.js (Express) - RESTful API |
| Frontend Web | React.js |
| Frontend Mobile | React Native (tương lai) |
| Database | MySQL |
| Cache | Redis |
| Authentication | JWT + bcrypt |
| Notifications | Firebase Cloud Messaging |
| Language | Tiếng Việt (mặc định), Tiếng Anh |

## Cài đặt và Chạy

### Yêu cầu hệ thống
- Node.js >= 18.x
- MySQL >= 8.0
- Redis >= 6.0

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Cấu hình database, JWT secret trong .env
npm run migrate   # Tạo database schema
npm run seed      # (Tùy chọn) Thêm dữ liệu mẫu
npm run dev       # Chạy server ở port 3000
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
# Cấu hình API URL trong .env
npm start        # Chạy dev server ở port 3000 (hoặc 3001)
```

## Cấu trúc thư mục

```
ITSS-NATEAT/
├── backend/              # Node.js API server
│   ├── src/
│   │   ├── controllers/ # Request handlers
│   │   ├── models/      # Database models
│   │   ├── routes/      # API routes
│   │   ├── middleware/  # Auth, validation
│   │   └── utils/       # Helper functions
│   ├── migrations/      # Database migrations
│   └── tests/
├── frontend/            # React.js web app
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/    # API calls
│   │   └── utils/
│   └── public/
├── docs/                # Tài liệu dự án
│   ├── database-schema.md
│   ├── api-spec.md
│   ├── srs/
│   └── NATEAT_Design_Spec.md
└── README.md
```

## Tài liệu tham khảo

- [Software Requirements Specification (SRS)](docs/srs/SRS_DiChoTienLoi.md)
- [Database Schema Design](docs/database-schema.md)
- [REST API Specification](docs/api-spec.md)
- [NATEAT Landing Page Design](docs/NATEAT_Design_Spec.md)
- [Topic Overview](docs/topic.md)

## Nhóm phát triển

Nhóm 27

- Nguyễn Mạnh Hùng – 20235735
- Nguyễn Thiệu Thành – 20235832
- Nguyễn Xuân Thành Hưng – 20235743
- Nguyễn Quốc Cường – 20235667
- Nguyễn Đức Nam Khánh – 20235755
