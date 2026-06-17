import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ChevronLeft, Image as ImageIcon, X } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { buildApiUrl, buildStorageUrl } from '../config';

export default function DishForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  const fileInputRef = useRef(null);

  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    TenMonAn: '',
    MaDanhMuc: '',
    TrangThai: 'Đang bán',
    MoTa: '',
    DonGia: ''
  });
  
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [removeImage, setRemoveImage] = useState(false); // Dùng khi sửa món mà muốn xóa ảnh
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState({}); // Dùng object để lưu nhiều lỗi

  useEffect(() => {
    fetchCategories();
    if (isEditMode) {
      fetchDish();
    }
  }, [id]);

  const fetchCategories = async () => {
    try {
      // Gọi API danh mục hiện có
      const res = await fetch(buildApiUrl('/admin/categories?status=Đang bán'));
      const result = await res.json();
      if (result.success) {
        setCategories(result.data);
      }
    } catch (error) {
      console.error('Lỗi lấy danh mục:', error);
    }
  };

  const fetchDish = async () => {
    try {
      const res = await fetch(buildApiUrl(`/admin/dishes/${id}`));
      const result = await res.json();
      if (result.success) {
        const dish = result.data;
        setFormData({
          TenMonAn: dish.TenMonAn,
          MaDanhMuc: dish.MaDanhMuc,
          TrangThai: dish.TrangThai,
          MoTa: dish.MoTa || '',
          DonGia: Math.round(dish.DonGia) // Bỏ phần thập phân .00
        });
        if (dish.HinhAnh) {
          setImagePreview(buildStorageUrl(dish.HinhAnh));
        }
      } else {
        setError({ general: 'Không thể tải dữ liệu món ăn.' });
      }
    } catch (error) {
      console.error('Lỗi lấy món ăn:', error);
      setError({ general: 'Lỗi kết nối máy chủ.' });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Xóa lỗi field cụ thể khi user gõ
    if (error[name]) {
      setError(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        setError(prev => ({ ...prev, HinhAnh: 'Kích thước ảnh tối đa 4MB.' }));
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setRemoveImage(false);
      if (error.HinhAnh) setError(prev => ({ ...prev, HinhAnh: '' }));
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.TenMonAn.trim()) newErrors.TenMonAn = 'Tên món không được để trống.';
    if (!formData.MaDanhMuc) newErrors.MaDanhMuc = 'Vui lòng chọn danh mục.';
    if (!formData.DonGia || isNaN(formData.DonGia) || formData.DonGia < 0) newErrors.DonGia = 'Đơn giá không hợp lệ.';
    
    setError(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const url = isEditMode 
        ? buildApiUrl(`/admin/dishes/${id}`)
        : buildApiUrl('/admin/dishes');
      
      // Sử dụng FormData để gửi file
      const submitData = new FormData();
      submitData.append('TenMonAn', formData.TenMonAn);
      submitData.append('MaDanhMuc', formData.MaDanhMuc);
      submitData.append('TrangThai', formData.TrangThai);
      submitData.append('MoTa', formData.MoTa);
      submitData.append('DonGia', formData.DonGia);
      
      if (imageFile) {
        submitData.append('HinhAnh', imageFile);
      } else if (removeImage) {
        submitData.append('remove_image', 'true');
      }

      // Ở edit mode, dùng _method=PUT vì form multipart/form-data trong PHP thường ko nhận PUT trực tiếp
      if (isEditMode) {
        submitData.append('_method', 'PUT');
      }

      const res = await fetch(url, {
        method: 'POST', // Luôn dùng POST, backend sẽ nhận _method=PUT nếu là sửa
        headers: {
          'Accept': 'application/json'
        },
        body: submitData
      });
      const result = await res.json();
      
      if (result.success) {
        navigate('/admin/dishes');
      } else {
        setError({ general: result.message || 'Lỗi khi lưu món ăn.' });
      }
    } catch (error) {
      console.error('Lỗi lưu món ăn:', error);
      setError({ general: 'Lỗi kết nối máy chủ.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-stone-100 text-gray-800 font-sans overflow-hidden">
      <Sidebar />

      <div className="flex-1 overflow-y-auto p-8 relative">
        <div className="max-w-5xl mx-auto">
          
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold mb-1">{isEditMode ? 'Sửa món' : 'Thêm món'}</h1>
              <div className="text-sm text-gray-500 font-medium">Thực đơn {'>'} Danh sách món {'>'} {isEditMode ? 'Sửa món' : 'Thêm món'}</div>
            </div>
            <button 
              onClick={() => navigate('/admin/dishes')}
              className="flex items-center gap-2 border border-gray-300 bg-white hover:bg-gray-50 px-4 py-2 rounded-lg font-medium transition-colors text-sm"
            >
              <ChevronLeft size={16} /> Quay lại danh sách
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-6">
            
            {/* Cột trái: Thông tin */}
            <div className="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm p-8">
              {error.general && (
                <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-medium">
                  {error.general}
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Tên món <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  name="TenMonAn"
                  value={formData.TenMonAn}
                  onChange={handleInputChange}
                  placeholder="Nhập tên món"
                  className={`w-full border rounded-lg px-4 py-2.5 text-sm outline-none transition-colors ${error.TenMonAn ? 'border-red-500 focus:border-red-500 bg-red-50' : 'border-gray-200 focus:border-red-500 bg-gray-50 focus:bg-white'}`}
                />
                {error.TenMonAn && <p className="text-red-500 text-xs mt-1.5 font-medium">{error.TenMonAn}</p>}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Danh mục <span className="text-red-500">*</span>
                </label>
                <select 
                  name="MaDanhMuc"
                  value={formData.MaDanhMuc}
                  onChange={handleInputChange}
                  className={`w-full border rounded-lg px-4 py-2.5 text-sm outline-none transition-colors appearance-none ${error.MaDanhMuc ? 'border-red-500 focus:border-red-500 bg-red-50' : 'border-gray-200 focus:border-red-500 bg-gray-50 focus:bg-white'}`}
                  style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right .5rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em` }}
                >
                  <option value="" disabled>Chọn danh mục</option>
                  {categories.map(cat => (
                    <option key={cat.MaDanhMuc} value={cat.MaDanhMuc}>{cat.TenDanhMuc}</option>
                  ))}
                </select>
                {error.MaDanhMuc && <p className="text-red-500 text-xs mt-1.5 font-medium">{error.MaDanhMuc}</p>}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Trạng thái <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-8">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input 
                        type="radio" 
                        name="TrangThai"
                        value="Đang bán"
                        checked={formData.TrangThai === 'Đang bán'}
                        onChange={handleInputChange}
                        className="peer appearance-none w-5 h-5 border-2 border-gray-300 rounded-full checked:border-red-600 transition-colors cursor-pointer"
                      />
                      <div className="absolute w-2.5 h-2.5 bg-red-600 rounded-full opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                    </div>
                    <span className="text-sm text-gray-700 group-hover:text-gray-900 font-medium">Đang bán</span>
                  </label>
                  
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input 
                        type="radio" 
                        name="TrangThai"
                        value="Ngưng bán"
                        checked={formData.TrangThai === 'Ngưng bán'}
                        onChange={handleInputChange}
                        className="peer appearance-none w-5 h-5 border-2 border-gray-300 rounded-full checked:border-red-600 transition-colors cursor-pointer"
                      />
                      <div className="absolute w-2.5 h-2.5 bg-red-600 rounded-full opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                    </div>
                    <span className="text-sm text-gray-700 group-hover:text-gray-900 font-medium">Ngưng bán</span>
                  </label>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Mô tả <span className="text-red-500">*</span>
                </label>
                <textarea 
                  name="MoTa"
                  value={formData.MoTa}
                  onChange={handleInputChange}
                  placeholder="Nhập mô tả món ăn"
                  rows="4"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-red-500 transition-colors bg-gray-50 focus:bg-white resize-none"
                ></textarea>
              </div>

              <div className="mb-8">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Đơn giá <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input 
                    type="number" 
                    name="DonGia"
                    value={formData.DonGia}
                    onChange={handleInputChange}
                    placeholder="Nhập đơn giá"
                    className={`w-full border rounded-lg px-4 py-2.5 pr-10 text-sm outline-none transition-colors ${error.DonGia ? 'border-red-500 focus:border-red-500 bg-red-50' : 'border-gray-200 focus:border-red-500 bg-gray-50 focus:bg-white'}`}
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-500 font-medium">
                    đ
                  </div>
                </div>
                {error.DonGia && <p className="text-red-500 text-xs mt-1.5 font-medium">{error.DonGia}</p>}
              </div>

              {/* Input ảnh ẩn */}
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/jpeg, image/png, image/jpg, image/webp"
                className="hidden"
              />

              {/* Khung nút chọn ảnh (Responsive cho mobile, nhưng ở desktop sẽ xài cột bên phải) */}
              <div className="mb-8 lg:hidden">
                 <label className="block text-sm font-bold text-gray-700 mb-2">Hình ảnh</label>
                 <div className="flex gap-2">
                   <button 
                     type="button" 
                     onClick={() => fileInputRef.current.click()}
                     className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                   >
                     Chọn ảnh
                   </button>
                   <span className="flex items-center text-sm text-gray-500">{imageFile ? imageFile.name : (imagePreview ? 'Đã có ảnh' : 'Chưa chọn file')}</span>
                 </div>
                 <div className="text-xs text-gray-400 mt-2">Định dạng: JPG, PNG hoặc WebP. Kích thước tối đa 4MB.</div>
                 {error.HinhAnh && <p className="text-red-500 text-xs mt-1.5 font-medium">{error.HinhAnh}</p>}
              </div>

              <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => navigate('/admin/dishes')}
                  className="px-6 py-2.5 border border-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? 'Đang xử lý...' : 'Lưu'}
                </button>
              </div>
            </div>

            {/* Cột phải: Preview ảnh */}
            <div className="w-full lg:w-80 shrink-0 hidden lg:block">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 sticky top-8">
                <label className="block text-sm font-bold text-gray-700 mb-4">
                  Ảnh món
                </label>
                
                <div className="aspect-square w-full rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center bg-gray-50 relative overflow-hidden mb-4 group cursor-pointer" onClick={() => fileInputRef.current.click()}>
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white font-medium text-sm px-4 py-2 border border-white rounded-lg">Đổi ảnh</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <ImageIcon size={32} className="text-gray-300 mb-2" />
                      <span className="text-sm text-gray-500 font-medium">Chưa có ảnh</span>
                      <span className="text-xs text-gray-400 mt-1">Chọn ảnh để hiển thị</span>
                    </>
                  )}
                </div>

                {imagePreview && (
                  <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleRemoveImage(); }}
                    className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-red-600 border border-red-100 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <X size={16} /> Xóa ảnh
                  </button>
                )}
                
                {!imagePreview && (
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current.click()}
                    className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                  >
                    Chọn ảnh
                  </button>
                )}

                <div className="text-xs text-gray-400 mt-4 text-center">
                  Định dạng: JPG, PNG hoặc WebP. Kích thước tối đa 4MB.
                </div>
                {error.HinhAnh && <p className="text-red-500 text-xs mt-2 font-medium text-center">{error.HinhAnh}</p>}
              </div>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
