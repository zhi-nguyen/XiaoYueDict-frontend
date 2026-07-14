import rawRadicals from './radicals.json';

export interface Radical {
  id: number;
  radical: string;
  pinyin: string;
  english: string;
  strokeCount: number;
  hanViet: string;
}

// 214 tên Hán Việt tương ứng từ bộ 1 đến 214
const RADICAL_HAN_VIET: string[] = [
  "", // 0 (dummy)
  "Nhất", "Cổn", "Chủ", "Phiệt", "Ất", "Quyết", "Nhị", "Đầu", "Nhân", "Nhi",
  "Nhập", "Bát", "Quynh", "Mịch", "Băng", "Kỷ", "Khảm", "Đao", "Lực", "Bao",
  "Chủy", "Phương", "Hệ", "Thập", "Bốc", "Tiết", "Hán", "Tư", "Hựu", "Khẩu",
  "Vi", "Thổ", "Sĩ", "Truy", "Tuy", "Tịch", "Đại", "Nữ", "Tử", "Miên",
  "Thốn", "Tiểu", "Uông", "Thi", "Triệt", "Sơn", "Xuyên", "Công", "Kỷ", "Cân",
  "Can", "Yêu", "Nghiễm", "Dẫn", "Củng", "Dặc", "Cung", "Kệ", "Sam", "Xích",
  "Tâm", "Qua", "Hộ", "Thủ", "Chi", "Phộc", "Văn", "Đấu", "Cân", "Phương",
  "Vô", "Nhật", "Viết", "Nguyệt", "Mộc", "Khiếm", "Chỉ", "Đãi", "Thù", "Vô",
  "Tỷ", "Mao", "Thị", "Khí", "Thủy", "Hỏa", "Trảo", "Phụ", "Hào", "Tường",
  "Phiến", "Nha", "Ngưu", "Khuyển", "Huyền", "Ngọc", "Qua", "Ngõa", "Cam", "Sanh",
  "Dụng", "Điền", "Sơ", "Nạch", "Bát", "Bạch", "Bì", "Mãnh", "Mục", "Mâu",
  "Thất", "Thạch", "Thị", "Nhựu", "Hòa", "Huyệt", "Lập", "Trúc", "Mễ", "Mịch",
  "Phẫu", "Võng", "Dương", "Vũ", "Lão", "Nhi", "Lỗi", "Nhĩ", "Duật", "Nhục",
  "Thần", "Tự", "Chí", "Cối", "Thiệt", "Suyễn", "Chu", "Cấn", "Sắc", "Thảo",
  "Hô", "Trùng", "Huyết", "Hành", "Y", "Á", "Kiến", "Giác", "Ngôn", "Cốc",
  "Đậu", "Thỉ", "Trĩ", "Bối", "Xích", "Tẩu", "Túc", "Thân", "Xa", "Tân",
  "Thần", "Sái", "Ấp", "Dậu", "Lý", "Sơ", "Kim", "Trường", "Môn", "Phụ",
  "Lệ", "Chuy", "Vũ", "Thanh", "Phi", "Diện", "Cách", "Vi", "Cửu", "Âm",
  "Hiệt", "Phong", "Phi", "Thực", "Thủ", "Hương", "Mã", "Cốt", "Cao", "Bưu",
  "Đấu", "Sưởng", "Cách", "Quỷ", "Ngư", "Điểu", "Lổ", "Lộc", "Mạch", "Ma",
  "Hoàng", "Thử", "Hắc", "Chỉ", "Mẫn", "Đỉnh", "Cổ", "Thử", "Tị", "Tề",
  "Sỉ", "Long", "Quy", "Dược"
];

// Khai báo các bộ thủ biến thể hoặc tên viết tắt thường gặp
export const RADICAL_VARIANTS: Record<string, string> = {
  "亻": "Nhân đứng",
  "刂": "Đao đứng",
  "氵": "Chấm thủy",
  "灬": "Hỏa nằm",
  "扌": "Thủ gảy",
  "忄": "Tâm đứng",
  "讠": "Ngôn bên",
  "钅": "Kim bên",
  "纟": "Mịch bên",
  "艹": "Thảo đầu",
  "辶": "Quai xước",
  "阝": "Ấp/Phụ bên",
  "礻": "Thị bên",
  "衤": "Y bên",
  "饣": "Thực bên",
  "犭": "Khuyển bên"
};

export const RADICALS: Radical[] = rawRadicals.map((item: any) => {
  const name = RADICAL_HAN_VIET[item.id] || "";
  return {
    id: item.id,
    radical: item.radical,
    pinyin: item.pinyin,
    english: item.english,
    strokeCount: item.strokeCount,
    hanViet: name
  };
});

// Nhóm các bộ thủ theo số nét từ 1 đến 17
export const RADICALS_BY_STROKE: Record<number, Radical[]> = (() => {
  const groups: Record<number, Radical[]> = {};
  for (let i = 1; i <= 17; i++) {
    groups[i] = [];
  }
  
  RADICALS.forEach(rad => {
    if (groups[rad.strokeCount]) {
      groups[rad.strokeCount].push(rad);
    }
  });
  
  return groups;
})();
