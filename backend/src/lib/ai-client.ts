type AiErrorResponse = { message?: string };
type AiSearchResponse = { matches: unknown[] };

const aiServiceUrl = (process.env.AI_SERVICE_URL ?? "").replace(/\/$/, "");
const internalApiKey = process.env.INTERNAL_API_KEY ?? "";

function internalHeaders(): HeadersInit {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (internalApiKey) headers["x-internal-key"] = internalApiKey;
  return headers;
}

export const aiClient = {
  async indexTenant(tenantId: string): Promise<void> {
    if (!aiServiceUrl) {
      // Fall back to direct call when AI_SERVICE_URL is not configured
      const { ragService } = await import("../services/rag.service");
      await ragService.indexTenant(tenantId);
      return;
    }

    const res = await fetch(`${aiServiceUrl}/internal/rag/index/${tenantId}`, {
      method: "POST",
      headers: internalHeaders(),
    });

    if (!res.ok) {
      const data: AiErrorResponse = await res.json().catch(() => ({}));
      throw new Error(data.message ?? `AI service error: ${res.status}`);
    }
  },

  async searchTenant(tenantId: string, query: string, topK = 10) {
    if (!aiServiceUrl) {
      const { ragService } = await import("../services/rag.service");
      return ragService.searchTenant(tenantId, query, topK);
    }

    const res = await fetch(`${aiServiceUrl}/internal/rag/search`, {
      method: "POST",
      headers: internalHeaders(),
      body: JSON.stringify({ tenantId, query, topK }),
    });

    if (!res.ok) {
      const data: AiErrorResponse = await res.json().catch(() => ({}));
      throw new Error(data.message ?? `AI service error: ${res.status}`);
    }

    const data: AiSearchResponse = await res.json();
    return data.matches ?? [];
  },
};
