// ========================================================
// AfrikWholesaler — Core Data Model Types
// ========================================================

// --- Product Catalog ---

export type ProductBadge =
  | "New"
  | "Featured"
  | "Best Seller"
  | "Limited Stock"
  | "Wholesale"
  | "Fast Shipping"
  | "AI Recommended"
  | "Premium";

export type StockStatus = "In Stock" | "Low Stock" | "Out of Stock" | "Pre-Order";

export interface PriceTier {
  minQuantity: number;
  maxQuantity: number | null;
  price: number;
  currency: string;
}

export interface ProductSpec {
  label: string;
  value: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  categorySlug: string;
  subCategory: string | null;
  subCategorySlug: string | null;
  images: string[];
  videoUrl: string | null;
  originCountry: string;
  moq: number;
  priceTiers: PriceTier[];
  stockStatus: StockStatus;
  badges: ProductBadge[];
  specs: ProductSpec[];
  shippingEstimate: number;
  importTaxEstimate: number;
  deliveryEstimate: string;
  featured: boolean;
  rating: number;
  reviewCount: number;
}

// --- Categories ---

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  productCount: number;
  image: string;
  subCategoryIds?: string[];
}

// --- Sub-Categories ---

export interface SubCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon: string;
  image: string;
  categoryId: string;
  categorySlug: string;
  productCount: number;
}

// --- Customer ---

export type VerificationStatus = "Unverified" | "Pending" | "Verified";

export interface CustomerAddress {
  id: string;
  label: string;
  street: string;
  city: string;
  country: string;
  postalCode: string;
  isDefault: boolean;
}

export interface Customer {
  id: string;
  userId: string | null;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  company: string;
  country: string;
  city: string | null;
  role: string;
  isActive: boolean;
  verificationStatus: VerificationStatus;
  totalOrders: number;
  totalSpent: number;
  addresses: CustomerAddress[];
  createdAt: string;
}

// --- Orders ---

export type OrderStatus =
  | "Pending"
  | "Confirmed"
  | "Sourcing"
  | "Quality Check"
  | "Shipped"
  | "In Customs"
  | "Delivered"
  | "Cancelled";

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  items: OrderItem[];
  status: OrderStatus;
  totalAmount: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

// --- Quote Requests ---

export type QuoteStatus = "Submitted" | "Under Review" | "Quoted" | "Accepted" | "Rejected" | "Expired";

export interface QuoteRequest {
  id: string;
  productId: string | null;
  productName: string;
  quantity: number;
  targetPrice: number;
  destinationCountry: string;
  attachments: string[];
  status: QuoteStatus;
  createdAt: string;
}

// --- Shipments ---

export interface ShipmentMilestone {
  status: string;
  location: string;
  timestamp: string;
  completed: boolean;
}

export interface Shipment {
  id: string;
  orderId: string;
  carrier: string;
  trackingNumber: string;
  milestones: ShipmentMilestone[];
  estimatedDelivery: string;
}

// --- Chat ---

export type ConversationPriority = "Low" | "Normal" | "High" | "Urgent";

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: "customer" | "agent" | "ai";
  content: string;
  attachments: string[];
  isInternalNote: boolean;
  createdAt: string;
}

export interface Conversation {
  id: string;
  customerId: string;
  customerName: string;
  assignedAgentId: string | null;
  priority: ConversationPriority;
  tags: string[];
  unreadCount: number;
  lastMessageAt: string;
}

// --- Testimonials ---

export interface Testimonial {
  id: string;
  name: string;
  company: string;
  country: string;
  avatar: string;
  rating: number;
  quote: string;
}

// --- FAQ ---

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

// --- Stats ---

export interface StatItem {
  id: string;
  label: string;
  value: number;
  suffix: string;
  icon: string;
}