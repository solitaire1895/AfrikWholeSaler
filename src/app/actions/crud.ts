"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ========================================================
// Server Actions — AfrikWholesaler CRUD
// ========================================================

interface ActionResult {
  success: boolean;
  error?: string;
  data?: unknown;
}

// --- Quote Request Actions ---

export async function createQuoteRequest(input: {
  productId: string | null;
  productName: string;
  quantity: number;
  targetPrice: number;
  destinationCountry: string;
  description?: string;
  customization?: string;
  urgency?: string;
  attachments?: string[];
}): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "You must be logged in to submit a quote request." };

  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("user_id", user.id)
    .single();

  const { data, error } = await supabase
    .from("quote_requests")
    .insert({
      customer_id: customer?.id || null,
      user_id: user.id,
      product_id: input.productId,
      product_name: input.productName,
      quantity: input.quantity,
      target_price: input.targetPrice,
      destination_country: input.destinationCountry,
      description: input.description || null,
      customization: input.customization || null,
      urgency: input.urgency || "standard",
      attachments: input.attachments || [],
      status: "submitted",
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/quotes");
  revalidatePath("/admin/quotes");
  return { success: true, data };
}

export async function updateQuoteStatus(quoteId: string, status: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { data, error } = await supabase
    .from("quote_requests")
    .update({ status })
    .eq("id", quoteId)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/quotes");
  revalidatePath("/dashboard/quotes");
  return { success: true, data };
}

export async function respondToQuote(
  quoteId: string,
  quotedPrice: number,
  deliveryDays: number,
  staffResponse: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { data, error } = await supabase
    .from("quote_requests")
    .update({
      status: "quoted",
      quoted_price: quotedPrice,
      quoted_delivery_days: deliveryDays,
      staff_response: staffResponse,
      assigned_agent_id: user.id,
    })
    .eq("id", quoteId)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/quotes");
  revalidatePath("/dashboard/quotes");
  return { success: true, data };
}

// --- Message / Conversation Actions ---

export async function createConversation(input: {
  customerId: string;
  subject: string;
  priority?: string;
  tags?: string[];
}): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "You must be logged in to start a conversation." };

  const { data, error } = await supabase
    .from("conversations")
    .insert({
      customer_id: input.customerId,
      user_id: user.id,
      subject: input.subject,
      priority: input.priority || "normal",
      tags: input.tags || [],
      status: "open",
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/messages");
  revalidatePath("/admin/messages");
  return { success: true, data };
}

export async function sendMessage(input: {
  conversationId: string;
  content: string;
  attachments?: string[];
  isInternalNote?: boolean;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "You must be logged in to send a message." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const staffRoles = ["sales_rep", "support_agent", "warehouse_staff", "logistics_staff", "operations_manager", "admin", "super_admin"];
  const senderType = profile && staffRoles.includes(profile.role) ? "agent" : "customer";

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: input.conversationId,
      sender_type: senderType,
      sender_id: user.id,
      content: input.content,
      attachments: input.attachments || [],
      is_internal_note: input.isInternalNote || false,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  await supabase
    .from("conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", input.conversationId);

  revalidatePath("/dashboard/messages");
  revalidatePath("/admin/messages");
  return { success: true, data };
}

export async function markMessagesRead(conversationId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .is("read_at", null)
    .neq("sender_id", user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/messages");
  revalidatePath("/admin/messages");
  return { success: true };
}

// --- Product Actions (admin only) ---

export async function createProduct(input: {
  name: string;
  slug: string;
  description: string;
  category: string;
  categorySlug: string;
  categoryId?: string;
  subCategory?: string | null;
  subCategorySlug?: string | null;
  subCategoryId?: string | null;
  originCountry: string;
  images: string[];
  moq: number;
  priceTiers: Array<{ minQuantity: number; maxQuantity: number | null; price: number; currency: string }>;
  stockStatus: string;
  stockQuantity: number;
  badges: string[];
  specs: Array<{ label: string; value: string }>;
  featured: boolean;
  shippingEstimate?: string;
  importTaxRate?: number;
  deliveryDaysMin?: number;
  deliveryDaysMax?: number;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "super_admin"].includes(profile.role)) {
    return { success: false, error: "Only admins can create products." };
  }

  const { data, error } = await supabase
    .from("products")
    .insert({
      name: input.name,
      slug: input.slug,
      description: input.description,
      category: input.category,
      category_slug: input.categorySlug,
      category_id: input.categoryId || null,
      sub_category: input.subCategory || null,
      sub_category_slug: input.subCategorySlug || null,
      sub_category_id: input.subCategoryId || null,
      origin_country: input.originCountry,
      images: input.images,
      moq: input.moq,
      price_tiers: input.priceTiers,
      stock_status: input.stockStatus,
      stock_quantity: input.stockQuantity,
      badges: input.badges,
      specs: input.specs,
      featured: input.featured,
      shipping_estimate: input.shippingEstimate || null,
      import_tax_rate: input.importTaxRate || 0,
      delivery_days_min: input.deliveryDaysMin || null,
      delivery_days_max: input.deliveryDaysMax || null,
      is_active: true,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/products");
  revalidatePath("/products");
  return { success: true, data };
}

export async function updateProduct(productId: string, input: Record<string, unknown>): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "super_admin"].includes(profile.role)) {
    return { success: false, error: "Only admins can update products." };
  }

  const { data, error } = await supabase
    .from("products")
    .update(input)
    .eq("id", productId)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/products");
  revalidatePath("/products");
  return { success: true, data };
}

export async function deleteProduct(productId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "super_admin"].includes(profile.role)) {
    return { success: false, error: "Only admins can delete products." };
  }

  const { error } = await supabase
    .from("products")
    .update({ is_active: false })
    .eq("id", productId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/products");
  revalidatePath("/products");
  return { success: true };
}

// --- Sub-Category Actions (admin only) ---

export async function createSubCategory(input: {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  image?: string;
  categoryId: string;
  categorySlug: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "super_admin"].includes(profile.role)) {
    return { success: false, error: "Only admins can create sub-categories." };
  }

  const { data, error } = await supabase
    .from("sub_categories")
    .insert({
      name: input.name,
      slug: input.slug,
      description: input.description || null,
      icon: input.icon || null,
      image: input.image || null,
      category_id: input.categoryId,
      category_slug: input.categorySlug,
      is_active: true,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath(`/categories/${input.categorySlug}`);
  return { success: true, data };
}

export async function updateSubCategory(subCategoryId: string, input: Record<string, unknown>): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "super_admin"].includes(profile.role)) {
    return { success: false, error: "Only admins can update sub-categories." };
  }

  const { data, error } = await supabase
    .from("sub_categories")
    .update(input)
    .eq("id", subCategoryId)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/products");
  revalidatePath("/products");
  return { success: true, data };
}

export async function deleteSubCategory(subCategoryId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "super_admin"].includes(profile.role)) {
    return { success: false, error: "Only admins can delete sub-categories." };
  }

  const { error } = await supabase
    .from("sub_categories")
    .update({ is_active: false })
    .eq("id", subCategoryId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/products");
  revalidatePath("/products");
  return { success: true };
}

// --- Order Actions (staff only) ---

export async function createOrder(input: {
  customerId: string;
  items: Array<{
    productId: string | null;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    imageUrl?: string;
  }>;
  shippingAddress?: Record<string, string>;
  notes?: string;
  currency?: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile) return { success: false, error: "Profile not found." };

  const staffRoles = ["sales_rep", "support_agent", "warehouse_staff", "logistics_staff", "operations_manager", "admin", "super_admin"];
  if (!staffRoles.includes(profile.role)) {
    return { success: false, error: "Only staff can create orders." };
  }

  const orderNumber = `AW-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 100000)).padStart(5, "0")}`;
  const totalAmount = input.items.reduce((sum, item) => sum + item.totalPrice, 0);

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      order_number: orderNumber,
      customer_id: input.customerId,
      status: "pending",
      total_amount: totalAmount,
      currency: input.currency || "USD",
      payment_status: "pending",
      shipping_address: input.shippingAddress || null,
      notes: input.notes || null,
    })
    .select()
    .single();

  if (orderError || !order) {
    return { success: false, error: orderError?.message || "Failed to create order." };
  }

  const orderItems = input.items.map((item) => ({
    order_id: order.id,
    product_id: item.productId,
    product_name: item.productName,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    total_price: item.totalPrice,
    image_url: item.imageUrl || null,
  }));

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItems);

  if (itemsError) return { success: false, error: itemsError.message };

  revalidatePath("/admin/orders");
  revalidatePath("/dashboard/orders");
  return { success: true, data: order };
}

export async function updateOrderStatus(orderId: string, status: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile) return { success: false, error: "Profile not found." };

  const staffRoles = ["sales_rep", "support_agent", "warehouse_staff", "logistics_staff", "operations_manager", "admin", "super_admin"];
  if (!staffRoles.includes(profile.role)) {
    return { success: false, error: "Only staff can update order status." };
  }

  const { data, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/orders");
  revalidatePath("/dashboard/orders");
  return { success: true, data };
}

// --- Shipment Actions (staff only) ---

export async function createShipment(input: {
  orderId: string;
  customerId: string;
  carrier: string;
  trackingNumber?: string;
  destinationCountry: string;
  estimatedDelivery?: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile) return { success: false, error: "Profile not found." };

  const staffRoles = ["warehouse_staff", "logistics_staff", "operations_manager", "admin", "super_admin"];
  if (!staffRoles.includes(profile.role)) {
    return { success: false, error: "Only logistics staff can create shipments." };
  }

  const shipmentNumber = `SHP-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 100000)).padStart(5, "0")}`;

  const { data, error } = await supabase
    .from("shipments")
    .insert({
      shipment_number: shipmentNumber,
      order_id: input.orderId,
      customer_id: input.customerId,
      carrier: input.carrier,
      tracking_number: input.trackingNumber || null,
      status: "preparing",
      destination_country: input.destinationCountry,
      estimated_delivery: input.estimatedDelivery || null,
      milestones: [
        { status: "Sourced", timestamp: new Date().toISOString(), location: "Shenzhen, China", completed: true },
      ],
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/shipments");
  revalidatePath("/dashboard/shipments");
  return { success: true, data };
}

export async function updateShipmentStatus(
  shipmentId: string,
  status: string,
  milestone?: { status: string; location: string; note?: string }
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile) return { success: false, error: "Profile not found." };

  const staffRoles = ["warehouse_staff", "logistics_staff", "operations_manager", "admin", "super_admin"];
  if (!staffRoles.includes(profile.role)) {
    return { success: false, error: "Only logistics staff can update shipments." };
  }

  if (milestone) {
    const { data: shipment } = await supabase
      .from("shipments")
      .select("milestones")
      .eq("id", shipmentId)
      .single();

    const existingMilestones = shipment?.milestones || [];
    const newMilestone = {
      ...milestone,
      timestamp: new Date().toISOString(),
      completed: true,
    };

    const { data, error } = await supabase
      .from("shipments")
      .update({
        status,
        milestones: [...existingMilestones, newMilestone],
      })
      .eq("id", shipmentId)
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    revalidatePath("/admin/shipments");
    revalidatePath("/dashboard/shipments");
    return { success: true, data };
  }

  const { data, error } = await supabase
    .from("shipments")
    .update({ status })
    .eq("id", shipmentId)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/shipments");
  revalidatePath("/dashboard/shipments");
  return { success: true, data };
}

// --- Customer Actions ---

export async function updateCustomerProfile(
  customerId: string,
  input: {
    companyName?: string;
    contactName?: string;
    email?: string;
    phone?: string;
    country?: string;
    city?: string;
    address?: string;
  }
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const updateData: Record<string, unknown> = {};
  if (input.companyName !== undefined) updateData.company_name = input.companyName;
  if (input.contactName !== undefined) updateData.contact_name = input.contactName;
  if (input.email !== undefined) updateData.email = input.email;
  if (input.phone !== undefined) updateData.phone = input.phone;
  if (input.country !== undefined) updateData.country = input.country;
  if (input.city !== undefined) updateData.city = input.city;
  if (input.address !== undefined) updateData.address = input.address;

  const { data, error } = await supabase
    .from("customers")
    .update(updateData)
    .eq("id", customerId)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/profile");
  revalidatePath("/admin/customers");
  return { success: true, data };
}

export async function updateCustomerVerification(customerId: string, status: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "super_admin", "operations_manager"].includes(profile.role)) {
    return { success: false, error: "Only admins can update verification status." };
  }

  const { data, error } = await supabase
    .from("customers")
    .update({ verification_status: status })
    .eq("id", customerId)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/customers");
  return { success: true, data };
}

// --- Staff Actions (admin only) ---

export async function createStaffMember(input: {
  userId: string;
  employeeId?: string;
  department: string;
  position?: string;
  hireDate?: string;
  role?: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "super_admin"].includes(profile.role)) {
    return { success: false, error: "Only admins can add staff members." };
  }

  const { data, error } = await supabase
    .from("staff")
    .insert({
      user_id: input.userId,
      employee_id: input.employeeId || null,
      department: input.department,
      position: input.position || null,
      hire_date: input.hireDate || new Date().toISOString().split("T")[0],
      is_active: true,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  // If a role was provided, update the user's profile role
  if (input.role) {
    const validRoles = ["customer", "sales_rep", "support_agent", "warehouse_staff", "logistics_staff", "operations_manager", "admin", "super_admin"];
    if (!validRoles.includes(input.role)) {
      return { success: false, error: "Invalid role specified." };
    }

    const { error: roleError } = await supabase
      .from("profiles")
      .update({ role: input.role })
      .eq("id", input.userId);

    if (roleError) {
      return { success: false, error: roleError.message };
    }
  }

  revalidatePath("/admin/staff");
  return { success: true, data };
}

export async function updateUserRole(userId: string, role: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "super_admin"].includes(profile.role)) {
    return { success: false, error: "Only admins can change user roles." };
  }

  // Prevent admin from changing their own role (self-lockout guard)
  if (user.id === userId) {
    return { success: false, error: "You cannot change your own role." };
  }

  const validRoles = ["customer", "sales_rep", "support_agent", "warehouse_staff", "logistics_staff", "operations_manager", "admin", "super_admin"];
  if (!validRoles.includes(role)) {
    return { success: false, error: "Invalid role specified." };
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/staff");
  revalidatePath("/admin/customers");
  return { success: true, data };
}

export async function updateStaffMember(
  staffId: string,
  input: { department?: string; position?: string; employeeId?: string; isActive?: boolean }
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "super_admin"].includes(profile.role)) {
    return { success: false, error: "Only admins can update staff members." };
  }

  const updateData: Record<string, unknown> = {};
  if (input.department !== undefined) updateData.department = input.department;
  if (input.position !== undefined) updateData.position = input.position;
  if (input.employeeId !== undefined) updateData.employee_id = input.employeeId;
  if (input.isActive !== undefined) updateData.is_active = input.isActive;

  const { data, error } = await supabase
    .from("staff")
    .update(updateData)
    .eq("id", staffId)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/staff");
  return { success: true, data };
}

// --- Profile Actions ---

export async function updateProfile(input: {
  firstName?: string;
  lastName?: string;
  company?: string;
  phone?: string;
  country?: string;
  avatarUrl?: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const updateData: Record<string, unknown> = {};
  if (input.firstName !== undefined) updateData.first_name = input.firstName;
  if (input.lastName !== undefined) updateData.last_name = input.lastName;
  if (input.company !== undefined) updateData.company = input.company;
  if (input.phone !== undefined) updateData.phone = input.phone;
  if (input.country !== undefined) updateData.country = input.country;
  if (input.avatarUrl !== undefined) updateData.avatar_url = input.avatarUrl;

  const { data, error } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", user.id)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard");
  return { success: true, data };
}

// --- File Upload Actions ---

export async function uploadFile(bucket: string, filePath: string, file: File): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) return { success: false, error: error.message };

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return { success: true, data: { path: data.path, url: urlData.publicUrl } };
}

export async function uploadProductImages(files: File[]): Promise<ActionResult & { data?: { urls: string[] } }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "super_admin"].includes(profile.role)) {
    return { success: false, error: "Only admins can upload product images." };
  }

  const urls: string[] = [];
  const errors: string[] = [];

  for (const file of files) {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      errors.push(`${file.name} is not an image`);
      continue;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      errors.push(`${file.name} exceeds 10MB limit`);
      continue;
    }

    // Generate unique file path
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${ext}`;
    const filePath = `products/${fileName}`;

    const { data, error } = await supabase.storage
      .from("product-images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      errors.push(`${file.name}: ${error.message}`);
      continue;
    }

    const { data: urlData } = supabase.storage
      .from("product-images")
      .getPublicUrl(data.path);

    urls.push(urlData.publicUrl);
  }

  if (urls.length === 0) {
    return { success: false, error: errors.join("; ") || "No images were uploaded" };
  }

  return { success: true, data: { urls }, error: errors.length > 0 ? errors.join("; ") : undefined };
}

export async function deleteProductImage(filePath: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "super_admin"].includes(profile.role)) {
    return { success: false, error: "Only admins can delete product images." };
  }

  const { error } = await supabase.storage
    .from("product-images")
    .remove([filePath]);

  if (error) return { success: false, error: error.message };

  return { success: true };
}
