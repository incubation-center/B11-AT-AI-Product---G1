const serverUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:8080";
const publicUrl = process.env.PUBLIC_URL ?? "http://localhost:5173";

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
