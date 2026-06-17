import { buildApiUrl } from '../config';

const BASE_URL = buildApiUrl('/customer');

/**
 * Lấy danh sách danh mục đang hoạt động
 */
export const fetchCategories = async () => {
  const res = await fetch(`${BASE_URL}/categories`);
  if (!res.ok) throw new Error('Không lấy được danh mục');
  return res.json();
};

/**
 * Lấy danh sách món ăn (có thể lọc theo danh mục)
 */
export const fetchDishes = async (maDanhMuc = null) => {
  const url = maDanhMuc
    ? `${BASE_URL}/dishes?maDanhMuc=${maDanhMuc}`
    : `${BASE_URL}/dishes`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Không lấy được thực đơn');
  return res.json();
};

/**
 * Kiểm tra thông tin bàn ăn
 */
export const fetchTable = async (maBan) => {
  const res = await fetch(`${BASE_URL}/table/${maBan}`);
  if (!res.ok) throw new Error('Bàn không tồn tại');
  return res.json();
};

/**
 * Gửi đơn hàng từ khách hàng
 */
export const placeOrder = async (orderData) => {
  const res = await fetch(`${BASE_URL}/order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(orderData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Có lỗi xảy ra khi đặt hàng');
  return data;
};
