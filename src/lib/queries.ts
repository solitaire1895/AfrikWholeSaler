import { createClient } from "@/lib/supabase/server";
import type {
  Category,
  Conversation,
  Customer,
  Message,
  Order,
  OrderItem,
  Product,
  QuoteRequest,
  Shipment,
  SubCategory,
} from "@/types";

// ========================================================
// Server-side Supabase queries — AfrikWholesaler
// ========================================================

// --- Type mappers: DB row → frontend type ---

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  category_slug: string;
  sub_category: string | null;
  sub_category_slug: string | null;
  origin_country: string;
  image_url: string | null;
  images: string[] | null;
  video_url: string | null;
  moq: number;
  price_tiers: Array<{ minQuantity: number; maxQuantity: number | null; price: number; currency: string }> | null;
  stock_status: string;
  badges: string[] | null;
  specs: Array<{ label: string; value: string }> | null;
  shipping_estimate: string | null;
  import_tax_rate: number | null;
  delivery_days_min: number | null;
  delivery_days_max: number | null;
  featured: boolean;
  rating: number;
  review_count: number;
  is_active: boolean;
}

function mapProduct(row: ProductRow): Product {
  const images = row.images && row.images.length > 0
    ? row.images
    : row.image_url
      ? [row.image_url]
      : [];

  const deliveryEstimate = row.delivery_days_min && row.delivery_days_max
    ? `${row.delivery_days_min}-${row.delivery_days_max} days`
    : "15-30 days";

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    category: row.category,
    categorySlug: row.category_slug,
    subCategory: row.sub_category || null,
    subCategorySlug: row.sub_category_slug || null,
    images,
    videoUrl: row.video_url || null,
    originCountry: row.origin_country,
    moq: row.moq,
    priceTiers: row.price_tiers || [],
    stockStatus: row.stock_status as Product["stockStatus"],
    badges: (row.badges || []) as Product["badges"],
    specs: row.specs || [],
    shippingEstimate: row.shipping_estimate ? parseFloat(row.shipping_estimate) : 0,
    importTaxEstimate: row.import_tax_rate ? Number(row.import_tax_rate) : 0,
    deliveryEstimate,
    featured: row.featured,
    rating: Number(row.rating),
    reviewCount: row.review_count,
  };
}

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  product_count: number;
  description: string | null;
}

function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    icon: row.icon || "Package",
    productCount: row.product_count,
    image: "",
  };
}

interface SubCategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  image: string | null;
  category_id: string;
  category_slug: string;
  product_count: number;
  is_active: boolean;
}

function mapSubCategory(row: SubCategoryRow): SubCategory {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description || undefined,
    icon: row.icon || "Package",
    image: row.image || "",
    categoryId: row.category_id,
    categorySlug: row.category_slug,
    productCount: row.product_count,
  };
}

interface CustomerRow {
  id: string;
  user_id: string | null;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  country: string;
  city: string | null;
  address: string | null;
  verification_status: string;
  total_orders: number;
  total_spent: number;
  created_at: string;
  profiles?: { role: string; is_active: boolean } | null;
}

function mapCustomer(row: CustomerRow): Customer {
  const [firstName, ...lastNameParts] = row.contact_name.split(" ");
  return {
    id: row.id,
    userId: row.user_id,
    email: row.email,
    firstName: firstName || "",
    lastName: lastNameParts.join(" "),
    phone: row.phone || "",
    company: row.company_name,
    country: row.country,
    city: row.city || null,
    role: row.profiles?.role || "customer",
    isActive: row.profiles?.is_active ?? true,
    verificationStatus: row.verification_status.charAt(0).toUpperCase() + row.verification_status.slice(1) as Customer["verificationStatus"],
    totalOrders: row.total_orders,
    totalSpent: Number(row.total_spent),
    addresses: row.address
      ? [{
          id: `${row.id}-addr`,
          label: "Default",
          street: row.address,
          city: row.city || "",
          country: row.country,
          postalCode: "",
          isDefault: true,
        }]
      : [],
    createdAt: row.created_at,
  };
}

interface OrderRow {
  id: string;
  order_number: string;
  customer_id: string;
  status: string;
  total_amount: number;
  currency: string;
  payment_status: string;
  shipping_address: Record<string, string> | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface OrderItemRow {
  id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  image_url: string | null;
}

function mapOrderStatus(dbStatus: string): Order["status"] {
  const statusMap: Record<string, Order["status"]> = {
    pending: "Pending",
    confirmed: "Confirmed",
    processing: "Sourcing",
    quality_check: "Quality Check",
    shipped: "Shipped",
    in_transit: "In Customs",
    delivered: "Delivered",
    cancelled: "Cancelled",
    refunded: "Cancelled",
  };
  return statusMap[dbStatus] || "Pending";
}

function mapOrderItems(rows: OrderItemRow[]): OrderItem[] {
  return rows.map((row) => ({
    productId: row.product_id || "",
    productName: row.product_name,
    productImage: row.image_url || "",
    quantity: row.quantity,
    unitPrice: Number(row.unit_price),
    totalPrice: Number(row.total_price),
  }));
}

interface QuoteRow {
  id: string;
  customer_id: string | null;
  user_id: string | null;
  product_id: string | null;
  product_name: string;
  quantity: number;
  target_price: number | null;
  destination_country: string;
  description: string | null;
  attachments: string[] | null;
  status: string;
  created_at: string;
}

function mapQuoteStatus(dbStatus: string): QuoteRequest["status"] {
  const statusMap: Record<string, QuoteRequest["status"]> = {
    draft: "Submitted",
    submitted: "Submitted",
    under_review: "Under Review",
    quoted: "Quoted",
    accepted: "Accepted",
    rejected: "Rejected",
    expired: "Expired",
  };
  return statusMap[dbStatus] || "Submitted";
}

function mapQuoteRequest(row: QuoteRow): QuoteRequest {
  return {
    id: row.id,
    productId: row.product_id,
    productName: row.product_name,
    quantity: row.quantity,
    targetPrice: row.target_price ? Number(row.target_price) : 0,
    destinationCountry: row.destination_country,
    attachments: row.attachments || [],
    status: mapQuoteStatus(row.status),
    createdAt: row.created_at,
  };
}

interface ShipmentRow {
  id: string;
  shipment_number: string;
  order_id: string | null;
  customer_id: string;
  carrier: string;
  tracking_number: string | null;
  status: string;
  estimated_delivery: string | null;
  milestones: Array<{ status: string; timestamp: string; note?: string; location?: string }> | null;
}

function mapShipment(row: ShipmentRow): Shipment {
  const milestones = (row.milestones || []).map((m) => ({
    status: m.status,
    location: m.location || "",
    timestamp: m.timestamp,
    completed: true, // milestones stored in DB are completed ones
  }));

  return {
    id: row.id,
    orderId: row.order_id || "",
    carrier: row.carrier,
    trackingNumber: row.tracking_number || "",
    milestones,
    estimatedDelivery: row.estimated_delivery
      ? new Date(row.estimated_delivery).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "TBD",
  };
}

interface ConversationRow {
  id: string;
  customer_id: string;
  user_id: string | null;
  assigned_agent_id: string | null;
  status: string;
  priority: string;
  tags: string[] | null;
  subject: string | null;
  last_message_at: string | null;
  created_at: string;
}

interface MessageRow {
  id: string;
  conversation_id: string;
  sender_type: string;
  sender_id: string | null;
  content: string;
  attachments: string[] | null;
  is_internal_note: boolean;
  read_at: string | null;
  created_at: string;
}

function mapMessage(row: MessageRow): Message {
  const senderRoleMap: Record<string, Message["senderRole"]> = {
    customer: "customer",
    agent: "agent",
    ai_assistant: "ai",
    system: "ai",
  };

  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id || "",
    senderRole: senderRoleMap[row.sender_type] || "customer",
    content: row.content,
    attachments: row.attachments || [],
    isInternalNote: row.is_internal_note,
    createdAt: row.created_at,
  };
}

// ========================================================
// Public query functions
// ========================================================

// --- Products ---

export async function getProducts(): Promise<Product[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as ProductRow[]).map(mapProduct);
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .eq("featured", true)
    .order("rating", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return (data as ProductRow[]).map(mapProduct);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error || !data) return null;
  return mapProduct(data as ProductRow);
}

export async function getProductsByCategory(categorySlug: string): Promise<Product[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("category_slug", categorySlug)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as ProductRow[]).map(mapProduct);
}

export async function getProductsBySubCategory(subCategorySlug: string): Promise<Product[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("sub_category_slug", subCategorySlug)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as ProductRow[]).map(mapProduct);
}

// --- Categories ---

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true });

  if (error || !data) return [];
  return (data as CategoryRow[]).map(mapCategory);
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !data) return null;
  return mapCategory(data as CategoryRow);
}

// --- Sub-Categories ---

export async function getSubCategories(): Promise<SubCategory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sub_categories")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error || !data) return [];
  return (data as SubCategoryRow[]).map(mapSubCategory);
}

export async function getSubCategoriesByCategory(categorySlug: string): Promise<SubCategory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sub_categories")
    .select("*")
    .eq("category_slug", categorySlug)
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error || !data) return [];
  return (data as SubCategoryRow[]).map(mapSubCategory);
}

export async function getSubCategoryBySlug(slug: string): Promise<SubCategory | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sub_categories")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error || !data) return null;
  return mapSubCategory(data as SubCategoryRow);
}

// --- Customer ---

export async function getCurrentCustomer(): Promise<Customer | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Try to fetch existing customer record
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (data) return mapCustomer(data as CustomerRow);

  // No customer row found — auto-create one from profile data
  // This prevents redirect loops for users who have a profile but no customer record
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  const contactName = [profile.first_name, profile.last_name]
    .filter(Boolean)
    .join(" ") || user.email || "Unknown User";
  const companyName = profile.company || "Individual Buyer";

  const { data: newCustomer, error: insertError } = await supabase
    .from("customers")
    .insert({
      user_id: user.id,
      company_name: companyName,
      contact_name: contactName,
      email: profile.email || user.email,
      phone: profile.phone || null,
      country: profile.country || "Unknown",
    })
    .select("*")
    .single();

  if (insertError || !newCustomer) return null;
  return mapCustomer(newCustomer as CustomerRow);
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return mapCustomer(data as CustomerRow);
}

export async function getAllCustomers(): Promise<Customer[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .select("*, profiles!left(role, is_active)")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as CustomerRow[]).map(mapCustomer);
}

// --- Orders ---

export async function getOrdersByCustomer(customerId: string): Promise<Order[]> {
  const supabase = await createClient();
  const { data: ordersData, error: ordersError } = await supabase
    .from("orders")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (ordersError || !ordersData) return [];

  const orders = ordersData as OrderRow[];
  const result: Order[] = [];

  for (const orderRow of orders) {
    const { data: itemsData } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderRow.id)
      .order("created_at", { ascending: true });

    const items = mapOrderItems((itemsData || []) as OrderItemRow[]);

    result.push({
      id: orderRow.id,
      orderNumber: orderRow.order_number,
      customerId: orderRow.customer_id,
      items,
      status: mapOrderStatus(orderRow.status),
      totalAmount: Number(orderRow.total_amount),
      currency: orderRow.currency,
      createdAt: orderRow.created_at,
      updatedAt: orderRow.updated_at,
    });
  }

  return result;
}

export async function getAllOrders(): Promise<Order[]> {
  const supabase = await createClient();
  const { data: ordersData, error: ordersError } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (ordersError || !ordersData) return [];

  const orders = ordersData as OrderRow[];
  const result: Order[] = [];

  for (const orderRow of orders) {
    const { data: itemsData } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderRow.id)
      .order("created_at", { ascending: true });

    const items = mapOrderItems((itemsData || []) as OrderItemRow[]);

    result.push({
      id: orderRow.id,
      orderNumber: orderRow.order_number,
      customerId: orderRow.customer_id,
      items,
      status: mapOrderStatus(orderRow.status),
      totalAmount: Number(orderRow.total_amount),
      currency: orderRow.currency,
      createdAt: orderRow.created_at,
      updatedAt: orderRow.updated_at,
    });
  }

  return result;
}

export async function getOrderById(id: string): Promise<Order | null> {
  const supabase = await createClient();
  const { data: orderRow, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !orderRow) return null;

  const { data: itemsData } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", id)
    .order("created_at", { ascending: true });

  const items = mapOrderItems((itemsData || []) as OrderItemRow[]);

  return {
    id: orderRow.id,
    orderNumber: orderRow.order_number,
    customerId: orderRow.customer_id,
    items,
    status: mapOrderStatus(orderRow.status),
    totalAmount: Number(orderRow.total_amount),
    currency: orderRow.currency,
    createdAt: orderRow.created_at,
    updatedAt: orderRow.updated_at,
  };
}

// --- Quote Requests ---

export async function getQuotesByCustomer(customerId: string): Promise<QuoteRequest[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quote_requests")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as QuoteRow[]).map(mapQuoteRequest);
}

export async function getQuotesByUser(userId: string): Promise<QuoteRequest[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quote_requests")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as QuoteRow[]).map(mapQuoteRequest);
}

export async function getAllQuotes(): Promise<QuoteRequest[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quote_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as QuoteRow[]).map(mapQuoteRequest);
}

// --- Shipments ---

export async function getShipmentsByCustomer(customerId: string): Promise<Shipment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shipments")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as ShipmentRow[]).map(mapShipment);
}

export async function getAllShipments(): Promise<Shipment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shipments")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as ShipmentRow[]).map(mapShipment);
}

// --- Conversations & Messages ---

export async function getConversationsByCustomer(customerId: string): Promise<Conversation[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("customer_id", customerId)
    .order("last_message_at", { ascending: false, nullsFirst: false });

  if (error || !data) return [];

  const conversations = data as ConversationRow[];
  const result: Conversation[] = [];

  for (const conv of conversations) {
    // Get unread count (messages without read_at where sender is not customer)
    const { count } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("conversation_id", conv.id)
      .is("read_at", null)
      .neq("sender_type", "customer");

    // Get customer name
    const { data: customerData } = await supabase
      .from("customers")
      .select("contact_name")
      .eq("id", conv.customer_id)
      .single();

    result.push({
      id: conv.id,
      customerId: conv.customer_id,
      customerName: customerData?.contact_name || "Unknown",
      assignedAgentId: conv.assigned_agent_id,
      priority: (conv.priority.charAt(0).toUpperCase() + conv.priority.slice(1)) as Conversation["priority"],
      tags: conv.tags || [],
      unreadCount: count || 0,
      lastMessageAt: conv.last_message_at || conv.created_at,
    });
  }

  return result;
}

export async function getAllConversations(): Promise<Conversation[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .order("last_message_at", { ascending: false, nullsFirst: false });

  if (error || !data) return [];

  const conversations = data as ConversationRow[];
  const result: Conversation[] = [];

  for (const conv of conversations) {
    const { count } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("conversation_id", conv.id)
      .is("read_at", null)
      .neq("sender_type", "customer");

    const { data: customerData } = await supabase
      .from("customers")
      .select("contact_name")
      .eq("id", conv.customer_id)
      .single();

    result.push({
      id: conv.id,
      customerId: conv.customer_id,
      customerName: customerData?.contact_name || "Unknown",
      assignedAgentId: conv.assigned_agent_id,
      priority: (conv.priority.charAt(0).toUpperCase() + conv.priority.slice(1)) as Conversation["priority"],
      tags: conv.tags || [],
      unreadCount: count || 0,
      lastMessageAt: conv.last_message_at || conv.created_at,
    });
  }

  return result;
}

export async function getMessagesByConversation(conversationId: string): Promise<Message[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return (data as MessageRow[]).map(mapMessage);
}

// --- Profile / Auth helpers ---

export async function getCurrentUserProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !data) return null;
  return data;
}

export async function isUserStaff(): Promise<boolean> {
  const profile = await getCurrentUserProfile();
  if (!profile) return false;
  const staffRoles = ["sales_rep", "support_agent", "warehouse_staff", "logistics_staff", "operations_manager", "admin", "super_admin"];
  return staffRoles.includes(profile.role);
}

export async function isUserAdmin(): Promise<boolean> {
  const profile = await getCurrentUserProfile();
  if (!profile) return false;
  return ["admin", "super_admin"].includes(profile.role);
}

// --- Staff ---

interface StaffRow {
  id: string;
  user_id: string;
  employee_id: string | null;
  department: string | null;
  position: string | null;
  hire_date: string | null;
  is_active: boolean;
  created_at: string;
}

export async function getAllStaff(): Promise<Array<{
  id: string;
  userId: string;
  employeeId: string | null;
  department: string;
  position: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  hireDate: string | null;
  isActive: boolean;
  profileIsActive: boolean;
}>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("staff")
    .select(`
      *,
      profiles!inner(email, first_name, last_name, role, avatar_url, is_active)
    `)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return (data as unknown as Array<StaffRow & { profiles: { email: string; first_name: string | null; last_name: string | null; role: string; avatar_url: string | null; is_active: boolean } }>).map((row) => ({
    id: row.id,
    userId: row.user_id,
    employeeId: row.employee_id,
    department: row.department || "General",
    position: row.position || "Staff",
    firstName: row.profiles?.first_name || "",
    lastName: row.profiles?.last_name || "",
    email: row.profiles?.email || "",
    role: row.profiles?.role || "staff",
    avatarUrl: row.profiles?.avatar_url || null,
    hireDate: row.hire_date,
    isActive: row.is_active,
    profileIsActive: row.profiles?.is_active ?? true,
  }));
}

// --- All Profiles (for admin user search) ---

export async function getAllProfiles(): Promise<Array<{
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
}>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, first_name, last_name, role, is_active")
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return (data as Array<{ id: string; email: string; first_name: string | null; last_name: string | null; role: string; is_active: boolean }>).map((row) => ({
    id: row.id,
    email: row.email,
    firstName: row.first_name || "",
    lastName: row.last_name || "",
    role: row.role,
    isActive: row.is_active,
  }));
}

// --- Dashboard Stats ---

export async function getAdminDashboardStats(): Promise<{
  totalRevenue: number;
  pendingQuotes: number;
  activeOrders: number;
  activeShipments: number;
  unreadMessages: number;
  totalCustomers: number;
  totalProducts: number;
}> {
  const supabase = await createClient();

  const [ordersRes, quotesRes, shipmentsRes, convsRes, customersRes, productsRes] = await Promise.all([
    supabase.from("orders").select("total_amount, status").neq("status", "cancelled"),
    supabase.from("quote_requests").select("status").in("status", ["submitted", "under_review"]),
    supabase.from("shipments").select("status, milestones").neq("status", "delivered"),
    supabase.from("conversations").select("status").eq("status", "open"),
    supabase.from("customers").select("id", { count: "exact", head: true }),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("is_active", true),
  ]);

  const totalRevenue = (ordersRes.data || []).reduce((sum, o) => sum + Number(o.total_amount), 0);
  const pendingQuotes = quotesRes.data?.length || 0;
  const activeOrders = ordersRes.data?.filter((o) => !["delivered", "cancelled"].includes(o.status)).length || 0;
  const activeShipments = shipmentsRes.data?.length || 0;
  const unreadMessages = convsRes.data?.length || 0;
  const totalCustomers = customersRes.count || 0;
  const totalProducts = productsRes.count || 0;

  return { totalRevenue, pendingQuotes, activeOrders, activeShipments, unreadMessages, totalCustomers, totalProducts };
}

export async function getCustomerDashboardStats(customerId: string): Promise<{
  activeOrders: number;
  inTransit: number;
  pendingQuotes: number;
  unreadMessages: number;
  totalSpent: number;
}> {
  const supabase = await createClient();

  const [ordersRes, shipmentsRes, quotesRes, convsRes] = await Promise.all([
    supabase.from("orders").select("total_amount, status").eq("customer_id", customerId),
    supabase.from("shipments").select("status").eq("customer_id", customerId).neq("status", "delivered"),
    supabase.from("quote_requests").select("status").eq("customer_id", customerId).in("status", ["submitted", "under_review"]),
    supabase.from("conversations").select("id", { count: "exact", head: true }).eq("customer_id", customerId),
  ]);

  const orders = ordersRes.data || [];
  const activeOrders = orders.filter((o) => !["delivered", "cancelled"].includes(o.status)).length;
  const totalSpent = orders.reduce((sum, o) => sum + Number(o.total_amount), 0);
  const inTransit = shipmentsRes.data?.length || 0;
  const pendingQuotes = quotesRes.data?.length || 0;
  const unreadMessages = convsRes.count || 0;

  return { activeOrders, inTransit, pendingQuotes, unreadMessages, totalSpent };
}

// --- Related Products ---

export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("category_slug", product.categorySlug)
    .eq("is_active", true)
    .neq("id", product.id)
    .limit(limit);

  if (error || !data) return [];
  return (data as ProductRow[]).map(mapProduct);
}

// --- Purchase Requests ---

export interface PurchaseRequest {
  id: string;
  prNumber: string;
  quoteRequestId: string | null;
  productName: string;
  description: string | null;
  quantity: number;
  targetUnitPrice: number | null;
  factoryName: string | null;
  factoryContact: string | null;
  factoryQuotedPrice: number | null;
  status: string;
  notes: string | null;
  adminNotes: string | null;
  requestedBy: string;
  expectedDeliveryDate: string | null;
  createdAt: string;
}

interface PurchaseRequestRow {
  id: string;
  pr_number: string;
  quote_request_id: string | null;
  product_name: string;
  description: string | null;
  quantity: number;
  target_unit_price: number | null;
  factory_name: string | null;
  factory_contact: string | null;
  factory_quoted_price: number | null;
  status: string;
  notes: string | null;
  admin_notes: string | null;
  requested_by: string;
  expected_delivery_date: string | null;
  created_at: string;
}

function mapPurchaseRequest(row: PurchaseRequestRow): PurchaseRequest {
  return {
    id: row.id,
    prNumber: row.pr_number,
    quoteRequestId: row.quote_request_id,
    productName: row.product_name,
    description: row.description,
    quantity: row.quantity,
    targetUnitPrice: row.target_unit_price ? Number(row.target_unit_price) : null,
    factoryName: row.factory_name,
    factoryContact: row.factory_contact,
    factoryQuotedPrice: row.factory_quoted_price ? Number(row.factory_quoted_price) : null,
    status: row.status,
    notes: row.notes,
    adminNotes: row.admin_notes,
    requestedBy: row.requested_by,
    expectedDeliveryDate: row.expected_delivery_date,
    createdAt: row.created_at,
  };
}

export async function getAllPurchaseRequests(): Promise<PurchaseRequest[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("purchase_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as PurchaseRequestRow[]).map(mapPurchaseRequest);
}
