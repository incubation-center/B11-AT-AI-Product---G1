// src/db/schema.ts
// Drizzle ORM schema for CoolHat MVP (Supabase Postgres)
//
// Notes:
// 1) This schema assumes Postgres has `gen_random_uuid()` available.
//    In Supabase, it's usually available. If not, enable extension `pgcrypto`.
// 2) Use numeric for money fields (USD has 2 decimals, KHR typically 0 decimals).
// 3) Owner-only: 1 user = 1 tenant (enforced by unique owner_user_id).

import {
    pgTable,
    pgEnum,
    uuid,
    text,
    boolean,
    timestamp,
    integer,
    numeric,
    jsonb,
    bigint,
    index,
    uniqueIndex,
  } from "drizzle-orm/pg-core";
  import { relations } from "drizzle-orm";
  
  // --------------------
  // Enums
  // --------------------
  export const shopTypeEnum = pgEnum("shop_type", [
    "beauty_cosmetics",
    "fashion",
    "food_beverage",
    "electronic",
    "services",
    "others",
  ]);
  
  export const orderStatusEnum = pgEnum("order_status", [
    "pending",
    "confirmed",
    "delivering",
    "completed",
    "cancelled",
  ]);
  
  export const paymentMethodEnum = pgEnum("payment_method", ["cod", "aba_transfer"]);
  
export const paymentStatusEnum = pgEnum("payment_status", [
  "unpaid",
  "paid",
  "refunded",
]);

// --------------------
// Tables
// --------------------
export const authUsers = pgTable(
  "user_auth",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    emailUnique: uniqueIndex("auth_user_email_unique").on(t.email),
  })
);

export const authSessions = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
  },
  (t) => ({
    tokenUnique: uniqueIndex("auth_session_token_unique").on(t.token),
    userIdIdx: index("auth_session_user_id_idx").on(t.userId),
    expiresAtIdx: index("auth_session_expires_at_idx").on(t.expiresAt),
  })
);

export const authAccounts = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      withTimezone: true,
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    providerAccountUnique: uniqueIndex("auth_account_provider_account_unique").on(
      t.providerId,
      t.accountId
    ),
    userIdIdx: index("auth_account_user_id_idx").on(t.userId),
  })
);

export const authVerifications = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    valueUnique: uniqueIndex("auth_verification_value_unique").on(t.value),
    identifierIdx: index("auth_verification_identifier_idx").on(t.identifier),
    expiresAtIdx: index("auth_verification_expires_at_idx").on(t.expiresAt),
  })
);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(), // match Supabase auth user id
    authUserId: text("auth_user_id").references(() => authUsers.id, {
      onDelete: "set null",
    }),
    email: text("email").notNull().unique(),
    fullName: text("full_name"),
      tenantId: uuid("tenant_id"), // FK -> tenants.id (nullable until store created)
      isActive: boolean("is_active").notNull().default(true),
      createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
      updatedAt: timestamp("updated_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
  },
  (t) => ({
    authUserIdUnique: uniqueIndex("users_auth_user_id_unique").on(t.authUserId),
    tenantIdIdx: index("users_tenant_id_idx").on(t.tenantId),
    isActiveIdx: index("users_is_active_idx").on(t.isActive),
  })
);
  
  export const tenants = pgTable(
    "tenants",
    {
      id: uuid("id").primaryKey().defaultRandom(),
      ownerUserId: uuid("owner_user_id")
        .notNull()
        .references(() => users.id, { onDelete: "restrict" }), // enforce owner exists
      shopName: text("shop_name").notNull(),
      shopType: shopTypeEnum("shop_type").notNull(),
      description: text("description"),
      addressText: text("address_text"),
      googleMapUrl: text("google_map_url"),
      logoUrl: text("logo_url"),
      bannerUrl: text("banner_url"),
      subdomain: text("subdomain").notNull(),
      isActive: boolean("is_active").notNull().default(true),
      createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
      updatedAt: timestamp("updated_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (t) => ({
      ownerUnique: uniqueIndex("tenants_owner_user_id_unique").on(t.ownerUserId), // 1 user = 1 store
      subdomainUnique: uniqueIndex("tenants_subdomain_unique").on(t.subdomain),
      subdomainIdx: index("tenants_subdomain_idx").on(t.subdomain),
      shopTypeIdx: index("tenants_shop_type_idx").on(t.shopType),
      isActiveIdx: index("tenants_is_active_idx").on(t.isActive),
    })
  );
  
  export const products = pgTable(
    "products",
    {
      id: uuid("id").primaryKey().defaultRandom(),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id, { onDelete: "cascade" }),
      name: text("name").notNull(),
      description: text("description"),
      category: text("category"),
      basePriceUsd: numeric("base_price_usd", { precision: 12, scale: 2 })
        .notNull()
        .default("0"),
      basePriceKhr: numeric("base_price_khr", { precision: 12, scale: 0 })
        .notNull()
        .default("0"),
      trackInventory: boolean("track_inventory").notNull().default(true),
      stockQty: integer("stock_qty").notNull().default(0),
      lowStockThreshold: integer("low_stock_threshold").notNull().default(5),
      hasVariants: boolean("has_variants").notNull().default(false),
      // Postgres text[] - drizzle supports arrays via .array()
      imageUrls: text("image_urls").array().notNull().default([]),
      isActive: boolean("is_active").notNull().default(true),
      createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
      updatedAt: timestamp("updated_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (t) => ({
      tenantIdx: index("products_tenant_id_idx").on(t.tenantId),
      nameIdx: index("products_name_idx").on(t.name),
      isActiveIdx: index("products_is_active_idx").on(t.isActive),
    })
  );
  
  export const productVariants = pgTable(
    "product_variants",
    {
      id: uuid("id").primaryKey().defaultRandom(),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id, { onDelete: "cascade" }),
      productId: uuid("product_id")
        .notNull()
        .references(() => products.id, { onDelete: "cascade" }),
      size: text("size"),
      color: text("color"),
      priceUsd: numeric("price_usd", { precision: 12, scale: 2 }),
      priceKhr: numeric("price_khr", { precision: 12, scale: 0 }),
      stockQty: integer("stock_qty").notNull().default(0),
      lowStockThreshold: integer("low_stock_threshold").notNull().default(5),
      isActive: boolean("is_active").notNull().default(true),
    },
    (t) => ({
      tenantIdx: index("variants_tenant_id_idx").on(t.tenantId),
      productIdx: index("variants_product_id_idx").on(t.productId),
      isActiveIdx: index("variants_is_active_idx").on(t.isActive),
      // Helps prevent duplicate variants like (product_id, size, color) duplicates:
      variantUnique: uniqueIndex("variants_product_size_color_unique").on(
        t.productId,
        t.size,
        t.color
      ),
    })
  );

  export const productKnowledge = pgTable(
    "product_knowledge",
    {
      id: uuid("id").primaryKey().defaultRandom(),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id, { onDelete: "cascade" }),
      productId: uuid("product_id")
        .notNull()
        .references(() => products.id, { onDelete: "cascade" }),
      overviewKm: text("overview_km"),
      overviewEn: text("overview_en"),
      usageKm: text("usage_km"),
      usageEn: text("usage_en"),
      suitabilityKm: text("suitability_km"),
      suitabilityEn: text("suitability_en"),
      keySpecsKm: text("key_specs_km"),
      keySpecsEn: text("key_specs_en"),
      faqsKm: jsonb("faqs_km"),
      faqsEn: jsonb("faqs_en"),
      qaHistory: jsonb("qa_history"),
      readinessStatus: text("readiness_status").notNull().default("draft"),
      missingFields: jsonb("missing_fields"),
      createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
      updatedAt: timestamp("updated_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (t) => ({
      tenantIdx: index("product_knowledge_tenant_id_idx").on(t.tenantId),
      productUnique: uniqueIndex("product_knowledge_product_id_unique").on(t.productId),
      readinessIdx: index("product_knowledge_readiness_idx").on(t.readinessStatus),
    })
  );
  
  export const productDrafts = pgTable(
    "product_drafts",
    {
      id: uuid("id").primaryKey().defaultRandom(),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id, { onDelete: "cascade" }),
      // draft | questioning | ready | confirmed | cancelled
      status: text("status").notNull(),
      // km | en (default km)
      lang: text("lang").notNull().default("km"),
      initialInput: jsonb("initial_input").notNull(),
      questions: jsonb("questions"),
      answers: jsonb("answers"),
      finalPayload: jsonb("final_payload"),
      indexStatus: text("index_status").notNull().default("pending"), // pending | indexed
      indexError: text("index_error"),
      indexAttempts: integer("index_attempts").notNull().default(0),
      indexedAt: timestamp("indexed_at", { withTimezone: true }),
      createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
      updatedAt: timestamp("updated_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (t) => ({
      tenantIdx: index("product_drafts_tenant_id_idx").on(t.tenantId),
      statusIdx: index("product_drafts_status_idx").on(t.status),
      indexStatusIdx: index("product_drafts_index_status_idx").on(t.indexStatus),
    })
  );
  
  export const orders = pgTable(
    "orders",
    {
      id: uuid("id").primaryKey().defaultRandom(),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id, { onDelete: "cascade" }),
      orderNo: text("order_no").notNull(),
      customerName: text("customer_name").notNull(),
      customerPhone: text("customer_phone"),
      addressText: text("address_text").notNull(),
      googleMapUrl: text("google_map_url"),
      status: orderStatusEnum("status").notNull().default("pending"),
      paymentMethod: paymentMethodEnum("payment_method").notNull(),
      paymentStatus: paymentStatusEnum("payment_status").notNull().default("unpaid"),
      currency: text("currency").notNull(), // "USD" or "KHR"
      subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
      discount: numeric("discount", { precision: 12, scale: 2 })
        .notNull()
        .default("0"),
      total: numeric("total", { precision: 12, scale: 2 }).notNull(),
      notes: text("notes"),
      createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
      updatedAt: timestamp("updated_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (t) => ({
      tenantIdx: index("orders_tenant_id_idx").on(t.tenantId),
      statusIdx: index("orders_status_idx").on(t.status),
      paymentStatusIdx: index("orders_payment_status_idx").on(t.paymentStatus),
      orderNoUnique: uniqueIndex("orders_tenant_order_no_unique").on(
        t.tenantId,
        t.orderNo
      ),
      createdAtIdx: index("orders_created_at_idx").on(t.createdAt),
    })
  );
  
  export const orderItems = pgTable(
    "order_items",
    {
      id: uuid("id").primaryKey().defaultRandom(),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id, { onDelete: "cascade" }),
      orderId: uuid("order_id")
        .notNull()
        .references(() => orders.id, { onDelete: "cascade" }),
      productId: uuid("product_id")
        .notNull()
        .references(() => products.id, { onDelete: "restrict" }),
      variantId: uuid("variant_id").references(() => productVariants.id, {
        onDelete: "restrict",
      }),
      productNameSnapshot: text("product_name_snapshot").notNull(),
      variantSnapshot: jsonb("variant_snapshot"),
      priceSnapshot: numeric("price_snapshot", { precision: 12, scale: 2 }).notNull(),
      qty: integer("qty").notNull(),
      lineTotal: numeric("line_total", { precision: 12, scale: 2 }).notNull(),
    },
    (t) => ({
      tenantIdx: index("order_items_tenant_id_idx").on(t.tenantId),
      orderIdx: index("order_items_order_id_idx").on(t.orderId),
      productIdx: index("order_items_product_id_idx").on(t.productId),
      variantIdx: index("order_items_variant_id_idx").on(t.variantId),
    })
  );
  
  export const payments = pgTable(
    "payments",
    {
      id: uuid("id").primaryKey().defaultRandom(),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id, { onDelete: "cascade" }),
      orderId: uuid("order_id")
        .notNull()
        .references(() => orders.id, { onDelete: "cascade" }),
      method: paymentMethodEnum("method").notNull(),
      amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
      reference: text("reference"), // ABA ref
      // pending | confirmed | failed
      status: text("status").notNull().default("pending"),
      paidAt: timestamp("paid_at", { withTimezone: true }),
      createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (t) => ({
      tenantIdx: index("payments_tenant_id_idx").on(t.tenantId),
      orderIdx: index("payments_order_id_idx").on(t.orderId),
      statusIdx: index("payments_status_idx").on(t.status),
    })
  );
  
  export const chatSessions = pgTable(
    "chat_sessions",
    {
      id: uuid("id").primaryKey().defaultRandom(),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id, { onDelete: "cascade" }),
      channel: text("channel").notNull(), // web | telegram
      language: text("language").notNull().default("km"), // km | en
      anonymousId: text("anonymous_id"),
      createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (t) => ({
      tenantIdx: index("chat_sessions_tenant_id_idx").on(t.tenantId),
      createdAtIdx: index("chat_sessions_created_at_idx").on(t.createdAt),
    })
  );
  
  export const chatMessages = pgTable(
    "chat_messages",
    {
      id: uuid("id").primaryKey().defaultRandom(),
      tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id, { onDelete: "cascade" }),
      sessionId: uuid("session_id")
        .notNull()
        .references(() => chatSessions.id, { onDelete: "cascade" }),
      role: text("role").notNull(), // user | assistant | system
      content: text("content").notNull(),
      createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (t) => ({
      tenantIdx: index("chat_messages_tenant_id_idx").on(t.tenantId),
      sessionIdx: index("chat_messages_session_id_idx").on(t.sessionId),
      createdAtIdx: index("chat_messages_created_at_idx").on(t.createdAt),
    })
  );
  
  export const telegramLinks = pgTable(
    "telegram_links",
    {
      tenantId: uuid("tenant_id")
        .primaryKey()
        .references(() => tenants.id, { onDelete: "cascade" }),
      telegramUserId: bigint("telegram_user_id", { mode: "number" }).notNull(),
      linkedAt: timestamp("linked_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (t) => ({
      telegramUserUnique: uniqueIndex("telegram_links_telegram_user_id_unique").on(
        t.telegramUserId
      ),
    })
  );
  
  // --------------------
  // Relations (optional but helpful)
  // --------------------
export const usersRelations = relations(users, ({ one }) => ({
  authUser: one(authUsers, {
    fields: [users.authUserId],
    references: [authUsers.id],
  }),
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id],
  }),
}));

export const authUsersRelations = relations(authUsers, ({ many, one }) => ({
  sessions: many(authSessions),
  accounts: many(authAccounts),
  profile: one(users, {
    fields: [authUsers.id],
    references: [users.authUserId],
  }),
}));

export const authSessionsRelations = relations(authSessions, ({ one }) => ({
  user: one(authUsers, {
    fields: [authSessions.userId],
    references: [authUsers.id],
  }),
}));

export const authAccountsRelations = relations(authAccounts, ({ one }) => ({
  user: one(authUsers, {
    fields: [authAccounts.userId],
    references: [authUsers.id],
  }),
}));
  
  export const tenantsRelations = relations(tenants, ({ one, many }) => ({
    owner: one(users, {
      fields: [tenants.ownerUserId],
      references: [users.id],
    }),
    products: many(products),
    orders: many(orders),
    drafts: many(productDrafts),
    chatSessions: many(chatSessions),
    telegramLink: one(telegramLinks),
  }));
  
  export const productsRelations = relations(products, ({ one, many }) => ({
    tenant: one(tenants, { fields: [products.tenantId], references: [tenants.id] }),
    variants: many(productVariants),
    knowledge: one(productKnowledge, {
      fields: [products.id],
      references: [productKnowledge.productId],
    }),
  }));
  
  export const productVariantsRelations = relations(productVariants, ({ one }) => ({
    tenant: one(tenants, {
      fields: [productVariants.tenantId],
      references: [tenants.id],
    }),
    product: one(products, {
      fields: [productVariants.productId],
      references: [products.id],
    }),
  }));

  export const productKnowledgeRelations = relations(productKnowledge, ({ one }) => ({
    tenant: one(tenants, {
      fields: [productKnowledge.tenantId],
      references: [tenants.id],
    }),
    product: one(products, {
      fields: [productKnowledge.productId],
      references: [products.id],
    }),
  }));
  
  export const ordersRelations = relations(orders, ({ one, many }) => ({
    tenant: one(tenants, { fields: [orders.tenantId], references: [tenants.id] }),
    items: many(orderItems),
    payments: many(payments),
  }));
  
  export const orderItemsRelations = relations(orderItems, ({ one }) => ({
    tenant: one(tenants, {
      fields: [orderItems.tenantId],
      references: [tenants.id],
    }),
    order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
    product: one(products, {
      fields: [orderItems.productId],
      references: [products.id],
    }),
    variant: one(productVariants, {
      fields: [orderItems.variantId],
      references: [productVariants.id],
    }),
  }));
  
  export const paymentsRelations = relations(payments, ({ one }) => ({
    tenant: one(tenants, {
      fields: [payments.tenantId],
      references: [tenants.id],
    }),
    order: one(orders, { fields: [payments.orderId], references: [orders.id] }),
  }));
  
  export const chatSessionsRelations = relations(chatSessions, ({ one, many }) => ({
    tenant: one(tenants, {
      fields: [chatSessions.tenantId],
      references: [tenants.id],
    }),
    messages: many(chatMessages),
  }));
  
  export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
    tenant: one(tenants, {
      fields: [chatMessages.tenantId],
      references: [tenants.id],
    }),
    session: one(chatSessions, {
      fields: [chatMessages.sessionId],
      references: [chatSessions.id],
    }),
  }));
  
  export const telegramLinksRelations = relations(telegramLinks, ({ one }) => ({
    tenant: one(tenants, {
      fields: [telegramLinks.tenantId],
      references: [tenants.id],
    }),
  }));
  
// --------------------
// Types (handy exports)
// --------------------
export type AuthUser = typeof authUsers.$inferSelect;
export type NewAuthUser = typeof authUsers.$inferInsert;

export type AuthSession = typeof authSessions.$inferSelect;
export type NewAuthSession = typeof authSessions.$inferInsert;

export type AuthAccount = typeof authAccounts.$inferSelect;
export type NewAuthAccount = typeof authAccounts.$inferInsert;

export type AuthVerification = typeof authVerifications.$inferSelect;
export type NewAuthVerification = typeof authVerifications.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
  
  export type Tenant = typeof tenants.$inferSelect;
  export type NewTenant = typeof tenants.$inferInsert;
  
  export type Product = typeof products.$inferSelect;
  export type NewProduct = typeof products.$inferInsert;
  
  export type ProductVariant = typeof productVariants.$inferSelect;
  export type NewProductVariant = typeof productVariants.$inferInsert;
  
  export type ProductKnowledge = typeof productKnowledge.$inferSelect;
  export type NewProductKnowledge = typeof productKnowledge.$inferInsert;
  
  export type ProductDraft = typeof productDrafts.$inferSelect;
  export type NewProductDraft = typeof productDrafts.$inferInsert;
  
  export type Order = typeof orders.$inferSelect;
  export type NewOrder = typeof orders.$inferInsert;
  
  export type OrderItem = typeof orderItems.$inferSelect;
  export type NewOrderItem = typeof orderItems.$inferInsert;
  
  export type Payment = typeof payments.$inferSelect;
  export type NewPayment = typeof payments.$inferInsert;
  
  export type ChatSession = typeof chatSessions.$inferSelect;
  export type NewChatSession = typeof chatSessions.$inferInsert;
  
  export type ChatMessage = typeof chatMessages.$inferSelect;
  export type NewChatMessage = typeof chatMessages.$inferInsert;
  
  export type TelegramLink = typeof telegramLinks.$inferSelect;
  export type NewTelegramLink = typeof telegramLinks.$inferInsert;
