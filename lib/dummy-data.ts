export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  brand: string;
  condition: 'new' | 'used';
  price: number;
  offerPrice?: number;
  shops: string[];
  stock: { [key: string]: number };
  image?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
}

export interface Brand {
  id: string;
  name: string;
}

export interface Shop {
  id: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  categories: string[];
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  role: 'super-admin' | 'admin' | 'staff';
  assignedShop: string;
  status: 'active' | 'inactive';
  joinDate: string;
}

export interface Inventory {
  id: string;
  productId: string;
  shopId: string;
  currentStock: number;
  lowStockLimit: number;
  lastUpdated: string;
}

// Categories
export const categories: Category[] = [
  { id: '1', name: 'Mobile Phones', description: 'New smartphones and mobile devices' },
  { id: '2', name: 'Used Phones', description: 'Refurbished and used mobile phones' },
  { id: '3', name: 'Custom PC Builds', description: 'Custom built computers and gaming PCs' },
  { id: '4', name: 'Accessories', description: 'Chargers, cases, cables, and more' },
  { id: '5', name: 'Laptops', description: 'Gaming and business laptops' },
];

// Brands
export const brands: Brand[] = [
  { id: '1', name: 'Apple' },
  { id: '2', name: 'Samsung' },
  { id: '3', name: 'OnePlus' },
  { id: '4', name: 'Asus' },
  { id: '5', name: 'MSI' },
  { id: '6', name: 'Lenovo' },
];

// Shops
export const shops: Shop[] = [
  {
    id: 'shop-1',
    name: 'Shop 1 - Used Phones & PC Store',
    description: 'Specializing in used phones and custom PC builds',
    address: '123 Tech Street, Downtown',
    phone: '+1-234-567-8900',
    categories: ['Used Phones', 'Custom PC Builds', 'Accessories'],
  },
  {
    id: 'shop-2',
    name: 'Shop 2 - Mobile & PC Hub',
    description: 'Latest mobile phones and gaming PCs',
    address: '456 Digital Avenue, Midtown',
    phone: '+1-234-567-8901',
    categories: ['Mobile Phones', 'Custom PC Builds', 'Laptops'],
  },
];

// Products
export const products: Product[] = [
  {
    id: 'prod-1',
    name: 'iPhone 15 Pro',
    description: 'Latest Apple flagship with A17 Pro chip',
    category: 'Mobile Phones',
    brand: 'Apple',
    condition: 'new',
    price: 999,
    offerPrice: 899,
    shops: ['shop-2'],
    stock: { 'shop-1': 0, 'shop-2': 15 },
    status: 'active',
    createdAt: '2024-01-15',
    updatedAt: '2024-05-18',
  },
  {
    id: 'prod-2',
    name: 'Samsung Galaxy S24',
    description: 'Flagship Samsung phone with advanced AI features',
    category: 'Mobile Phones',
    brand: 'Samsung',
    condition: 'new',
    price: 899,
    shops: ['shop-2'],
    stock: { 'shop-1': 0, 'shop-2': 22 },
    status: 'active',
    createdAt: '2024-02-10',
    updatedAt: '2024-05-17',
  },
  {
    id: 'prod-3',
    name: 'iPhone 13 (Used)',
    description: 'Excellent condition refurbished iPhone 13',
    category: 'Used Phones',
    brand: 'Apple',
    condition: 'used',
    price: 599,
    offerPrice: 549,
    shops: ['shop-1'],
    stock: { 'shop-1': 8, 'shop-2': 0 },
    status: 'active',
    createdAt: '2024-03-05',
    updatedAt: '2024-05-18',
  },
  {
    id: 'prod-4',
    name: 'OnePlus 12',
    description: 'Fast and smooth flagship killer',
    category: 'Mobile Phones',
    brand: 'OnePlus',
    condition: 'new',
    price: 649,
    shops: ['shop-2'],
    stock: { 'shop-1': 0, 'shop-2': 12 },
    status: 'active',
    createdAt: '2024-01-20',
    updatedAt: '2024-05-16',
  },
  {
    id: 'prod-5',
    name: 'High-End Gaming PC',
    description: 'RTX 4090, i9-13900K, 32GB RAM',
    category: 'Custom PC Builds',
    brand: 'Asus',
    condition: 'new',
    price: 2499,
    shops: ['shop-1', 'shop-2'],
    stock: { 'shop-1': 3, 'shop-2': 2 },
    status: 'active',
    createdAt: '2024-02-01',
    updatedAt: '2024-05-18',
  },
  {
    id: 'prod-6',
    name: 'Mid-Range Gaming PC',
    description: 'RTX 4070, i7-13700K, 16GB RAM',
    category: 'Custom PC Builds',
    brand: 'MSI',
    condition: 'new',
    price: 1499,
    shops: ['shop-1', 'shop-2'],
    stock: { 'shop-1': 5, 'shop-2': 4 },
    status: 'active',
    createdAt: '2024-02-15',
    updatedAt: '2024-05-18',
  },
  {
    id: 'prod-7',
    name: 'Samsung Galaxy A54',
    description: 'Budget-friendly Samsung smartphone',
    category: 'Mobile Phones',
    brand: 'Samsung',
    condition: 'new',
    price: 449,
    shops: ['shop-2'],
    stock: { 'shop-1': 0, 'shop-2': 30 },
    status: 'active',
    createdAt: '2024-03-10',
    updatedAt: '2024-05-18',
  },
  {
    id: 'prod-8',
    name: 'Lenovo Legion 5 Pro',
    description: '16" Gaming Laptop with RTX 4060',
    category: 'Laptops',
    brand: 'Lenovo',
    condition: 'new',
    price: 1299,
    offerPrice: 1199,
    shops: ['shop-2'],
    stock: { 'shop-1': 0, 'shop-2': 7 },
    status: 'active',
    createdAt: '2024-02-20',
    updatedAt: '2024-05-17',
  },
  {
    id: 'prod-9',
    name: 'Samsung Galaxy Z Fold 5 (Used)',
    description: 'Foldable phone in good condition',
    category: 'Used Phones',
    brand: 'Samsung',
    condition: 'used',
    price: 899,
    shops: ['shop-1'],
    stock: { 'shop-1': 2, 'shop-2': 0 },
    status: 'active',
    createdAt: '2024-04-01',
    updatedAt: '2024-05-18',
  },
  {
    id: 'prod-10',
    name: 'Budget Gaming PC',
    description: 'RTX 4050, i5-13600K, 8GB RAM',
    category: 'Custom PC Builds',
    brand: 'MSI',
    condition: 'new',
    price: 799,
    shops: ['shop-1'],
    stock: { 'shop-1': 8, 'shop-2': 0 },
    status: 'active',
    createdAt: '2024-03-15',
    updatedAt: '2024-05-18',
  },
];

// Staff
export const staff: Staff[] = [
  {
    id: 'staff-1',
    name: 'John Admin',
    email: 'admin@store.com',
    role: 'super-admin',
    assignedShop: 'shop-1',
    status: 'active',
    joinDate: '2023-01-01',
  },
  {
    id: 'staff-2',
    name: 'Jane Smith',
    email: 'jane@store.com',
    role: 'admin',
    assignedShop: 'shop-2',
    status: 'active',
    joinDate: '2023-06-15',
  },
  {
    id: 'staff-3',
    name: 'Mike Johnson',
    email: 'mike@store.com',
    role: 'staff',
    assignedShop: 'shop-1',
    status: 'active',
    joinDate: '2023-08-20',
  },
  {
    id: 'staff-4',
    name: 'Sarah Lee',
    email: 'sarah@store.com',
    role: 'staff',
    assignedShop: 'shop-2',
    status: 'active',
    joinDate: '2024-01-10',
  },
  {
    id: 'staff-5',
    name: 'Tom Davis',
    email: 'tom@store.com',
    role: 'staff',
    assignedShop: 'shop-1',
    status: 'inactive',
    joinDate: '2023-03-05',
  },
  {
    id: 'staff-6',
    name: 'Emma Wilson',
    email: 'emma@store.com',
    role: 'admin',
    assignedShop: 'shop-2',
    status: 'active',
    joinDate: '2023-11-01',
  },
];

// Inventory
export const inventory: Inventory[] = [
  { id: 'inv-1', productId: 'prod-1', shopId: 'shop-2', currentStock: 15, lowStockLimit: 5, lastUpdated: '2024-05-18' },
  { id: 'inv-2', productId: 'prod-2', shopId: 'shop-2', currentStock: 22, lowStockLimit: 5, lastUpdated: '2024-05-18' },
  { id: 'inv-3', productId: 'prod-3', shopId: 'shop-1', currentStock: 8, lowStockLimit: 10, lastUpdated: '2024-05-18' },
  { id: 'inv-4', productId: 'prod-4', shopId: 'shop-2', currentStock: 12, lowStockLimit: 5, lastUpdated: '2024-05-18' },
  { id: 'inv-5', productId: 'prod-5', shopId: 'shop-1', currentStock: 3, lowStockLimit: 2, lastUpdated: '2024-05-18' },
  { id: 'inv-6', productId: 'prod-5', shopId: 'shop-2', currentStock: 2, lowStockLimit: 2, lastUpdated: '2024-05-18' },
  { id: 'inv-7', productId: 'prod-6', shopId: 'shop-1', currentStock: 5, lowStockLimit: 3, lastUpdated: '2024-05-18' },
  { id: 'inv-8', productId: 'prod-6', shopId: 'shop-2', currentStock: 4, lowStockLimit: 3, lastUpdated: '2024-05-18' },
  { id: 'inv-9', productId: 'prod-7', shopId: 'shop-2', currentStock: 30, lowStockLimit: 10, lastUpdated: '2024-05-18' },
  { id: 'inv-10', productId: 'prod-8', shopId: 'shop-2', currentStock: 7, lowStockLimit: 3, lastUpdated: '2024-05-18' },
];
