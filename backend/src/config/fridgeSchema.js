/**
 * Schema Supabase tiếng Việt (đã inspect từ information_schema).
 */
module.exports = {
  tables: {
    item: 'chi_tiet_tu_lanh',
    fridge: 'tu_lanh',
    food: 'thuc_pham',
    category: 'danh_muc',
    unit: 'don_vi_tinh',
    family: 'gia_dinh',
    user: 'nguoi_dung',
  },
  columns: {
    itemId: 'chi_tiet_id',
    fridgeId: 'tu_lanh_id',
    foodId: 'thuc_pham_id',
    quantity: 'so_luong',
    expiry: 'ngay_het_han',
    importedAt: 'ngay_nhap',
    familyId: 'gia_dinh_id',
    userId: 'nguoi_dung_id',
    foodName: 'ten_thuc_pham',
    categoryId: 'danh_muc_id',
    unitId: 'don_vi_id',
    categoryName: 'ten_danh_muc',
    unitName: 'ten_don_vi',
    familyName: 'ten_gia_dinh',
    userName: 'ho_ten',
  },
  useSoftDelete: false,
  /** FE mock dùng family-1; DB dùng integer — tạo/lấy gia_dinh dev khi cần */
  defaultFamilyName: 'Gia đình NATEAT',
};
