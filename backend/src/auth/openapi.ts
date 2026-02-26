import { env } from "../env";

const serverUrl = env.BETTER_AUTH_URL;
const publicUrl = env.PUBLIC_URL;

export const authOpenApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Backend Auth API",
    version: "1.0.0",
    description: "Authentication endpoints powered by Better Auth and Resend.",
  },
  servers: [{ url: serverUrl }],
  tags: [
    { name: "Auth", description: "Better Auth endpoints" },
    { name: "Profile", description: "Authenticated profile endpoint" },
    { name: "Tenant", description: "Store tenant management endpoints" },
    { name: "Product", description: "Product and variant management endpoints" },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      SignUpEmailBody: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
          name: { type: "string", example: "John" },
          email: { type: "string", format: "email", example: "user@email.com" },
          password: { type: "string", minLength: 8, example: "P@ssw0rd123" },
          callbackURL: { type: "string", example: `${publicUrl}/welcome` },
          rememberMe: { type: "boolean", example: true },
        },
      },
      SignInEmailBody: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "user@email.com" },
          password: { type: "string", example: "P@ssw0rd123" },
          callbackURL: { type: "string", example: `${publicUrl}/dashboard` },
          rememberMe: { type: "boolean", example: true },
        },
      },
      RequestPasswordResetBody: {
        type: "object",
        required: ["email"],
        properties: {
          email: { type: "string", format: "email", example: "user@email.com" },
          redirectTo: {
            type: "string",
            example: `${publicUrl}/reset-password`,
          },
        },
      },
      ResetPasswordBody: {
        type: "object",
        required: ["token", "newPassword"],
        properties: {
          token: { type: "string", example: "verification-token" },
          newPassword: { type: "string", minLength: 8, example: "NewP@ssw0rd123" },
        },
      },
      SendVerificationEmailBody: {
        type: "object",
        required: ["email"],
        properties: {
          email: { type: "string", format: "email", example: "user@email.com" },
          callbackURL: { type: "string", example: `${publicUrl}/verify-callback` },
        },
      },
      MeResponse: {
        type: "object",
        required: ["id", "email", "emailVerified", "profile"],
        properties: {
          id: { type: "string", format: "uuid", example: "550e8400-e29b-41d4-a716-446655440000" },
          email: { type: "string", format: "email", example: "user@email.com" },
          emailVerified: { type: "boolean", example: true },
          profile: {
            type: "object",
            required: ["fullName", "tenantId"],
            properties: {
              fullName: { type: "string", example: "John" },
              tenantId: {
                type: "string",
                nullable: true,
                format: "uuid",
                example: "550e8400-e29b-41d4-a716-446655440000",
              },
            },
          },
        },
      },
      UpdateMeBody: {
        type: "object",
        required: ["full_name"],
        properties: {
          full_name: { type: "string", example: "John Doe" },
        },
      },
      DeactivateMeResponse: {
        type: "object",
        required: ["message", "profile"],
        properties: {
          message: { type: "string", example: "Account deactivated" },
          profile: {
            type: "object",
            required: ["id", "isActive", "updatedAt"],
            properties: {
              id: {
                type: "string",
                format: "uuid",
                example: "550e8400-e29b-41d4-a716-446655440000",
              },
              isActive: { type: "boolean", example: false },
              updatedAt: { type: "string", format: "date-time" },
            },
          },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          message: { type: "string", example: "Unauthorized" },
        },
      },
      TenantResponse: {
        type: "object",
        required: ["id", "shopName", "shopType", "subdomain", "storeUrl", "isActive"],
        properties: {
          id: { type: "string", format: "uuid" },
          shopName: { type: "string", example: "My Beauty Store" },
          shopType: { type: "string", example: "beauty_cosmetics" },
          description: { type: "string", nullable: true },
          addressText: { type: "string", nullable: true },
          googleMapUrl: { type: "string", nullable: true },
          logoUrl: { type: "string", nullable: true },
          bannerUrl: { type: "string", nullable: true },
          subdomain: { type: "string", example: "my-beauty-store" },
          storeUrl: { type: "string", example: "http://my-beauty-store.lvh.me:3000" },
          isActive: { type: "boolean", example: true },
        },
      },
      CreateTenantBody: {
        type: "object",
        required: ["shop_name", "shop_type"],
        properties: {
          shop_name: { type: "string", example: "My Beauty Store" },
          shop_type: { type: "string", example: "beauty_cosmetics" },
          description: { type: "string" },
          address_text: { type: "string" },
          google_map_url: { type: "string" },
          logo_url: { type: "string" },
          banner_url: { type: "string" },
        },
      },
      Product: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          tenantId: { type: "string", format: "uuid" },
          name: { type: "string" },
          description: { type: "string", nullable: true },
          category: { type: "string", nullable: true },
          basePriceUsd: { type: "string" },
          basePriceKhr: { type: "string" },
          trackInventory: { type: "boolean" },
          stockQty: { type: "integer" },
          lowStockThreshold: { type: "integer" },
          hasVariants: { type: "boolean" },
          imageUrls: { type: "array", items: { type: "string" } },
          isActive: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      ProductVariant: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          tenantId: { type: "string", format: "uuid" },
          productId: { type: "string", format: "uuid" },
          size: { type: "string", nullable: true },
          color: { type: "string", nullable: true },
          priceUsd: { type: "string", nullable: true },
          priceKhr: { type: "string", nullable: true },
          stockQty: { type: "integer" },
          lowStockThreshold: { type: "integer" },
          isActive: { type: "boolean" },
        },
      },
      CreateProductBody: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string", example: "Hydrating Serum" },
          description: { type: "string" },
          category: { type: "string", example: "Skincare" },
          base_price_usd: { type: "number", example: 12.5 },
          base_price_khr: { type: "number", example: 50000 },
          track_inventory: { type: "boolean", example: true },
          stock_qty: { type: "integer", example: 10 },
          low_stock_threshold: { type: "integer", example: 5 },
          has_variants: { type: "boolean", example: false },
          image_urls: { type: "array", items: { type: "string" } },
        },
      },
      UpdateProductBody: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          category: { type: "string" },
          base_price_usd: { type: "number" },
          base_price_khr: { type: "number" },
          track_inventory: { type: "boolean" },
          stock_qty: { type: "integer" },
          low_stock_threshold: { type: "integer" },
          has_variants: { type: "boolean" },
          image_urls: { type: "array", items: { type: "string" } },
          is_active: { type: "boolean" },
        },
      },
      CreateVariantBody: {
        type: "object",
        properties: {
          size: { type: "string", example: "M" },
          color: { type: "string", example: "Red" },
          price_usd: { type: "number", example: 13.0 },
          price_khr: { type: "number", example: 52000 },
          stock_qty: { type: "integer", example: 8 },
          low_stock_threshold: { type: "integer", example: 3 },
          is_active: { type: "boolean", example: true },
        },
      },
      UpdateStockBody: {
        type: "object",
        required: ["stock_qty"],
        properties: {
          stock_qty: { type: "integer", example: 25 },
        },
      },
    },
  },
  paths: {
    "/api/auth/sign-up/email": {
      post: {
        tags: ["Auth"],
        summary: "Sign up with email/password",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SignUpEmailBody" },
            },
          },
        },
        responses: {
          "200": { description: "Created" },
          "422": { description: "Validation or duplicate user" },
        },
      },
    },
    "/api/auth/sign-in/email": {
      post: {
        tags: ["Auth"],
        summary: "Sign in with email/password",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SignInEmailBody" },
            },
          },
        },
        responses: {
          "200": { description: "Signed in" },
          "401": { description: "Invalid credentials" },
        },
      },
    },
    "/api/auth/sign-out": {
      post: {
        tags: ["Auth"],
        summary: "Sign out current session",
        security: [{ BearerAuth: [] }],
        responses: {
          "200": { description: "Signed out" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/api/auth/get-session": {
      get: {
        tags: ["Auth"],
        summary: "Get current auth session",
        security: [{ BearerAuth: [] }],
        responses: {
          "200": { description: "Session fetched" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/api/auth/send-verification-email": {
      post: {
        tags: ["Auth"],
        summary: "Send verification email via Resend",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SendVerificationEmailBody" },
            },
          },
        },
        responses: {
          "200": { description: "Email queued/sent" },
        },
      },
    },
    "/api/auth/verify-email": {
      get: {
        tags: ["Auth"],
        summary: "Verify email token",
        parameters: [
          {
            name: "token",
            in: "query",
            required: true,
            schema: { type: "string" },
          },
          {
            name: "callbackURL",
            in: "query",
            required: false,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "Email verified" },
          "401": { description: "Invalid/expired token" },
        },
      },
    },
    "/api/auth/request-password-reset": {
      post: {
        tags: ["Auth"],
        summary: "Request password reset email",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RequestPasswordResetBody" },
            },
          },
        },
        responses: {
          "200": { description: "Reset email process triggered" },
        },
      },
    },
    "/api/auth/reset-password": {
      post: {
        tags: ["Auth"],
        summary: "Reset password with token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ResetPasswordBody" },
            },
          },
        },
        responses: {
          "200": { description: "Password reset successful" },
          "400": { description: "Invalid token/password" },
        },
      },
    },
    "/me": {
      get: {
        tags: ["Profile"],
        summary: "Get authenticated user profile",
        security: [{ BearerAuth: [] }],
        responses: {
          "200": {
            description: "Current user profile",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MeResponse" },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
      patch: {
        tags: ["Profile"],
        summary: "Update authenticated user profile full name",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateMeBody" },
            },
          },
        },
        responses: {
          "200": {
            description: "Updated user profile",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MeResponse" },
              },
            },
          },
          "400": {
            description: "Invalid request body",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/me/deactivate": {
      patch: {
        tags: ["Profile"],
        summary: "Deactivate authenticated user account",
        security: [{ BearerAuth: [] }],
        responses: {
          "200": {
            description: "Account deactivated",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/DeactivateMeResponse" },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/me/tenant": {
      get: {
        tags: ["Tenant"],
        summary: "Get current user's tenant",
        security: [{ BearerAuth: [] }],
        responses: {
          "200": { description: "Tenant lookup result" },
          "401": { description: "Unauthorized" },
        },
      },
      patch: {
        tags: ["Tenant"],
        summary: "Update current user's tenant",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateTenantBody" },
            },
          },
        },
        responses: {
          "200": { description: "Tenant updated" },
          "404": { description: "Tenant not found" },
          "409": { description: "Subdomain conflict" },
        },
      },
    },
    "/me/tenant/deactivate": {
      patch: {
        tags: ["Tenant"],
        summary: "Soft delete current tenant (is_active=false)",
        security: [{ BearerAuth: [] }],
        responses: {
          "200": { description: "Tenant deactivated" },
          "404": { description: "Tenant not found" },
        },
      },
    },
    "/tenants": {
      post: {
        tags: ["Tenant"],
        summary: "Create tenant for current user",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateTenantBody" },
            },
          },
        },
        responses: {
          "201": { description: "Tenant created" },
          "409": { description: "Conflict (tenant exists or subdomain taken)" },
        },
      },
    },
    "/tenants/{id}": {
      patch: {
        tags: ["Tenant"],
        summary: "Update current user's tenant by id",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateTenantBody" },
            },
          },
        },
        responses: {
          "200": { description: "Tenant updated" },
          "403": { description: "Forbidden" },
          "404": { description: "Tenant not found" },
          "409": { description: "Subdomain conflict" },
        },
      },
    },
    "/tenants/{id}/deactivate": {
      patch: {
        tags: ["Tenant"],
        summary: "Deactivate current user's tenant by id",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": { description: "Tenant deactivated" },
          "403": { description: "Forbidden" },
          "404": { description: "Tenant not found" },
        },
      },
    },
    "/tenants/upload-url": {
      post: {
        tags: ["Tenant"],
        summary: "Upload logo/banner image to Cloudinary",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["type", "file"],
                properties: {
                  type: { type: "string", enum: ["logo", "banner"] },
                  file: { type: "string", format: "binary" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Uploaded successfully" },
          "400": { description: "Validation error" },
        },
      },
    },
    "/tenants/subdomain-available": {
      get: {
        tags: ["Tenant"],
        summary: "Check generated subdomain availability from shop name",
        parameters: [
          {
            name: "shop_name",
            in: "query",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "Availability result" },
          "400": { description: "Missing shop_name query" },
        },
      },
    },
    "/store/by-subdomain/{subdomain}": {
      get: {
        tags: ["Tenant"],
        summary: "Get public store profile by subdomain",
        parameters: [
          {
            name: "subdomain",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "Store profile found" },
          "404": { description: "Store not found" },
        },
      },
    },
    "/store/by-host": {
      get: {
        tags: ["Tenant"],
        summary: "Get public store profile by request host subdomain",
        responses: {
          "200": { description: "Store profile found" },
          "400": { description: "No subdomain in host" },
          "404": { description: "Store not found" },
        },
      },
    },
    "/products": {
      post: {
        tags: ["Product"],
        summary: "Create product",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateProductBody" },
            },
          },
        },
        responses: {
          "201": { description: "Product created" },
          "400": { description: "Validation error" },
          "401": { description: "Unauthorized" },
          "404": { description: "Tenant not found" },
        },
      },
      get: {
        tags: ["Product"],
        summary: "List products with search and pagination",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "q", in: "query", required: false, schema: { type: "string" } },
          { name: "page", in: "query", required: false, schema: { type: "integer", default: 1 } },
          { name: "page_size", in: "query", required: false, schema: { type: "integer", default: 20 } },
          { name: "include_inactive", in: "query", required: false, schema: { type: "boolean", default: false } },
        ],
        responses: {
          "200": { description: "Products list" },
          "401": { description: "Unauthorized" },
          "404": { description: "Tenant not found" },
        },
      },
    },
    "/products/{id}": {
      get: {
        tags: ["Product"],
        summary: "Get product detail by id",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          "200": { description: "Product detail" },
          "401": { description: "Unauthorized" },
          "404": { description: "Product or tenant not found" },
        },
      },
      patch: {
        tags: ["Product"],
        summary: "Update product",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateProductBody" },
            },
          },
        },
        responses: {
          "200": { description: "Product updated" },
          "400": { description: "Validation error" },
          "401": { description: "Unauthorized" },
          "404": { description: "Product or tenant not found" },
        },
      },
    },
    "/products/{id}/deactivate": {
      patch: {
        tags: ["Product"],
        summary: "Soft delete product (is_active=false)",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          "200": { description: "Product deactivated" },
          "401": { description: "Unauthorized" },
          "404": { description: "Product or tenant not found" },
        },
      },
    },
    "/products/{id}/stock": {
      patch: {
        tags: ["Product"],
        summary: "Update product stock quantity",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateStockBody" },
            },
          },
        },
        responses: {
          "200": { description: "Product stock updated" },
          "400": { description: "Validation error" },
          "401": { description: "Unauthorized" },
          "404": { description: "Product or tenant not found" },
        },
      },
    },
    "/products/{id}/variants": {
      post: {
        tags: ["Product"],
        summary: "Create variant under a product",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateVariantBody" },
            },
          },
        },
        responses: {
          "201": { description: "Variant created" },
          "400": { description: "Validation error" },
          "401": { description: "Unauthorized" },
          "404": { description: "Product or tenant not found" },
          "409": { description: "Variant uniqueness conflict" },
        },
      },
    },
    "/variants/{id}": {
      patch: {
        tags: ["Product"],
        summary: "Update variant",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateVariantBody" },
            },
          },
        },
        responses: {
          "200": { description: "Variant updated" },
          "400": { description: "Validation error" },
          "401": { description: "Unauthorized" },
          "404": { description: "Variant or tenant not found" },
          "409": { description: "Variant uniqueness conflict" },
        },
      },
    },
    "/variants/{id}/stock": {
      patch: {
        tags: ["Product"],
        summary: "Update variant stock quantity",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateStockBody" },
            },
          },
        },
        responses: {
          "200": { description: "Variant stock updated" },
          "400": { description: "Validation error" },
          "401": { description: "Unauthorized" },
          "404": { description: "Variant or tenant not found" },
        },
      },
    },
    "/variants/{id}/deactivate": {
      patch: {
        tags: ["Product"],
        summary: "Soft delete variant (is_active=false)",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          "200": { description: "Variant deactivated" },
          "401": { description: "Unauthorized" },
          "404": { description: "Variant or tenant not found" },
        },
      },
    },
    "/products/{id}/images": {
      post: {
        tags: ["Product"],
        summary: "Upload product image to Cloudinary and append image_urls (max 3 images per product)",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["file"],
                properties: {
                  file: { type: "string", format: "binary" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Image uploaded and product updated" },
          "400": { description: "Validation/upload error" },
          "401": { description: "Unauthorized" },
          "404": { description: "Product or tenant not found" },
        },
      },
    },
    "/store/by-subdomain/{subdomain}/products": {
      get: {
        tags: ["Product"],
        summary: "Public list of active products by store subdomain",
        parameters: [
          { name: "subdomain", in: "path", required: true, schema: { type: "string" } },
          { name: "q", in: "query", required: false, schema: { type: "string" } },
          { name: "page", in: "query", required: false, schema: { type: "integer", default: 1 } },
          { name: "page_size", in: "query", required: false, schema: { type: "integer", default: 20 } },
        ],
        responses: {
          "200": { description: "Store products list" },
          "400": { description: "Missing/invalid subdomain" },
          "404": { description: "Store not found" },
        },
      },
    },
    "/store/by-subdomain/{subdomain}/products/{id}": {
      get: {
        tags: ["Product"],
        summary: "Public product detail by store subdomain and product id",
        parameters: [
          { name: "subdomain", in: "path", required: true, schema: { type: "string" } },
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          "200": { description: "Product detail" },
          "400": { description: "Missing/invalid params" },
          "404": { description: "Store or product not found" },
        },
      },
    },
  },
} as const;

export const swaggerUiHtml = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Auth API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: "/openapi.json",
        dom_id: "#swagger-ui",
        deepLinking: true,
        persistAuthorization: true
      });
    </script>
  </body>
</html>`;
