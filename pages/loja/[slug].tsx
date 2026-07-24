import { GetServerSideProps } from "next";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  images: string[];
  price: number;
  promo_price: number | null;
  promo_starts_at: string | null;
  promo_ends_at: string | null;
  is_available: boolean;
}

interface Store {
  id: string;
  name: string;
  business_description: string;
  subdomain: string;
  whatsapp_number: string | null;
  logo_url: string | null;
  instagram: string | null;
  facebook: string | null;
  business_hours: string | null;
  delivery_info: string | null;
  payment_methods: string | null;
}

interface CartItem {
  product: Product;
  qty: number;
}

export default function StorePage({ store, products }: { store: Store | null; products: Product[] }) {
  const [activeCategory, setActiveCategory] = useState<string>("Todos");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponMessage, setCouponMessage] = useState("");
  const [appliedDiscountPct, setAppliedDiscountPct] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (store) {
      supabase.from("store_visits").insert({ store_id: store.id }).then(() => {});
    }
  }, [store]);

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category || "Geral"));
    return ["Todos", ...Array.from(set)];
  }, [products]);

  const visibleProducts = useMemo(() => {
    let list = products;
    if (activeCategory !== "Todos") {
      list = list.filter((p) => p.category === activeCategory);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(term));
    }
    return list;
  }, [products, activeCategory, searchTerm]);

  function isOnPromo(p: Product) {
    if (!p.promo_price) return false;
    const now = Date.now();
    const start = p.promo_starts_at ? new Date(p.promo_starts_at).getTime() : 0;
    const end = p.promo_ends_at ? new Date(p.promo_ends_at).getTime() : Infinity;
    return now >= start && now <= end;
  }

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) => (i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { product, qty: 1 }];
    });
  }

  function changeQty(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((i) => (i.product.id === productId ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0)
    );
  }

  const subtotal = cart.reduce((sum, i) => {
    const price = isOnPromo(i.product) ? i.product.promo_price! : i.product.price;
    return sum + price * i.qty;
  }, 0);

  const total = subtotal - (subtotal * appliedDiscountPct) / 100;

  async function applyCoupon() {
    if (!couponCode.trim() || !store) return;
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("store_id", store.id)
      .eq("code", couponCode.trim().toUpperCase())
      .eq("active", true)
      .maybeSingle();

    if (error || !data) {
      setCouponMessage("Cupão inválido ou expirado.");
      setAppliedDiscountPct(0);
      return;
    }
    if (data.discount_type === "percent") {
      setAppliedDiscountPct(data.discount_value);
      setCouponMessage(`Cupão aplicado: ${data.discount_value}% de desconto`);
