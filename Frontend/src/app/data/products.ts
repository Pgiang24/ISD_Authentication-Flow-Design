export interface ProductVariant {
  weight: string;
  price: number;
  stock: number;
}

export interface ComboItem {
  id: string;
  name: string;
  description: string;
  price: number;
  weight: string;
  image: string;  // ← thêm mới
}

export interface Product {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  image: string;
  images: string[];
  category: "pork" | "buffalo" | "poultry" | "sausage";
  basePrice: number;
  variants: ProductVariant[];
  tags: string[];
  rating: number;
  reviews: number;
  preparationTime: string;
  certifications: string[];
  featured: boolean;
  isCombo?: boolean;
  comboItems?: ComboItem[];
}

export const PRODUCTS: Product[] = [
  {
    id: "p1",
    name: "Thịt trâu gác bếp",
    description: "Thịt trâu gác bếp là đặc sản Tây Bắc, được tẩm ướp gia vị rồi hun khói trên bếp củi, tạo hương thơm đặc trưng, vị đậm đà và dai ngọt hấp dẫn.",
    longDescription: "Thịt trâu gác bếp là đặc sản vùng núi Tây Bắc, được làm từ thịt trâu tươi tẩm ướp gia vị như mắc khén, hạt dổi, gừng, ớt rồi hun khói trên bếp củi trong nhiều giờ. Thịt có hương thơm đặc trưng của khói bếp, vị cay nhẹ, ngọt đậm và dai vừa phải, rất thích hợp làm món nhậu hoặc quà biếu đặc sản.",
    image: "/images/thit-trau-gac-bep.jpeg",
    images: ["/images/thit-trau-gac-bep.jpeg"],
    category: "buffalo",
    basePrice: 320000,
    variants: [
      { weight: "300g", price: 320000, stock: 8 },
      { weight: "500g", price: 600000, stock: 12 },
    ],
    tags: ["bestseller", "pork", "smoked"],
    rating: 4.8,
    reviews: 142,
    preparationTime: "12 hours slow smoke",
    certifications: ["VSATTP Certified", "Free-Range", "No Preservatives"],
    featured: true,
  },
  {
    id: "p2",
    name: "Thịt lợn gác bếp",
    description: "Thịt lợn gác bếp là đặc sản Tây Bắc, được tẩm ướp gia vị truyền thống và hun khói trên bếp củi, tạo nên hương vị đậm đà, thơm ngon đặc trưng.",
    longDescription: "Thịt lợn gác bếp được chế biến từ thịt lợn tươi, ướp gia vị đặc trưng rồi hun khói tự nhiên, mang hương vị thơm ngon, dai mềm rất đặc trưng của vùng núi.",
    image: "/images/thit-lon-gac-bep.png",
    images: ["/images/thit-lon-gac-bep.png"],
    category: "pork",
    basePrice: 180000,
    variants: [
      { weight: "300g", price: 180000, stock: 7 },
      { weight: "500g", price: 300000, stock: 10 },
    ],
    tags: ["premium", "beef", "smoked"],
    rating: 4.9,
    reviews: 98,
    preparationTime: "9 hours slow smoke",
    certifications: ["VSATTP Certified", "Grass-Fed", "No Additives"],
    featured: true,
  },
  {
    id: "p3",
    name: "Chẩm chéo Tây Bắc",
    description: "Chẩm chéo Tây Bắc là gia vị chấm truyền thống với hương thơm mắc khén, vị cay mặn đậm đà, rất hợp khi ăn cùng thịt nướng và đặc sản gác bếp.",
    longDescription: "Chẩm chéo Tây Bắc là loại gia vị chấm đặc trưng của vùng núi, được làm từ mắc khén, ớt, tỏi và muối. Hương vị cay thơm, đậm đà rất phù hợp để chấm thịt trâu gác bếp, thịt lợn gác bếp, đồ nướng hoặc rau luộc.",
    image: "/images/cham-cheo-tay-bac.jpg",
    images: ["/images/cham-cheo-tay-bac.jpg"],
    category: "sausage",
    basePrice: 60000,
    variants: [{ weight: "25g", price: 60000, stock: 0 }],
    tags: ["artisan", "sausage", "traditional"],
    rating: 4.7,
    reviews: 211,
    preparationTime: "2 hours",
    certifications: ["VSATTP Certified", "No MSG", "Traditional Recipe"],
    featured: true,
  },
  {
    id: "p4",
    name: "Combo mỹ vị nhân gian (Gồm 5 vị)",
    description: "Trọn bộ 5 đặc sản Tây Bắc tinh tuyển — từ vị truyền thống thơm lừng đến que nóng bỏng siêu cay. Quà biếu ý nghĩa, ăn một lần nhớ mãi.",
    longDescription: "Combo mỹ vị nhân gian gồm 5 món đặc sản Tây Bắc: vị truyền thống siêu thơm, xúc xắc tê tê siêu hấp dẫn, tảng đập dập siêu mềm, que nóng bỏng siêu cay và miếng ngũ vị siêu ngon. Mỗi món mang một cá tính riêng, hoà quyện cùng nhau tạo nên hành trình ẩm thực khó quên.",
    image: "/images/combo-my-vi-nhan-gian.JPG",
    images: ["/images/combo-my-vi-nhan-gian.JPG"],
    category: "sausage",
    basePrice: 680000,
    variants: [{ weight: "Combo 5 món", price: 680000, stock: 5 }],
    tags: ["premium", "combo", "specialty"],
    rating: 4.9,
    reviews: 67,
    preparationTime: "1-3 ngày",
    certifications: ["VSATTP Certified", "Farm-Raised", "Antibiotic-Free"],
    featured: true,
    isCombo: true,
    comboItems: [
      {
        id: "p4-c1",
        name: "Vị truyền thống siêu thơm",
        description: "Gia vị truyền thống Tây Bắc với hương thơm mắc khén và hạt dổi, đậm đà khó quên.",
        price: 80000,
        weight: "100g",
        image: "/images/vi-truyen-thong-sieu-thom.jpeg", 
      },
      {
        id: "p4-c2",
        name: "Xúc xắc tê tê siêu hấp dẫn",
        description: "Miếng thịt xúc xắc thấm đều gia vị tê tê, ăn một miếng là ghiền.",
        price: 80000,
        weight: "100g",
        image: "/images/xuc-xac-te-te-hap-dan.jpeg",
      },
      {
        id: "p4-c3",
        name: "Tảng đập dập siêu mềm",
        description: "Thịt tảng đập dập theo phương pháp truyền thống, mềm tan, thấm đẫm hương khói.",
        price: 80000,
        weight: "100g",
        image: "/images/tang-dap-dap-sieu-mem.jpeg", 
      },
      {
        id: "p4-c4",
        name: "Que nóng bỏng siêu cay",
        description: "Que thịt hun khói với ớt hiểm Tây Bắc, vị cay nồng kích thích.",
        price: 80000,
        weight: "100g",
        image: "/images/que-nong-bong-sieu-cay.jpeg", 
      },
      {
        id: "p4-c5",
        name: "Miếng ngũ vị siêu ngon",
        description: "Thịt tẩm ngũ vị hương hoà quyện gia vị núi rừng, hương thơm phức, vị đậm đà.",
        price: 80000,
        weight: "100g",
        image: "/images/mieng-ngu-vi-sieu-ngon.jpeg", 
      },
    ],
  },
  {
    id: "p5",
    name: "Lạp xưởng Tây Bắc",
    description: "Lạp xưởng Tây Bắc là đặc sản hun khói từ thịt lợn tươi và mắc khén, có vị đậm đà và hương thơm đặc trưng của núi rừng.",
    longDescription: "Lạp xưởng Tây Bắc được làm từ thịt lợn tươi tẩm ướp gia vị đặc trưng như mắc khén, rượu và tỏi, sau đó hun khói nhẹ tạo nên hương vị thơm ngon, đậm đà.",
    image: "/images/lap-xuong_Tay-Bac.jpeg",
    images: ["/images/lap-xuong_Tay-Bac.jpeg"],
    category: "pork",
    basePrice: 175000,
    variants: [{ weight: "500g", price: 175000, stock: 10 }],
    tags: ["value", "pork", "family"],
    rating: 4.6,
    reviews: 189,
    preparationTime: "1-3 days",
    certifications: ["VSATTP Certified", "Antibiotic-Free"],
    featured: false,
  },
  {
    id: "p6",
    name: "Ba chỉ hun khói",
    description: "Ba chỉ hun khói là món đặc sản được tẩm ướp gia vị rồi hun khói tự nhiên, tạo hương thơm đặc trưng và vị béo đậm đà.",
    longDescription: "Ba chỉ hun khói được làm từ thịt ba chỉ tươi, tẩm ướp gia vị truyền thống và hun khói trên bếp củi. Thịt có hương thơm đặc trưng, lớp mỡ béo ngậy xen lẫn nạc mềm, rất ngon khi chiên, nướng hoặc ăn cùng cơm nóng.",
    image: "/images/ba-chi-heo-quay.jpeg",
    images: ["/images/ba-chi-heo-quay.jpeg"],
    category: "pork",
    basePrice: 225000,
    variants: [{ weight: "500g", price: 225000, stock: 6 }],
    tags: ["traditional", "pork", "cured"],
    rating: 4.7,
    reviews: 134,
    preparationTime: "1-2 days marinated + smoked",
    certifications: ["VSATTP Certified", "Traditional Recipe", "No Nitrates"],
    featured: true,
  },
];

export const formatPrice = (price: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);