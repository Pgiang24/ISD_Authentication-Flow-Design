export type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
export type PaymentStatus = "paid" | "pending" | "failed";

export interface Order {
  id: string;
  customer: string;
  phone: string;
  email: string;
  items: { name: string; qty: number; price: number; weight: string }[];
  total: number;
  status: OrderStatus;
  paymentMethod: "bank" | "cod";
  paymentStatus: PaymentStatus;
  date: string;
  address: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  variants: { weight: string; price: number; stock: number; sku: string }[];
  image: string;
  lastUpdated: string;
}

export const MOCK_ORDERS: Order[] = [
  {
    id: "ALE-ORDER-001",
    customer: "Nguyen Thi Lan",
    phone: "0901234567",
    email: "lan@email.com",
    items: [{ name: "Smoked Pork Ribs", qty: 2, price: 320000, weight: "500g" }],
    total: 640000,
    status: "pending",
    paymentMethod: "bank",
    paymentStatus: "pending",
    date: "2026-02-27",
    address: "123 Le Loi, District 1, Ho Chi Minh City",
  },
  {
    id: "ALE-ORDER-002",
    customer: "Tran Van Minh",
    phone: "0912345678",
    email: "minh@email.com",
    items: [
      { name: "Smoked Beef Brisket", qty: 1, price: 920000, weight: "1kg" },
      { name: "Artisan Smoked Sausage", qty: 2, price: 240000, weight: "300g" },
    ],
    total: 1400000,
    status: "confirmed",
    paymentMethod: "cod",
    paymentStatus: "pending",
    date: "2026-02-27",
    address: "456 Nguyen Hue, Ba Dinh, Hanoi",
  },
  {
    id: "ALE-ORDER-003",
    customer: "Le Thi Hoa",
    phone: "0923456789",
    email: "hoa@email.com",
    items: [{ name: "Whole Smoked Duck", qty: 1, price: 680000, weight: "1 bird (~1.5kg)" }],
    total: 680000,
    status: "shipped",
    paymentMethod: "bank",
    paymentStatus: "paid",
    date: "2026-02-26",
    address: "789 Tran Phu, Da Nang",
  },
  {
    id: "ALE-ORDER-004",
    customer: "Pham Van Duc",
    phone: "0934567890",
    email: "duc@email.com",
    items: [{ name: "Smoked Chicken Thighs", qty: 3, price: 180000, weight: "4 pieces (~600g)" }],
    total: 540000,
    status: "delivered",
    paymentMethod: "cod",
    paymentStatus: "paid",
    date: "2026-02-25",
    address: "321 Bach Dang, Hue",
  },
  {
    id: "ALE-ORDER-005",
    customer: "Hoang Thi Mai",
    phone: "0945678901",
    email: "mai@email.com",
    items: [{ name: "Cured Smoked Pork Belly", qty: 2, price: 550000, weight: "1kg" }],
    total: 1100000,
    status: "processing",
    paymentMethod: "bank",
    paymentStatus: "paid",
    date: "2026-02-26",
    address: "654 Hai Ba Trung, District 3, Ho Chi Minh City",
  },
  {
    id: "ALE-ORDER-006",
    customer: "Nguyen Van Thanh",
    phone: "0956789012",
    email: "thanh@email.com",
    items: [
      { name: "Smoked Pork Ribs", qty: 1, price: 580000, weight: "1kg" },
      { name: "Smoked Beef Brisket", qty: 1, price: 480000, weight: "500g" },
    ],
    total: 1060000,
    status: "cancelled",
    paymentMethod: "cod",
    paymentStatus: "failed",
    date: "2026-02-24",
    address: "987 Vo Thi Sau, District 3, Ho Chi Minh City",
  },
  {
    id: "ALE-ORDER-007",
    customer: "Do Thi Thu",
    phone: "0967890123",
    email: "thu@email.com",
    items: [{ name: "Smoked Pork Ribs", qty: 1, price: 840000, weight: "1.5kg" }],
    total: 840000,
    status: "pending",
    paymentMethod: "bank",
    paymentStatus: "pending",
    date: "2026-02-27",
    address: "135 Le Thanh Ton, District 1, Ho Chi Minh City",
  },
  {
    id: "ALE-ORDER-008",
    customer: "Vu Van Long",
    phone: "0978901234",
    email: "long@email.com",
    items: [{ name: "Artisan Smoked Sausage", qty: 3, price: 720000, weight: "1kg" }],
    total: 2160000,
    status: "confirmed",
    paymentMethod: "bank",
    paymentStatus: "paid",
    date: "2026-02-26",
    address: "246 Dien Bien Phu, Binh Thanh, Ho Chi Minh City",
  },
];

export const REVENUE_DATA = [
  { month: "Sep", revenue: 12400000, orders: 38 },
  { month: "Oct", revenue: 15800000, orders: 52 },
  { month: "Nov", revenue: 19200000, orders: 61 },
  { month: "Dec", revenue: 28500000, orders: 89 },
  { month: "Jan", revenue: 22100000, orders: 70 },
  { month: "Feb", revenue: 18700000, orders: 59 },
];

export const CATEGORY_DATA = [
  { name: "Pork", value: 38 },
  { name: "Beef", value: 24 },
  { name: "Poultry", value: 22 },
  { name: "Sausage", value: 16 },
];

export const MOCK_INVENTORY: InventoryItem[] = [
  {
    id: "p1",
    name: "Smoked Pork Ribs",
    category: "Pork",
    image: "https://images.unsplash.com/photo-1757967708227-c67e37e7c96a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200",
    variants: [
      { weight: "500g", price: 320000, stock: 15, sku: "SPR-500" },
      { weight: "1kg", price: 580000, stock: 8, sku: "SPR-1KG" },
      { weight: "1.5kg", price: 840000, stock: 4, sku: "SPR-1K5" },
    ],
    lastUpdated: "2026-02-27",
  },
  {
    id: "p2",
    name: "Smoked Beef Brisket",
    category: "Beef",
    image: "https://images.unsplash.com/photo-1719329467996-06b840ad7cda?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200",
    variants: [
      { weight: "500g", price: 480000, stock: 10, sku: "SBB-500" },
      { weight: "1kg", price: 920000, stock: 5, sku: "SBB-1KG" },
      { weight: "2kg", price: 1750000, stock: 2, sku: "SBB-2KG" },
    ],
    lastUpdated: "2026-02-26",
  },
  {
    id: "p3",
    name: "Artisan Smoked Sausage",
    category: "Sausage",
    image: "https://images.unsplash.com/photo-1674066620885-6220ec2857f8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200",
    variants: [
      { weight: "300g", price: 240000, stock: 20, sku: "ASS-300" },
      { weight: "500g", price: 380000, stock: 12, sku: "ASS-500" },
      { weight: "1kg", price: 720000, stock: 6, sku: "ASS-1KG" },
    ],
    lastUpdated: "2026-02-27",
  },
  {
    id: "p4",
    name: "Whole Smoked Duck",
    category: "Poultry",
    image: "https://images.unsplash.com/photo-1620829299882-b596fe8fb84c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200",
    variants: [
      { weight: "1 bird (~1.5kg)", price: 680000, stock: 6, sku: "WSD-1B" },
      { weight: "2 birds (~3kg)", price: 1280000, stock: 3, sku: "WSD-2B" },
    ],
    lastUpdated: "2026-02-25",
  },
  {
    id: "p5",
    name: "Smoked Chicken Thighs",
    category: "Poultry",
    image: "https://images.unsplash.com/photo-1694717459401-bf23c6f00980?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200",
    variants: [
      { weight: "4 pieces (~600g)", price: 180000, stock: 25, sku: "SCT-4P" },
      { weight: "8 pieces (~1.2kg)", price: 340000, stock: 15, sku: "SCT-8P" },
    ],
    lastUpdated: "2026-02-27",
  },
  {
    id: "p6",
    name: "Cured Smoked Pork Belly",
    category: "Pork",
    image: "https://images.unsplash.com/photo-1563249873-e8c9a149889a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200",
    variants: [
      { weight: "500g", price: 290000, stock: 0, sku: "CSP-500" },
      { weight: "1kg", price: 550000, stock: 9, sku: "CSP-1KG" },
    ],
    lastUpdated: "2026-02-26",
  },
];
