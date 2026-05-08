

**TRƯỜNG ĐẠI HỌC BÁCH KHOA HÀ NỘI**

*Viện Công nghệ thông tin và Truyền thông*

**Tài liệu đặc tả yêu cầu phần mềm**

***(Software Requirement Specification – SRS)***

Phiên bản 1.0

**HỆ THỐNG ĐI CHỢ TIỆN LỢI**

*(Convenient Grocery & Meal Planning System)*

Môn: Phân tích và Thiết kế Hệ thống

Nhóm: 27

Nguyễn Mạnh Hùng – 20235735

Nguyễn Thiệu Thành – 20235832

Nguyễn Xuân Thành Hưng – 20235743

Nguyễn Quốc Cường – 20235667

Nguyễn Đức Nam Khánh – 20235755

*Hà Nội, tháng ... năm ...*

# **1\. Giới thiệu**

## **1.1 Mục đích**

Tài liệu này cung cấp đặc tả yêu cầu phần mềm (SRS) chi tiết cho Hệ thống Đi Chợ Tiện Lợi (Convenient Grocery & Meal Planning System). Tài liệu mô tả đầy đủ mục đích, phạm vi, các tính năng chức năng và phi chức năng, cũng như các quy trình nghiệp vụ của hệ thống.

Tài liệu này dành cho các bên liên quan bao gồm: nhóm phát triển phần mềm, kiểm thử viên, quản lý dự án, và khách hàng – những người nội trợ, thành viên gia đình có nhu cầu quản lý thực phẩm và lên kế hoạch bữa ăn hàng ngày.

## **1.2 Phạm vi**

Hệ thống Đi Chợ Tiện Lợi được thiết kế nhằm hỗ trợ người dùng trong việc lập kế hoạch mua sắm, quản lý thực phẩm trong tủ lạnh và lên thực đơn hàng ngày. Mục tiêu của hệ thống là giúp người dùng duy trì thói quen tiêu dùng hiệu quả, giảm thiểu lãng phí thực phẩm và đảm bảo dinh dưỡng hợp lý.

Hệ thống cung cấp các công cụ quản lý danh sách mua sắm, theo dõi hạn sử dụng thực phẩm, đề xuất món ăn từ nguyên liệu sẵn có, cũng như hỗ trợ xây dựng kế hoạch bữa ăn theo tuần. Ngoài ra, hệ thống cho phép các thành viên trong gia đình chia sẻ thông tin mua sắm và phân công nhiệm vụ, giúp tối ưu hóa quá trình đi chợ và sử dụng thực phẩm.

Các chức năng chính của hệ thống bao gồm:

* Quản lý tài khoản người dùng (đăng ký, đăng nhập, cập nhật thông tin).

* Quản lý nhóm gia đình (tạo nhóm, thêm/xóa thành viên, chia sẻ dữ liệu).

* Quản lý danh sách mua sắm (tạo, chỉnh sửa, chia sẻ và theo dõi trạng thái mua sắm).

* Quản lý thực phẩm trong tủ lạnh (nhập, theo dõi hạn dùng, phân loại).

* Lên kế hoạch bữa ăn (tạo thực đơn theo ngày/tuần, gợi ý dựa trên nguyên liệu sẵn có).

* Gợi ý món ăn thông minh dựa trên thực phẩm có sẵn trong tủ lạnh.

* Tìm kiếm công thức nấu ăn theo nguyên liệu.

Hệ thống được thiết kế để phục vụ nhiều nhóm đối tượng sử dụng, bao gồm người nội trợ, thành viên gia đình, và quản trị viên hệ thống.

## **1.3 Từ điển thuật ngữ**

| Thuật ngữ / Từ viết tắt | Giải thích |
| ----- | ----- |
| User / Người dùng | Người đã đăng ký và đăng nhập vào hệ thống. Có thể là người nội trợ hoặc thành viên gia đình. |
| Quản trị viên (Admin) | Tài khoản có quyền quản lý toàn bộ người dùng và dữ liệu hệ thống. |
| Tủ lạnh (Kho thực phẩm) | Kho lưu trữ thông tin về các thực phẩm hiện có của người dùng trong hệ thống. |
| Danh sách mua sắm | Danh sách các mặt hàng thực phẩm cần mua, được tạo và quản lý bởi người dùng. |
| Nhóm gia đình | Nhóm người dùng được tạo để chia sẻ danh sách mua sắm và kế hoạch bữa ăn với nhau. |
| Kế hoạch bữa ăn | Thực đơn được lên kế hoạch theo ngày hoặc tuần, bao gồm danh sách các món ăn sẽ nấu. |
| Công thức nấu ăn | Hướng dẫn chi tiết về nguyên liệu và cách chế biến một món ăn cụ thể. |
| HSD | Hạn sử dụng – ngày hết hạn của một loại thực phẩm. |
| SRS | Software Requirements Specification – Tài liệu đặc tả yêu cầu phần mềm. |
| UC | Use Case – Kịch bản sử dụng, mô tả một chức năng cụ thể của hệ thống. |

# **2\. Mô tả tổng quan**

## **2.1 Các tác nhân**

Hệ thống có hai nhóm tác nhân chính:

Người dùng (User): Là người đã đăng ký tài khoản và đăng nhập thành công vào hệ thống. Bao gồm người nội trợ và các thành viên gia đình. Người dùng có thể thực hiện đầy đủ các chức năng nghiệp vụ của hệ thống.

Quản trị viên (Admin): Là tài khoản đặc biệt có quyền quản lý toàn bộ tài khoản người dùng và dữ liệu hệ thống. Quản trị viên có thể tạo, chỉnh sửa, xóa tài khoản; quản lý danh mục dữ liệu (loại thực phẩm, đơn vị tính, công thức nấu ăn); kiểm soát nội dung và theo dõi hiệu suất hệ thống.

## **2.2 Biểu đồ use case tổng quan**

Biểu đồ use case tổng quan mô tả các chức năng chính mà mỗi tác nhân có thể thực hiện trong hệ thống. Người dùng (User) tương tác với 6 nhóm chức năng: Quản lý tài khoản, Quản lý nhóm, Quản lý danh sách mua sắm, Quản lý tủ lạnh, Lên kế hoạch bữa ăn và Tìm kiếm công thức nấu ăn. Quản trị viên (Quản trị viên) có quyền truy cập vào các chức năng: Quản lý tài khoản user và Quản lý dữ liệu hệ thống.

![][image1]

## **2.3 Biểu đồ use case phân rã**

### **2.3.1 Phân rã use case "Quản lý tài khoản"**

Use case Quản lý tài khoản bao gồm các use case con: Đăng ký, Đăng nhập, Đăng xuất, Cập nhật thông tin, Xem thông tin tài khoản, Thay đổi mật khẩu.

![][image2]

### **2.3.2 Phân rã use case "Quản lý nhóm"**

Use case Quản lý nhóm bao gồm các use case con: Tạo nhóm, Thêm thành viên, Rời nhóm.

![][image3]

### **2.3.3 Phân rã use case "Quản lý danh sách mua sắm"**

Use case Quản lý danh sách mua sắm bao gồm các use case con: Tạo danh sách mua sắm, Xem danh sách mua sắm, Thêm/xóa mục thực phẩm, Chia sẻ danh sách, Cập nhật trạng thái mua hàng.

![][image4]

### **2.3.4 Phân rã use case "Quản lý tủ lạnh"**

Use case Quản lý tủ lạnh bao gồm các use case con: Xem thực phẩm trong tủ lạnh, Thêm/Cập nhật thực phẩm, Sử dụng thực phẩm (Xóa), Phân loại thực phẩm, Tìm kiếm thực phẩm.

![][image5]

### **2.3.5 Phân rã use case "Lên kế hoạch bữa ăn"**

Use case Lên kế hoạch bữa ăn bao gồm các use case con: Tạo danh sách thực phẩm tuần/ngày, Sửa danh sách thực phẩm, Chia sẻ danh sách, Lưu công thức yêu thích.

![][image6]

## **2.4 Quy trình nghiệp vụ**

Trong hệ thống này, có 4 quy trình nghiệp vụ chính: Quy trình quản lý danh sách mua sắm, Quy trình quản lý thực phẩm trong tủ lạnh, Quy trình gợi ý món ăn và Quy trình lên kế hoạch bữa ăn. Các quy trình này được mô tả chi tiết dưới dạng bảng luồng hoạt động trong các mục con sau.

### **2.4.1 Quy trình quản lý danh sách mua sắm**

Người dùng bắt đầu bằng cách tạo danh sách mua sắm và nhập thông tin thực phẩm cần mua. Hệ thống lưu danh sách và kiểm tra xem người dùng có nhóm gia đình không. Nếu có, hệ thống tự động chia sẻ danh sách tới các thành viên. Các thành viên xem, xác nhận và cập nhật trạng thái mua hàng. Sau khi mua xong, hệ thống cập nhật tồn kho vào tủ lạnh.

![][image7]

### **2.4.2 Quy trình quản lý thực phẩm trong tủ lạnh**

Người dùng mở chức năng Quản lý tủ lạnh và chọn thao tác cần thực hiện. Hệ thống hỗ trợ 4 luồng chính: Tìm kiếm/lọc thực phẩm, Thêm mới thực phẩm, Cập nhật/Xóa thực phẩm, và Thoát. Mỗi thao tác đều có bước validate dữ liệu và xác nhận từ người dùng trước khi lưu vào database.

![][image8]

### **2.4.3 Quy trình gợi ý món ăn**

Người dùng kích hoạt tính năng gợi ý món ăn. Hệ thống kiểm tra thực phẩm hiện có trong tủ lạnh, tìm kiếm công thức phù hợp và hiển thị danh sách món ăn gợi ý. Người dùng chọn món ăn, hệ thống kiểm tra nguyên liệu còn thiếu và hiển thị danh sách bổ sung nếu cần. Sau khi nấu, người dùng xác nhận lượng nguyên liệu đã dùng để hệ thống cập nhật tủ lạnh.

![][image9]

### **2.4.4 Quy trình lên kế hoạch bữa ăn**

Người dùng đăng nhập và chọn chức năng lập kế hoạch bữa ăn, chọn chế độ theo ngày hoặc tuần. Hệ thống kiểm tra thực phẩm trong tủ lạnh, đề xuất thực đơn dựa trên nguyên liệu có sẵn và hiển thị kế hoạch đề xuất. Người dùng có thể tùy chỉnh thực đơn theo sở thích. Hệ thống kiểm tra nguyên liệu còn thiếu, tự động tạo danh sách bổ sung và lưu kế hoạch bữa ăn vào lịch.

![][image10]

# **3\. Đặc tả các chức năng**

Chi tiết về các use case được đưa ra trong phần 2 được đặc tả trong các phần dưới đây.

## **3.1 Đặc tả use case UC001 "Đăng ký"**

| Mã Use case | UC001 | Tên Use case | Đăng ký |
| :---: | ----- | :---: | :---- |
| **Tác nhân** | Người dùng (chưa có tài khoản) |  |  |
| **Tiền điều kiện** | Không |  |  |
| **Luồng sự kiện chính (Thành công)** |  **STT** **Thực hiện bởi** **Hành động** 1\. Người dùng Chọn chức năng Đăng ký 2\. Hệ thống Hiển thị giao diện đăng ký 3\. Người dùng Nhập các thông tin cá nhân (mô tả phía dưới \*) 4\. Người dùng Nhấn nút Đăng ký 5\. Hệ thống Kiểm tra các trường bắt buộc đã được nhập chưa 6\. Hệ thống Kiểm tra định dạng email hợp lệ 7\. Hệ thống Kiểm tra mật khẩu xác nhận trùng với mật khẩu 8\. Hệ thống Kiểm tra mật khẩu đảm bảo độ an toàn 9\. Hệ thống Lưu thông tin tài khoản và thông báo đăng ký thành công  |  |  |
| **Luồng sự kiện thay thế** |  **STT** **Thực hiện bởi** **Hành động** 6a. Hệ thống Thông báo lỗi: Cần nhập các trường bắt buộc nếu nhập thiếu 7a. Hệ thống Thông báo lỗi: Địa chỉ email không hợp lệ 8a. Hệ thống Thông báo lỗi: Mật khẩu xác nhận không trùng với mật khẩu 9a. Hệ thống Thông báo lỗi: Email đã tồn tại trong hệ thống  |  |  |
| **Hậu điều kiện** | Tài khoản mới được tạo thành công. Người dùng có thể đăng nhập. |  |  |

**\* Dữ liệu đầu vào:**

| STT | Trường dữ liệu | Mô tả | Bắt buộc? | Điều kiện hợp lệ | Ví dụ |
| :---: | ----- | ----- | :---: | ----- | ----- |
| 1\. | Họ tên | Họ và tên đầy đủ của người dùng | Có | Không để trống | Nguyễn Văn A |
| 2\. | Email | Địa chỉ email dùng để đăng nhập | Có | Định dạng email hợp lệ, duy nhất trong hệ thống | nguyenvana@gmail.com |
| 3\. | Mật khẩu | Mật khẩu đăng nhập | Có | Ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt | Abc@1234 |
| 4\. | Xác nhận mật khẩu | Nhập lại mật khẩu để xác nhận | Có | Trùng với trường Mật khẩu | Abc@1234 |
| 5\. | Số điện thoại | Số điện thoại liên hệ | Không | Chỉ gồm số, dấu cách, dấu chấm hoặc dấu gạch ngang | 0912.345.678 |

## **3.2 Đặc tả use case UC002 "Đăng nhập"**

| Mã Use case | UC002 | Tên Use case | Đăng nhập |
| :---: | ----- | :---: | :---- |
| **Tác nhân** | Người dùng (đã có tài khoản) |  |  |
| **Tiền điều kiện** | Không |  |  |
| **Luồng sự kiện chính (Thành công)** |  **STT** **Thực hiện bởi** **Hành động** 1\. Người dùng Chọn chức năng Đăng nhập 2\. Hệ thống Hiển thị giao diện đăng nhập 3\. Người dùng Nhập email và mật khẩu 4\. Người dùng Nhấn nút Đăng nhập 5\. Hệ thống Kiểm tra các trường bắt buộc đã được nhập 6\. Hệ thống Kiểm tra email và mật khẩu có hợp lệ trong hệ thống 7\. Hệ thống Tạo phiên làm việc và chuyển đến trang chủ  |  |  |
| **Luồng sự kiện thay thế** |  **STT** **Thực hiện bởi** **Hành động** 5a. Hệ thống Thông báo lỗi: Cần nhập đủ email và mật khẩu 6a. Hệ thống Thông báo lỗi: Email và/hoặc mật khẩu không đúng 6b. Hệ thống Thông báo lỗi: Tài khoản bị khóa, liên hệ quản trị viên  |  |  |
| **Hậu điều kiện** | Người dùng đăng nhập thành công, hệ thống tạo phiên làm việc. |  |  |

## **3.3 Đặc tả use case UC003 "Quản lý tủ lạnh \- Thêm thực phẩm"**

| Mã Use case | UC003 | Tên Use case | Thêm thực phẩm vào tủ lạnh |
| :---: | ----- | :---: | :---- |
| **Tác nhân** | Người dùng (đã đăng nhập) |  |  |
| **Tiền điều kiện** | Người dùng đã đăng nhập thành công vào hệ thống |  |  |
| **Luồng sự kiện chính (Thành công)** |  **STT** **Thực hiện bởi** **Hành động** 1\. Người dùng Mở chức năng Quản lý tủ lạnh 2\. Hệ thống Hiển thị danh sách thực phẩm hiện có trong tủ lạnh 3\. Người dùng Chọn Thêm mới thực phẩm 4\. Hệ thống Hiển thị form nhập thông tin thực phẩm 5\. Người dùng Điền thông tin thực phẩm (mô tả phía dưới \*) và nhấn Lưu 6\. Hệ thống Kiểm tra tính hợp lệ của dữ liệu (Validate) 7\. Hệ thống Lưu thông tin vào cơ sở dữ liệu 8\. Hệ thống Cập nhật danh sách hiển thị và thông báo thêm thành công  |  |  |
| **Luồng sự kiện thay thế** |  **STT** **Thực hiện bởi** **Hành động** 6a. Hệ thống Thông báo lỗi: Trường bắt buộc chưa được nhập đầy đủ 6b. Hệ thống Thông báo lỗi: Ngày hết hạn không hợp lệ (trước ngày hiện tại) 7a. Hệ thống Thông báo lỗi: Không thể lưu, lỗi kết nối cơ sở dữ liệu  |  |  |
| **Hậu điều kiện** | Thực phẩm được thêm thành công vào tủ lạnh. |  |  |

**\* Dữ liệu đầu vào:**

| STT | Trường dữ liệu | Mô tả | Bắt buộc? | Điều kiện hợp lệ | Ví dụ |
| :---: | ----- | ----- | :---: | ----- | ----- |
| 1\. | Tên thực phẩm | Tên của thực phẩm cần lưu trữ | Có | Không để trống | Thịt bò |
| 2\. | Số lượng | Khối lượng hoặc số lượng thực phẩm | Có | Số dương | 500 |
| 3\. | Đơn vị | Đơn vị tính (gram, kg, cái, ...) | Có | Chọn từ danh sách | gram |
| 4\. | Ngày hết hạn (HSD) | Ngày hết hạn sử dụng của thực phẩm | Có | Ngày hợp lệ, từ ngày hiện tại trở đi | 15/06/2026 |
| 5\. | Danh mục | Phân loại thực phẩm | Có | Chọn từ danh sách: Thịt cá, Rau củ, Đồ khô, Sữa,... | Thịt cá |
| 6\. | Vị trí lưu trữ | Vị trí trong tủ lạnh | Không | Tùy chọn: Ngăn đông, Ngăn mát, Cánh tủ | Ngăn đông |

## **3.4 Đặc tả use case UC004 "Quản lý danh sách mua sắm \- Tạo danh sách"**

| Mã Use case | UC004 | Tên Use case | Tạo danh sách mua sắm |
| :---: | ----- | :---: | :---- |
| **Tác nhân** | Người dùng (đã đăng nhập) |  |  |
| **Tiền điều kiện** | Người dùng đã đăng nhập thành công vào hệ thống |  |  |
| **Luồng sự kiện chính (Thành công)** |  **STT** **Thực hiện bởi** **Hành động** 1\. Người dùng Chọn chức năng Tạo danh sách mua sắm 2\. Người dùng Chọn kiểu danh sách: theo ngày hoặc theo tuần 3\. Người dùng Nhập tên và số lượng từng thực phẩm cần mua 4\. Người dùng Phân loại mặt hàng theo danh mục (rau củ, thịt cá, đồ khô,...) 5\. Hệ thống Lưu danh sách mua sắm 6\. Hệ thống Kiểm tra nhóm gia đình của người dùng 7\. Hệ thống \[Có nhóm gia đình\] Chia sẻ danh sách cho các thành viên 8\. Người dùng Xem và xác nhận / từ chối nhiệm vụ mua hàng  |  |  |
| **Luồng sự kiện thay thế** |  **STT** **Thực hiện bởi** **Hành động** 5a. Hệ thống Thông báo lỗi: Danh sách không có thực phẩm nào, vui lòng thêm ít nhất 1 mặt hàng 7a. Hệ thống \[Không có nhóm gia đình\] Bỏ qua bước chia sẻ, chỉ người tạo có thể quản lý  |  |  |
| **Hậu điều kiện** | Danh sách mua sắm được tạo thành công và chia sẻ với nhóm (nếu có). |  |  |

**\* Dữ liệu đầu vào:**

| STT | Trường dữ liệu | Mô tả | Bắt buộc? | Điều kiện hợp lệ | Ví dụ |
| :---: | ----- | ----- | :---: | ----- | ----- |
| 1\. | Kiểu danh sách | Phân loại theo thời gian | Có | Chọn: Theo ngày / Theo tuần | Theo tuần |
| 2\. | Tên thực phẩm | Tên mặt hàng cần mua | Có | Không để trống | Cà chua |
| 3\. | Số lượng | Số lượng cần mua | Có | Số dương | 1 |
| 4\. | Đơn vị | Đơn vị tính | Có | kg, gram, cái, bó,... | kg |
| 5\. | Danh mục | Loại thực phẩm | Có | Chọn từ danh sách: Rau củ, Thịt cá, Đồ khô,... | Rau củ |

## **3.5 Đặc tả use case UC005 "Lên kế hoạch bữa ăn"**

| Mã Use case | UC005 | Tên Use case | Lên kế hoạch bữa ăn |
| :---: | ----- | :---: | :---- |
| **Tác nhân** | Người dùng (đã đăng nhập) |  |  |
| **Tiền điều kiện** | Người dùng đã đăng nhập. Tủ lạnh đã có ít nhất một số thực phẩm. |  |  |
| **Luồng sự kiện chính (Thành công)** |  **STT** **Thực hiện bởi** **Hành động** 1\. Người dùng Chọn chức năng Lập kế hoạch bữa ăn 2\. Người dùng Chọn chế độ lập kế hoạch: theo ngày hoặc theo tuần 3\. Hệ thống Kiểm tra thực phẩm hiện có trong tủ lạnh 4\. Hệ thống Đề xuất thực đơn dựa trên nguyên liệu có sẵn 5\. Hệ thống Hiển thị kế hoạch bữa ăn đề xuất 6\. Người dùng Xem và xác nhận thực đơn (hoặc tùy chỉnh theo sở thích) 7\. Hệ thống Kiểm tra nguyên liệu còn thiếu trong tủ lạnh 8\. Hệ thống \[Không đủ\] Tự động tạo danh sách nguyên liệu cần bổ sung 9\. Người dùng Xác nhận nguyên liệu còn thiếu 10\. Hệ thống Lưu kế hoạch bữa ăn vào lịch và thiết lập thông báo  |  |  |
| **Luồng sự kiện thay thế** |  **STT** **Thực hiện bởi** **Hành động** 6a. Người dùng Tùy chỉnh thực đơn: thay đổi món ăn, thêm/xóa bữa, chọn từ công thức yêu thích 7a. Hệ thống \[Đủ nguyên liệu\] Bỏ qua bước tạo danh sách bổ sung, lưu kế hoạch trực tiếp  |  |  |
| **Hậu điều kiện** | Kế hoạch bữa ăn được lưu vào lịch. Hệ thống thông báo nhắc nhở khi đến giờ nấu ăn. |  |  |

## **3.6 Đặc tả use case UC006 "Gợi ý món ăn"**

| Mã Use case | UC006 | Tên Use case | Gợi ý món ăn |
| :---: | ----- | :---: | :---- |
| **Tác nhân** | Người dùng (đã đăng nhập) |  |  |
| **Tiền điều kiện** | Người dùng đã đăng nhập. Tủ lạnh đã có ít nhất một thực phẩm. |  |  |
| **Luồng sự kiện chính (Thành công)** |  **STT** **Thực hiện bởi** **Hành động** 1\. Người dùng Chọn tính năng gợi ý món ăn 2\. Hệ thống Kiểm tra thực phẩm hiện có trong tủ lạnh 3\. Hệ thống Tìm kiếm công thức nấu ăn phù hợp với nguyên liệu 4\. Hệ thống Hiển thị danh sách món ăn gợi ý 5\. Người dùng Chọn một món ăn từ danh sách gợi ý 6\. Hệ thống Hiển thị công thức nấu ăn và hướng dẫn chế biến chi tiết 7\. Hệ thống Kiểm tra xem có nguyên liệu nào còn thiếu không 8\. Người dùng Nấu ăn và xác nhận lượng nguyên liệu đã sử dụng 9\. Hệ thống Cập nhật lại số lượng nguyên liệu trong tủ lạnh  |  |  |
| **Luồng sự kiện thay thế** |  **STT** **Thực hiện bởi** **Hành động** 3a. Hệ thống Thông báo: Không có món ăn nào phù hợp với nguyên liệu hiện tại 7a. Hệ thống \[Có thiếu\] Hiển thị danh sách nguyên liệu cần bổ sung. Người dùng có thể xem gợi ý mua thêm hoặc chọn món ăn khác  |  |  |
| **Hậu điều kiện** | Tủ lạnh được cập nhật số lượng nguyên liệu sau khi nấu ăn. |  |  |

# **4\. Các yêu cầu khác**

## **4.1 Chức năng (Functionality)**

Các yêu cầu về chức năng chung áp dụng cho toàn bộ hệ thống:

* Tất cả các thao tác liên quan đến cơ sở dữ liệu (thêm, sửa, xóa, truy vấn) đều phải xử lý ngoại lệ và thông báo lỗi rõ ràng khi có sự cố kết nối hoặc lỗi dữ liệu.

* Mọi chức năng của hệ thống yêu cầu người dùng đã đăng nhập thành công. Người chưa đăng nhập chỉ có thể truy cập các trang đăng ký và đăng nhập.

* Hệ thống tự động gửi thông báo nhắc nhở khi thực phẩm trong tủ lạnh sắp hết hạn (trước 3 ngày), khi đến giờ nấu theo kế hoạch bữa ăn.

* Dữ liệu được phân quyền theo vai trò: Người dùng chỉ truy cập dữ liệu của mình và nhóm mình tham gia; Quản trị viên có quyền truy cập toàn bộ dữ liệu hệ thống.

* Định dạng hiển thị chung: Font Times New Roman hoặc Arial, cỡ 14; số căn phải, chữ căn trái; nền trắng, chữ đen.

## **4.2 Tính dễ dùng (Usability)**

Các yêu cầu về giao diện và trải nghiệm người dùng:

* Giao diện thân thiện, trực quan, phù hợp với người dùng phổ thông không có kiến thức kỹ thuật.

* Hỗ trợ giao diện ứng dụng di động (Mobile App) tương thích với iOS và Android ( trong tương lai ), đồng thời có phiên bản Web App.

* Tất cả các thông báo lỗi phải rõ ràng, chỉ rõ trường dữ liệu lỗi và hướng dẫn cách sửa.

* Thao tác tạo danh sách mua sắm không quá 3 bước chính.

* Hỗ trợ tìm kiếm và lọc nhanh thực phẩm trong tủ lạnh theo tên hoặc danh mục.

* Cho phép thêm thực phẩm bằng cách quét mã vạch (tính năng mở rộng tương lai).

## **4.3 Hiệu năng (Performance)**

* Thời gian phản hồi của các chức năng thông thường (xem danh sách, tìm kiếm) không vượt quá 2 giây.

* Hệ thống hỗ trợ tối thiểu 100 người dùng truy cập đồng thời mà không bị gián đoạn.

* Thời gian tải trang không vượt quá 3 giây với kết nối 4G thông thường.

* Chức năng gợi ý món ăn và tìm kiếm công thức phải trả về kết quả trong vòng 3 giây.

## **4.4 Tính tin cậy (Reliability)**

* Hệ thống đảm bảo độ sẵn sàng (availability) tối thiểu 99% thời gian trong một tháng.

* Dữ liệu người dùng được sao lưu tự động mỗi ngày.

* Hệ thống có cơ chế phục hồi dữ liệu khi xảy ra sự cố (disaster recovery).

* Mọi giao dịch cơ sở dữ liệu phải đảm bảo tính ACID (Atomicity, Consistency, Isolation, Durability).

## **4.5 Bảo mật (Security)**

* Mật khẩu người dùng phải được mã hóa bằng thuật toán bcrypt hoặc tương đương trước khi lưu vào cơ sở dữ liệu.

* Toàn bộ giao tiếp giữa client và server phải sử dụng giao thức HTTPS/TLS.

* Áp dụng cơ chế xác thực JWT (JSON Web Token) cho phiên làm việc người dùng.

* Thông tin cá nhân của người dùng được bảo vệ, không chia sẻ với bên thứ ba.

* Hệ thống khóa tài khoản sau 5 lần đăng nhập sai liên tiếp và gửi thông báo cho người dùng.

* Áp dụng Input Validation và Sanitization để chống tấn công SQL Injection và XSS.

## **4.6 Tính dễ bảo trì (Maintainability)**

* Mã nguồn tuân thủ các chuẩn lập trình và có đầy đủ comment/documentation.

* Kiến trúc hệ thống theo mô hình MVC (Model-View-Controller) hoặc tương đương để dễ bảo trì và mở rộng.

* Hệ thống hỗ trợ cấu hình thông qua file config, không hardcode các tham số quan trọng.

* Sử dụng CI/CD pipeline để tự động kiểm thử và triển khai khi có cập nhật mới.

## **4.7 Yêu cầu kỹ thuật**

Các yêu cầu về công nghệ và môi trường kỹ thuật:

* Backend: Node.js. Hỗ trợ RESTful API.

* Frontend Web: React.js. Frontend Mobile: React Native.

* Cơ sở dữ liệu: MySQL cho dữ liệu quan hệ; Redis cho caching.

* Hệ thống thông báo: Firebase Cloud Messaging (FCM) cho push notification trên mobile.

* Hỗ trợ đa ngôn ngữ: Tiếng Việt (mặc định) và Tiếng Anh.

* Tương thích với các trình duyệt phổ biến: Chrome, Firefox, Safari, Edge (phiên bản mới nhất).

*\--- Hết tài liệu SRS \---*