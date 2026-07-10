import type {
  Category,
  Conversation,
  Customer,
  FAQItem,
  Message,
  Order,
  Product,
  QuoteRequest,
  Shipment,
  StatItem,
  SubCategory,
  Testimonial,
} from "@/types";

// ========================================================
// Mock Data — AfrikWholesaler
// ========================================================

export const categories: Category[] = [
  {
    id: "cat-1",
    name: "Electronics",
    slug: "electronics",
    icon: "Smartphone",
    productCount: 1240,
    image:
      "https://images.unsplash.com/photo-1498049794561-673ee4ac0881?w=600&q=80",
    subCategoryIds: ["sub-1", "sub-2", "sub-3"],
  },
  {
    id: "cat-2",
    name: "Textiles & Apparel",
    slug: "textiles-apparel",
    icon: "Shirt",
    productCount: 890,
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80",
    subCategoryIds: ["sub-4", "sub-5"],
  },
  {
    id: "cat-3",
    name: "Machinery & Tools",
    slug: "machinery-tools",
    icon: "Wrench",
    productCount: 567,
    image:
      "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=600&q=80",
    subCategoryIds: ["sub-6", "sub-7"],
  },
  {
    id: "cat-4",
    name: "Home & Garden",
    slug: "home-garden",
    icon: "Home",
    productCount: 432,
    image:
      "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=600&q=80",
    subCategoryIds: ["sub-8", "sub-9"],
  },
  {
    id: "cat-5",
    name: "Beauty & Personal Care",
    slug: "beauty-personal-care",
    icon: "Sparkles",
    productCount: 321,
    image:
      "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=80",
    subCategoryIds: ["sub-10", "sub-11"],
  },
  {
    id: "cat-6",
    name: "Automotive Parts",
    slug: "automotive-parts",
    icon: "Car",
    productCount: 278,
    image:
      "https://images.unsplash.com/photo-1486262715619-67ee85b12da1?w=600&q=80",
    subCategoryIds: ["sub-12", "sub-13"],
  },
  {
    id: "cat-7",
    name: "Construction Materials",
    slug: "construction-materials",
    icon: "Building2",
    productCount: 189,
    image:
      "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=600&q=80",
    subCategoryIds: ["sub-14", "sub-15"],
  },
  {
    id: "cat-8",
    name: "Packaging & Printing",
    slug: "packaging-printing",
    icon: "Package",
    productCount: 156,
    image:
      "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&q=80",
    subCategoryIds: ["sub-16", "sub-17"],
  },
];

// ========================================================
// Sub-Categories
// ========================================================

export const subCategories: SubCategory[] = [
  // Electronics
  { id: "sub-1", name: "Chargers & Adapters", slug: "chargers-adapters", icon: "Plug", image: "", categoryId: "cat-1", categorySlug: "electronics", productCount: 320 },
  { id: "sub-2", name: "Audio Devices", slug: "audio-devices", icon: "Headphones", image: "", categoryId: "cat-1", categorySlug: "electronics", productCount: 280 },
  { id: "sub-3", name: "Lighting", slug: "lighting", icon: "Lightbulb", image: "", categoryId: "cat-1", categorySlug: "electronics", productCount: 195 },
  // Textiles & Apparel
  { id: "sub-4", name: "T-Shirts & Tops", slug: "tshirts-tops", icon: "Shirt", image: "", categoryId: "cat-2", categorySlug: "textiles-apparel", productCount: 340 },
  { id: "sub-5", name: "Activewear", slug: "activewear", icon: "Activity", image: "", categoryId: "cat-2", categorySlug: "textiles-apparel", productCount: 210 },
  // Machinery & Tools
  { id: "sub-6", name: "Power Tools", slug: "power-tools", icon: "Drill", image: "", categoryId: "cat-3", categorySlug: "machinery-tools", productCount: 180 },
  { id: "sub-7", name: "Hand Tools", slug: "hand-tools", icon: "Wrench", image: "", categoryId: "cat-3", categorySlug: "machinery-tools", productCount: 150 },
  // Home & Garden
  { id: "sub-8", name: "Kitchenware", slug: "kitchenware", icon: "Utensils", image: "", categoryId: "cat-4", categorySlug: "home-garden", productCount: 165 },
  { id: "sub-9", name: "Decor", slug: "decor", icon: "Sofa", image: "", categoryId: "cat-4", categorySlug: "home-garden", productCount: 120 },
  // Beauty & Personal Care
  { id: "sub-10", name: "Skincare", slug: "skincare", icon: "Sparkles", image: "", categoryId: "cat-5", categorySlug: "beauty-personal-care", productCount: 140 },
  { id: "sub-11", name: "Hair Care", slug: "hair-care", icon: "Scissors", image: "", categoryId: "cat-5", categorySlug: "beauty-personal-care", productCount: 95 },
  // Automotive Parts
  { id: "sub-12", name: "Engine Parts", slug: "engine-parts", icon: "Cog", image: "", categoryId: "cat-6", categorySlug: "automotive-parts", productCount: 110 },
  { id: "sub-13", name: "Accessories", slug: "auto-accessories", icon: "Car", image: "", categoryId: "cat-6", categorySlug: "automotive-parts", productCount: 85 },
  // Construction Materials
  { id: "sub-14", name: "Cement & Concrete", slug: "cement-concrete", icon: "Box", image: "", categoryId: "cat-7", categorySlug: "construction-materials", productCount: 70 },
  { id: "sub-15", name: "Roofing", slug: "roofing", icon: "Home", image: "", categoryId: "cat-7", categorySlug: "construction-materials", productCount: 55 },
  // Packaging & Printing
  { id: "sub-16", name: "Shipping Supplies", slug: "shipping-supplies", icon: "Package", image: "", categoryId: "cat-8", categorySlug: "packaging-printing", productCount: 65 },
  { id: "sub-17", name: "Printing Materials", slug: "printing-materials", icon: "Printer", image: "", categoryId: "cat-8", categorySlug: "packaging-printing", productCount: 48 },
];

export const products: Product[] = [
  {
    id: "prod-1",
    slug: "wholesale-usb-c-chargers-20w",
    name: "Wholesale USB-C Fast Chargers 20W",
    description:
      "High-quality 20W USB-C power adapters with PD fast charging support. Compatible with iPhone, Samsung, and other USB-C devices. CE/FCC/RoHS certified.",
    category: "Electronics",
    categorySlug: "electronics",
    subCategory: "Chargers & Adapters",
    subCategorySlug: "chargers-adapters",
    images: [
      "https://images.unsplash.com/photo-1583863788434-e58a36330269?w=800&q=80",
    ],
    originCountry: "China",
    moq: 100,
    priceTiers: [
      { minQuantity: 100, maxQuantity: 499, price: 3.2, currency: "USD" },
      { minQuantity: 500, maxQuantity: 999, price: 2.8, currency: "USD" },
      { minQuantity: 1000, maxQuantity: null, price: 2.4, currency: "USD" },
    ],
    stockStatus: "In Stock",
    badges: ["Best Seller", "Fast Shipping"],
    specs: [
      { label: "Power Output", value: "20W" },
      { label: "Connector", value: "USB-C" },
      { label: "Certification", value: "CE/FCC/RoHS" },
      { label: "Input", value: "100-240V AC" },
    ],
    shippingEstimate: 1.2,
    importTaxEstimate: 0.3,
    deliveryEstimate: "15-25 days",
    featured: true,
    rating: 4.8,
    reviewCount: 124,
  },
  {
    id: "prod-2",
    slug: "bulk-cotton-t-shirts-180gsm",
    name: "Bulk Cotton T-Shirts 180gsm",
    description:
      "Premium 100% cotton t-shirts at 180gsm weight. Available in 20+ colors and sizes S-3XL. Custom branding and screen printing available.",
    category: "Textiles & Apparel",
    categorySlug: "textiles-apparel",
    subCategory: "T-Shirts & Tops",
    subCategorySlug: "tshirts-tops",
    images: [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80",
    ],
    originCountry: "China",
    moq: 200,
    priceTiers: [
      { minQuantity: 200, maxQuantity: 499, price: 2.5, currency: "USD" },
      { minQuantity: 500, maxQuantity: 1999, price: 2.1, currency: "USD" },
      { minQuantity: 2000, maxQuantity: null, price: 1.8, currency: "USD" },
    ],
    stockStatus: "In Stock",
    badges: ["Featured", "Wholesale"],
    specs: [
      { label: "Material", value: "100% Cotton" },
      { label: "Weight", value: "180gsm" },
      { label: "Sizes", value: "S-3XL" },
      { label: "Colors", value: "20+ available" },
    ],
    shippingEstimate: 0.8,
    importTaxEstimate: 0.2,
    deliveryEstimate: "20-30 days",
    featured: true,
    rating: 4.7,
    reviewCount: 89,
  },
  {
    id: "prod-3",
    slug: "industrial-led-flood-lights-100w",
    name: "Industrial LED Flood Lights 100W",
    description:
      "High-efficiency 100W LED flood lights for industrial and outdoor use. IP65 waterproof rating, 50,000+ hour lifespan. Energy-saving alternative to traditional halogen.",
    category: "Electronics",
    categorySlug: "electronics",
    subCategory: "Lighting",
    subCategorySlug: "lighting",
    images: [
      "https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=800&q=80",
    ],
    originCountry: "China",
    moq: 50,
    priceTiers: [
      { minQuantity: 50, maxQuantity: 199, price: 18.5, currency: "USD" },
      { minQuantity: 200, maxQuantity: 499, price: 16.0, currency: "USD" },
      { minQuantity: 500, maxQuantity: null, price: 13.5, currency: "USD" },
    ],
    stockStatus: "In Stock",
    badges: ["Premium", "AI Recommended"],
    specs: [
      { label: "Power", value: "100W" },
      { label: "Lumens", value: "10,000 lm" },
      { label: "IP Rating", value: "IP65" },
      { label: "Lifespan", value: "50,000+ hours" },
    ],
    shippingEstimate: 3.5,
    importTaxEstimate: 0.8,
    deliveryEstimate: "18-28 days",
    featured: true,
    rating: 4.9,
    reviewCount: 67,
  },
  {
    id: "prod-4",
    slug: "wholesale-bluetooth-earbuds-5-3",
    name: "Wholesale Bluetooth Earbuds 5.3",
    description:
      "True wireless earbuds with Bluetooth 5.3, active noise cancellation, and 30-hour battery life with charging case. Custom packaging available.",
    category: "Electronics",
    categorySlug: "electronics",
    subCategory: "Audio Devices",
    subCategorySlug: "audio-devices",
    images: [
      "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80",
    ],
    originCountry: "China",
    moq: 100,
    priceTiers: [
      { minQuantity: 100, maxQuantity: 499, price: 8.5, currency: "USD" },
      { minQuantity: 500, maxQuantity: 999, price: 7.2, currency: "USD" },
      { minQuantity: 1000, maxQuantity: null, price: 6.0, currency: "USD" },
    ],
    stockStatus: "In Stock",
    badges: ["New", "Best Seller"],
    specs: [
      { label: "Bluetooth", value: "5.3" },
      { label: "Battery", value: "30 hours (with case)" },
      { label: "ANC", value: "Yes" },
      { label: "Water Resistance", value: "IPX4" },
    ],
    shippingEstimate: 1.0,
    importTaxEstimate: 0.25,
    deliveryEstimate: "15-25 days",
    featured: true,
    rating: 4.6,
    reviewCount: 203,
  },
  {
    id: "prod-5",
    slug: "bulk-ceramic-mugs-350ml",
    name: "Bulk Ceramic Mugs 350ml",
    description:
      "Classic white ceramic coffee mugs, 350ml capacity. Dishwasher and microwave safe. Custom logo printing available for corporate orders.",
    category: "Home & Garden",
    categorySlug: "home-garden",
    subCategory: "Kitchenware",
    subCategorySlug: "kitchenware",
    images: [
      "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800&q=80",
    ],
    originCountry: "China",
    moq: 500,
    priceTiers: [
      { minQuantity: 500, maxQuantity: 1999, price: 1.2, currency: "USD" },
      { minQuantity: 2000, maxQuantity: 4999, price: 0.95, currency: "USD" },
      { minQuantity: 5000, maxQuantity: null, price: 0.75, currency: "USD" },
    ],
    stockStatus: "In Stock",
    badges: ["Wholesale", "Fast Shipping"],
    specs: [
      { label: "Capacity", value: "350ml" },
      { label: "Material", value: "Ceramic" },
      { label: "Microwave Safe", value: "Yes" },
      { label: "Dishwasher Safe", value: "Yes" },
    ],
    shippingEstimate: 0.5,
    importTaxEstimate: 0.1,
    deliveryEstimate: "20-35 days",
    featured: true,
    rating: 4.5,
    reviewCount: 45,
  },
  {
    id: "prod-6",
    slug: "cordless-drill-set-21v",
    name: "Cordless Drill Set 21V",
    description:
      "Professional 21V cordless drill set with 2 batteries, charger, and 30-piece accessory kit. Brushless motor for extended life and power.",
    category: "Machinery & Tools",
    categorySlug: "machinery-tools",
    subCategory: "Power Tools",
    subCategorySlug: "power-tools",
    images: [
      "https://images.unsplash.com/photo-1504148455338-c2583d470217?w=800&q=80",
    ],
    originCountry: "China",
    moq: 30,
    priceTiers: [
      { minQuantity: 30, maxQuantity: 99, price: 42.0, currency: "USD" },
      { minQuantity: 100, maxQuantity: 299, price: 38.0, currency: "USD" },
      { minQuantity: 300, maxQuantity: null, price: 32.0, currency: "USD" },
    ],
    stockStatus: "Low Stock",
    badges: ["Premium", "Limited Stock"],
    specs: [
      { label: "Voltage", value: "21V" },
      { label: "Motor", value: "Brushless" },
      { label: "Batteries", value: "2x 2.0Ah" },
      { label: "Accessories", value: "30 pieces" },
    ],
    shippingEstimate: 5.0,
    importTaxEstimate: 1.5,
    deliveryEstimate: "20-30 days",
    featured: true,
    rating: 4.8,
    reviewCount: 34,
  },
  {
    id: "prod-7",
    slug: "wholesale-skincare-set-natural",
    name: "Wholesale Natural Skincare Set",
    description:
      "Complete skincare set with cleanser, toner, serum, and moisturizer. Natural ingredients, cruelty-free, suitable for all skin types. Private label available.",
    category: "Beauty & Personal Care",
    categorySlug: "beauty-personal-care",
    subCategory: "Skincare",
    subCategorySlug: "skincare",
    images: [
      "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=800&q=80",
    ],
    originCountry: "China",
    moq: 100,
    priceTiers: [
      { minQuantity: 100, maxQuantity: 499, price: 12.5, currency: "USD" },
      { minQuantity: 500, maxQuantity: 999, price: 10.8, currency: "USD" },
      { minQuantity: 1000, maxQuantity: null, price: 8.5, currency: "USD" },
    ],
    stockStatus: "In Stock",
    badges: ["New", "Featured"],
    specs: [
      { label: "Pieces", value: "4 (cleanser, toner, serum, moisturizer)" },
      { label: "Ingredients", value: "Natural, cruelty-free" },
      { label: "Skin Type", value: "All types" },
      { label: "Private Label", value: "Available" },
    ],
    shippingEstimate: 2.0,
    importTaxEstimate: 0.5,
    deliveryEstimate: "18-28 days",
    featured: true,
    rating: 4.7,
    reviewCount: 56,
  },
  {
    id: "prod-8",
    slug: "bulk-corrugated-shipping-boxes",
    name: "Bulk Corrugated Shipping Boxes",
    description:
      "Heavy-duty corrugated cardboard shipping boxes in various sizes. 3-layer construction for maximum protection. Custom sizes and printing available.",
    category: "Packaging & Printing",
    categorySlug: "packaging-printing",
    subCategory: "Shipping Supplies",
    subCategorySlug: "shipping-supplies",
    images: [
      "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&q=80",
    ],
    originCountry: "China",
    moq: 1000,
    priceTiers: [
      { minQuantity: 1000, maxQuantity: 4999, price: 0.45, currency: "USD" },
      { minQuantity: 5000, maxQuantity: 9999, price: 0.38, currency: "USD" },
      { minQuantity: 10000, maxQuantity: null, price: 0.3, currency: "USD" },
    ],
    stockStatus: "In Stock",
    badges: ["Wholesale", "Fast Shipping"],
    specs: [
      { label: "Material", value: "3-layer corrugated" },
      { label: "Sizes", value: "Multiple available" },
      { label: "Custom Print", value: "Available" },
      { label: "Eco-Friendly", value: "Recyclable" },
    ],
    shippingEstimate: 0.15,
    importTaxEstimate: 0.05,
    deliveryEstimate: "15-25 days",
    featured: false,
    rating: 4.4,
    reviewCount: 28,
  },
];

export const testimonials: Testimonial[] = [
  {
    id: "test-1",
    name: "Amadou Diallo",
    company: "Diallo Distribution SARL",
    country: "Senegal",
    avatar: "https://images.unsplash.com/photo-1507003211169-0cff1ba7a129?w=200&q=80",
    rating: 5,
    quote:
      "AfrikWholesaler transformed our import business. The quality inspection service means we receive exactly what we ordered, every time. No more surprises from Chinese factories.",
  },
  {
    id: "test-2",
    name: "Fatima Okonkwo",
    company: "Okonkwo Trading Co.",
    country: "Nigeria",
    avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&q=80",
    rating: 5,
    quote:
      "The AI sourcing assistant helped me find the right products in minutes instead of weeks. The shipping cost calculator removed all the guesswork from my budgeting.",
  },
  {
    id: "test-3",
    name: "Jean-Pierre Mbeki",
    company: "Mbeki Import Solutions",
    country: "Cameroon",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80",
    rating: 5,
    quote:
      "What sets AfrikWholesaler apart is the end-to-end service. From sourcing to customs clearance to delivery, they handle everything. My business has grown 3x since I started using them.",
  },
  {
    id: "test-4",
    name: "Grace Achieng",
    company: "Achieng Wholesale Ltd",
    country: "Kenya",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80",
    rating: 5,
    quote:
      "The bulk pricing tiers are transparent and fair. I can plan my purchases with confidence knowing exactly what I'll pay at each quantity level. The live chat support is excellent too.",
  },
];

export const faqs: FAQItem[] = [
  {
    id: "faq-1",
    question: "How does AfrikWholesaler work?",
    answer:
      "AfrikWholesaler is your single sourcing partner. You browse our catalog or request a quote for specific products. We handle sourcing from Chinese manufacturers, quality control, logistics, and delivery to your location in Africa. You deal only with us — never with factories directly.",
    category: "General",
  },
  {
    id: "faq-2",
    question: "What is the minimum order quantity (MOQ)?",
    answer:
      "Each product has its own MOQ set by the manufacturer. You can see the MOQ on every product page. If you need a smaller quantity, you can submit a quote request and our team will explore options including MOQ pooling with other buyers.",
    category: "Orders",
  },
  {
    id: "faq-3",
    question: "How are shipping and import taxes calculated?",
    answer:
      "Shipping and import tax estimates are shown on each product page based on destination country. These are estimates only — actual costs are confirmed at the quote stage by our team. We handle all customs documentation and clearance on your behalf.",
    category: "Shipping",
  },
  {
    id: "faq-4",
    question: "What payment methods do you accept?",
    answer:
      "We support multiple payment methods including bank transfer, Stripe, Paystack, and Flutterwave depending on your country. For large B2B orders, we offer milestone-based payment plans (deposit on order, balance on shipment).",
    category: "Payments",
  },
  {
    id: "faq-5",
    question: "Do you offer quality inspection?",
    answer:
      "Yes. Every order goes through our quality control process before shipping. We inspect products against your specifications, check for defects, and provide a QC report with photos. This is included in our service at no extra cost.",
    category: "Quality",
  },
  {
    id: "faq-6",
    question: "Can I customize or private-label products?",
    answer:
      "Absolutely. Many of our products support custom branding, packaging, and modifications. Submit a quote request with your customization requirements and our team will source the right manufacturer for your needs.",
    category: "Products",
  },
  {
    id: "faq-7",
    question: "How long does delivery take?",
    answer:
      "Delivery typically takes 15-35 days depending on the product, quantity, and destination. Each product page shows an estimated delivery range. You'll receive tracking updates at every milestone: Sourced → QC → Shipped → Customs → Delivered.",
    category: "Shipping",
  },
  {
    id: "faq-8",
    question: "What if I receive defective products?",
    answer:
      "Our quality inspection catches most issues before shipping. However, if you receive defective products, contact our support team within 7 days. We'll arrange replacements or refunds based on the issue and our terms of service.",
    category: "Quality",
  },
];

export const stats: StatItem[] = [
  {
    id: "stat-1",
    label: "Products Sourced",
    value: 12000,
    suffix: "+",
    icon: "Package",
  },
  {
    id: "stat-2",
    label: "Countries Served",
    value: 24,
    suffix: "",
    icon: "Globe",
  },
  {
    id: "stat-3",
    label: "Active Customers",
    value: 3500,
    suffix: "+",
    icon: "Users",
  },
  {
    id: "stat-4",
    label: "QC Pass Rate",
    value: 99,
    suffix: "%",
    icon: "ShieldCheck",
  },
];

export const sourcingSteps = [
  {
    id: "step-1",
    title: "Source",
    description:
      "We identify and negotiate with the best Chinese manufacturers for your product requirements.",
    icon: "Search",
  },
  {
    id: "step-2",
    title: "Quality Check",
    description:
      "Every product is inspected against your specifications with a detailed QC report and photos.",
    icon: "ShieldCheck",
  },
  {
    id: "step-3",
    title: "Ship",
    description:
      "We handle packaging, shipping, and all customs documentation for delivery to your country.",
    icon: "Truck",
  },
  {
    id: "step-4",
    title: "Deliver",
    description:
      "Track your shipment in real-time through every milestone until it reaches your doorstep.",
    icon: "PackageCheck",
  },
];

export const howItWorksSteps = [
  {
    id: "hw-1",
    title: "Browse or Request",
    description:
      "Explore our catalog or submit a quote request for specific products with your target quantity and price.",
    icon: "Search",
  },
  {
    id: "hw-2",
    title: "Receive a Quote",
    description:
      "Our team sources the best options and sends you a detailed quote with pricing, shipping, and delivery timeline.",
    icon: "FileText",
  },
  {
    id: "hw-3",
    title: "Confirm & Track",
    description:
      "Approve the quote, make payment, and track your order through every milestone from sourcing to delivery.",
    icon: "CheckCircle",
  },
];

export const valueProps = [
  {
    id: "vp-1",
    title: "Quality You Can Trust",
    description:
      "Every product undergoes rigorous quality inspection before shipping. You receive exactly what you ordered — guaranteed.",
    icon: "ShieldCheck",
  },
  {
    id: "vp-2",
    title: "Transparent Pricing",
    description:
      "Clear bulk pricing tiers, shipping estimates, and import tax calculations upfront. No hidden fees, no surprises.",
    icon: "BadgeDollarSign",
  },
  {
    id: "vp-3",
    title: "End-to-End Logistics",
    description:
      "From factory to your doorstep — we handle sourcing, QC, shipping, customs clearance, and delivery.",
    icon: "Truck",
  },
  {
    id: "vp-4",
    title: "AI-Powered Sourcing",
    description:
      "Our AI assistant helps you find the right products, estimate costs, and get instant recommendations.",
    icon: "Sparkles",
  },
  {
    id: "vp-5",
    title: "Dedicated Support",
    description:
      "Real humans available via live chat to answer questions, handle concerns, and guide you through every order.",
    icon: "Headphones",
  },
  {
    id: "vp-6",
    title: "Secure Payments",
    description:
      "Multiple payment options with milestone-based payment plans for large B2B orders. Your money is protected.",
    icon: "Lock",
  },
];

// ========================================================
// Mock Data — Customer, Orders, Shipments, Quotes, Chat
// ========================================================

export const currentCustomer: Customer = {
  id: "cust-1",
  email: "amadou.diallo@diallodistribution.com",
  firstName: "Amadou",
  lastName: "Diallo",
  phone: "+221 77 123 45 67",
  company: "Diallo Distribution SARL",
  verificationStatus: "Verified",
  addresses: [
    {
      id: "addr-1",
      label: "Warehouse",
      street: "123 Rue du Commerce, Plateau",
      city: "Dakar",
      country: "Senegal",
      postalCode: "BP 1234",
      isDefault: true,
    },
    {
      id: "addr-2",
      label: "Office",
      street: "45 Avenue Cheikh Anta Diop",
      city: "Dakar",
      country: "Senegal",
      postalCode: "BP 5678",
      isDefault: false,
    },
  ],
  createdAt: "2024-03-15T10:00:00Z",
};

export const orders: Order[] = [
  {
    id: "order-1",
    orderNumber: "AW-2024-00123",
    customerId: "cust-1",
    items: [
      {
        productId: "prod-1",
        productName: "Wholesale USB-C Fast Chargers 20W",
        productImage:
          "https://images.unsplash.com/photo-1583863788434-e58a36330269?w=200&q=80",
        quantity: 500,
        unitPrice: 2.8,
        totalPrice: 1400,
      },
      {
        productId: "prod-4",
        productName: "Wholesale Bluetooth Earbuds 5.3",
        productImage:
          "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=200&q=80",
        quantity: 200,
        unitPrice: 8.5,
        totalPrice: 1700,
      },
    ],
    status: "Shipped",
    totalAmount: 3100,
    currency: "USD",
    createdAt: "2024-06-01T08:00:00Z",
    updatedAt: "2024-06-10T14:00:00Z",
  },
  {
    id: "order-2",
    orderNumber: "AW-2024-00124",
    customerId: "cust-1",
    items: [
      {
        productId: "prod-2",
        productName: "Bulk Cotton T-Shirts 180gsm",
        productImage:
          "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200&q=80",
        quantity: 1000,
        unitPrice: 2.1,
        totalPrice: 2100,
      },
    ],
    status: "Quality Check",
    totalAmount: 2100,
    currency: "USD",
    createdAt: "2024-06-15T09:00:00Z",
    updatedAt: "2024-06-18T11:00:00Z",
  },
  {
    id: "order-3",
    orderNumber: "AW-2024-00118",
    customerId: "cust-1",
    items: [
      {
        productId: "prod-3",
        productName: "Industrial LED Flood Lights 100W",
        productImage:
          "https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=200&q=80",
        quantity: 100,
        unitPrice: 16.0,
        totalPrice: 1600,
      },
    ],
    status: "Delivered",
    totalAmount: 1600,
    currency: "USD",
    createdAt: "2024-05-01T08:00:00Z",
    updatedAt: "2024-05-28T16:00:00Z",
  },
  {
    id: "order-4",
    orderNumber: "AW-2024-00130",
    customerId: "cust-1",
    items: [
      {
        productId: "prod-7",
        productName: "Wholesale Natural Skincare Set",
        productImage:
          "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=200&q=80",
        quantity: 300,
        unitPrice: 10.8,
        totalPrice: 3240,
      },
    ],
    status: "Pending",
    totalAmount: 3240,
    currency: "USD",
    createdAt: "2024-06-20T10:00:00Z",
    updatedAt: "2024-06-20T10:00:00Z",
  },
];

export const shipments: Shipment[] = [
  {
    id: "ship-1",
    orderId: "order-1",
    carrier: "DHL Express",
    trackingNumber: "DHL-7894561230",
    estimatedDelivery: "June 25, 2024",
    milestones: [
      {
        status: "Sourced",
        location: "Shenzhen, China",
        timestamp: "2024-06-02T10:00:00Z",
        completed: true,
      },
      {
        status: "Quality Check",
        location: "Shenzhen QC Center",
        timestamp: "2024-06-05T14:00:00Z",
        completed: true,
      },
      {
        status: "Shipped",
        location: "Shenzhen, China",
        timestamp: "2024-06-08T09:00:00Z",
        completed: true,
      },
      {
        status: "In Customs",
        location: "Dakar, Senegal",
        timestamp: "2024-06-12T08:00:00Z",
        completed: false,
      },
      {
        status: "Delivered",
        location: "Dakar, Senegal",
        timestamp: "",
        completed: false,
      },
    ],
  },
  {
    id: "ship-2",
    orderId: "order-3",
    carrier: "FedEx International",
    trackingNumber: "FDX-4567891230",
    estimatedDelivery: "May 28, 2024",
    milestones: [
      {
        status: "Sourced",
        location: "Shenzhen, China",
        timestamp: "2024-05-02T10:00:00Z",
        completed: true,
      },
      {
        status: "Quality Check",
        location: "Shenzhen QC Center",
        timestamp: "2024-05-05T14:00:00Z",
        completed: true,
      },
      {
        status: "Shipped",
        location: "Shenzhen, China",
        timestamp: "2024-05-08T09:00:00Z",
        completed: true,
      },
      {
        status: "In Customs",
        location: "Dakar, Senegal",
        timestamp: "2024-05-20T08:00:00Z",
        completed: true,
      },
      {
        status: "Delivered",
        location: "Dakar, Senegal",
        timestamp: "2024-05-28T16:00:00Z",
        completed: true,
      },
    ],
  },
];

export const quoteRequests: QuoteRequest[] = [
  {
    id: "quote-1",
    productId: "prod-6",
    productName: "Cordless Drill Set 21V",
    quantity: 50,
    targetPrice: 35,
    destinationCountry: "Senegal",
    attachments: [],
    status: "Quoted",
    createdAt: "2024-06-18T10:00:00Z",
  },
  {
    id: "quote-2",
    productId: null,
    productName: "Custom LED Strip Lights 5m",
    quantity: 2000,
    targetPrice: 3.5,
    destinationCountry: "Senegal",
    attachments: ["spec-sheet.pdf"],
    status: "Under Review",
    createdAt: "2024-06-19T14:00:00Z",
  },
  {
    id: "quote-3",
    productId: "prod-5",
    productName: "Bulk Ceramic Mugs 350ml",
    quantity: 5000,
    targetPrice: 0.8,
    destinationCountry: "Senegal",
    attachments: [],
    status: "Submitted",
    createdAt: "2024-06-21T09:00:00Z",
  },
];

export const conversations: Conversation[] = [
  {
    id: "conv-1",
    customerId: "cust-1",
    customerName: "Amadou Diallo",
    assignedAgentId: "agent-1",
    priority: "Normal",
    tags: ["Order", "Shipping"],
    unreadCount: 2,
    lastMessageAt: "2024-06-21T15:30:00Z",
  },
  {
    id: "conv-2",
    customerId: "cust-1",
    customerName: "Amadou Diallo",
    assignedAgentId: null,
    priority: "High",
    tags: ["Quote", "Custom Sourcing"],
    unreadCount: 0,
    lastMessageAt: "2024-06-19T11:00:00Z",
  },
  {
    id: "conv-3",
    customerId: "cust-1",
    customerName: "Amadou Diallo",
    assignedAgentId: "agent-1",
    priority: "Low",
    tags: ["General"],
    unreadCount: 0,
    lastMessageAt: "2024-06-15T09:00:00Z",
  },
];

export const messages: Message[] = [
  {
    id: "msg-1",
    conversationId: "conv-1",
    senderId: "agent-1",
    senderRole: "agent",
    content:
      "Hello Amadou! Your order AW-2024-00123 has been shipped and is currently in transit. Expected delivery is June 25.",
    attachments: [],
    isInternalNote: false,
    createdAt: "2024-06-20T10:00:00Z",
  },
  {
    id: "msg-2",
    conversationId: "conv-1",
    senderId: "cust-1",
    senderRole: "customer",
    content: "Great! Can I get the tracking number?",
    attachments: [],
    isInternalNote: false,
    createdAt: "2024-06-20T10:05:00Z",
  },
  {
    id: "msg-3",
    conversationId: "conv-1",
    senderId: "agent-1",
    senderRole: "agent",
    content:
      "Of course! Your DHL tracking number is DHL-7894561230. You can track it on the DHL website or in your dashboard under Shipments.",
    attachments: [],
    isInternalNote: false,
    createdAt: "2024-06-20T10:10:00Z",
  },
  {
    id: "msg-4",
    conversationId: "conv-1",
    senderId: "cust-1",
    senderRole: "customer",
    content: "Thank you! Also, will the customs clearance be handled by your team?",
    attachments: [],
    isInternalNote: false,
    createdAt: "2024-06-21T15:25:00Z",
  },
  {
    id: "msg-5",
    conversationId: "conv-1",
    senderId: "agent-1",
    senderRole: "agent",
    content:
      "Yes, absolutely! We handle all customs documentation and clearance on your behalf. You don't need to worry about anything — we'll notify you once it clears customs.",
    attachments: [],
    isInternalNote: false,
    createdAt: "2024-06-21T15:30:00Z",
  },
  {
    id: "msg-6",
    conversationId: "conv-2",
    senderId: "cust-1",
    senderRole: "customer",
    content:
      "Hi, I'm looking for custom LED strip lights, 5 meters each, warm white. Need 2000 units for my store in Dakar.",
    attachments: ["spec-sheet.pdf"],
    isInternalNote: false,
    createdAt: "2024-06-19T10:00:00Z",
  },
  {
    id: "msg-7",
    conversationId: "conv-2",
    senderId: "ai-bot",
    senderRole: "ai",
    content:
      "Thanks for your request! I've forwarded your inquiry to our sourcing team. Based on similar products in our catalog, estimated pricing would be around $3.50-$4.00 per unit at 2000 qty. A sales representative will get back to you with a detailed quote within 24 hours.",
    attachments: [],
    isInternalNote: false,
    createdAt: "2024-06-19T10:01:00Z",
  },
  {
    id: "msg-8",
    conversationId: "conv-2",
    senderId: "cust-1",
    senderRole: "customer",
    content: "Perfect, looking forward to the quote!",
    attachments: [],
    isInternalNote: false,
    createdAt: "2024-06-19T11:00:00Z",
  },
];
