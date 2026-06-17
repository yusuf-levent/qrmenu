import { z } from "zod";

export const roleSchema = z.enum(["OWNER", "STAFF"]);
export const orderTypeSchema = z.enum(["DINE_IN", "PICKUP"]);
export const orderStatusSchema = z.enum([
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "COMPLETED",
  "CANCELLED"
]);
export const paymentStatusSchema = z.enum(["PENDING", "PAID", "FAILED"]);

export type Role = z.infer<typeof roleSchema>;
export type OrderType = z.infer<typeof orderTypeSchema>;
export type OrderStatus = z.infer<typeof orderStatusSchema>;
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;

const idSchema = z.string().min(1);
const positiveKurusSchema = z.number().int().min(1);

export const registerSchema = z.object({
  businessName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  password: z.string().min(8).max(128)
});

export const loginSchema = z.object({
  email: z.string().trim().email().max(160),
  password: z.string().min(1).max(128)
});

export const updateBusinessSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  logoUrl: z.string().url().nullable().optional(),
  address: z.string().trim().max(240).nullable().optional(),
  phone: z.string().trim().max(40).nullable().optional()
});

export const createCategorySchema = z.object({
  name: z.string().trim().min(2).max(80),
  sortOrder: z.number().int().min(0).default(0)
});

export const updateCategorySchema = createCategorySchema.partial();

export const createMenuItemSchema = z.object({
  categoryId: idSchema,
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(300).nullable().optional(),
  priceKurus: positiveKurusSchema,
  imageUrl: z.string().url().nullable().optional(),
  videoUrl: z.string().url().nullable().optional(),
  isAvailable: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0)
});

export const updateMenuItemSchema = createMenuItemSchema.partial();

export const createTableSchema = z.object({
  label: z.string().trim().min(1).max(60)
});

export const createOrderSchema = z.object({
  businessId: idSchema,
  tableId: idSchema.optional().nullable(),
  type: orderTypeSchema,
  items: z
    .array(
      z.object({
        menuItemId: idSchema,
        quantity: z.number().int().min(1).max(50),
        note: z.string().trim().max(240).optional().nullable()
      })
    )
    .min(1),
  note: z.string().trim().max(400).optional().nullable()
});

export const updateOrderStatusSchema = z.object({
  status: orderStatusSchema
});

export const payOrderSchema = z.object({
  splits: z
    .array(
      z.object({
        payerLabel: z.string().trim().min(1).max(60),
        amountKurus: positiveKurusSchema
      })
    )
    .optional()
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateBusinessInput = z.infer<typeof updateBusinessSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>;
export type UpdateMenuItemInput = z.infer<typeof updateMenuItemSchema>;
export type CreateTableInput = z.infer<typeof createTableSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type PayOrderInput = z.infer<typeof payOrderSchema>;

export type PublicBusiness = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  address: string | null;
  phone: string | null;
};

export type PublicTable = {
  id: string;
  label: string;
  qrToken: string;
};

export type PublicMenuItem = {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  priceKurus: number;
  imageUrl: string | null;
  videoUrl: string | null;
  sortOrder: number;
};

export type PublicCategory = {
  id: string;
  name: string;
  sortOrder: number;
  items: PublicMenuItem[];
};

export type PublicMenuResponse = {
  business: PublicBusiness;
  table?: PublicTable;
  categories: PublicCategory[];
};

export type OrderLineDraft = {
  priceKurus: number;
  quantity: number;
};

export function formatKurus(amountKurus: number): string {
  const lira = amountKurus / 100;
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY"
  }).format(lira);
}

export function calculateOrderTotal(lines: OrderLineDraft[]): number {
  return lines.reduce((total, line) => total + line.priceKurus * line.quantity, 0);
}

export function createEqualSplits(totalKurus: number, count: number): number[] {
  if (!Number.isInteger(totalKurus) || totalKurus < 1) {
    throw new Error("totalKurus must be a positive integer");
  }
  if (!Number.isInteger(count) || count < 1) {
    throw new Error("count must be a positive integer");
  }
  const base = Math.floor(totalKurus / count);
  const remainder = totalKurus % count;
  return Array.from({ length: count }, (_value, index) => base + (index < remainder ? 1 : 0));
}

export function validateSplits(totalKurus: number, splits: { amountKurus: number }[]): boolean {
  return splits.reduce((sum, split) => sum + split.amountKurus, 0) === totalKurus;
}

export const nextStatusByStatus: Record<OrderStatus, OrderStatus | null> = {
  PENDING: "CONFIRMED",
  CONFIRMED: "PREPARING",
  PREPARING: "READY",
  READY: "COMPLETED",
  COMPLETED: null,
  CANCELLED: null
};

export function canTransitionOrderStatus(current: OrderStatus, next: OrderStatus): boolean {
  if (next === "CANCELLED" && current !== "COMPLETED" && current !== "CANCELLED") {
    return true;
  }
  return nextStatusByStatus[current] === next;
}

