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
      ErrorResponse: {
        type: "object",
        properties: {
          message: { type: "string", example: "Unauthorized" },
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
