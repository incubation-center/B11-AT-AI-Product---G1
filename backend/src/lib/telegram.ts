import { env } from "../env";

type TelegramInlineKeyboardButton = {
  text: string;
  url?: string;
  web_app?: { url: string };
  callback_data?: string;
};

type TelegramReplyKeyboardButton = {
  text: string;
};

type TelegramReplyMarkup =
  | {
      inline_keyboard: TelegramInlineKeyboardButton[][];
    }
  | {
      keyboard: TelegramReplyKeyboardButton[][];
      resize_keyboard?: boolean;
      one_time_keyboard?: boolean;
      input_field_placeholder?: string;
      selective?: boolean;
    }
  | {
      remove_keyboard: true;
      selective?: boolean;
    }
  | {
      force_reply: true;
      input_field_placeholder?: string;
      selective?: boolean;
    };

type TelegramSendMessageOptions = {
  parseMode?: "HTML" | "MarkdownV2";
  replyMarkup?: TelegramReplyMarkup;
  disableWebPagePreview?: boolean;
};

export async function sendTelegramMessage(
  chatId: number | string,
  text: string,
  options?: TelegramSendMessageOptions
): Promise<void> {
  if (!env.TELEGRAM_BOT_TOKEN) {
    return;
  }

  const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: options?.parseMode,
      reply_markup: options?.replyMarkup,
      disable_web_page_preview: options?.disableWebPagePreview ?? true,
    }),
  });

  if (!response.ok) {
    const raw = await response.text();
    throw new Error(`Telegram sendMessage failed: ${raw}`);
  }
}

export async function answerTelegramCallbackQuery(callbackQueryId: string): Promise<void> {
  if (!env.TELEGRAM_BOT_TOKEN) {
    return;
  }

  const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      callback_query_id: callbackQueryId,
    }),
  });

  if (!response.ok) {
    const raw = await response.text();
    throw new Error(`Telegram answerCallbackQuery failed: ${raw}`);
  }
}

type TelegramGetFileResponse = {
  ok: boolean;
  result?: {
    file_path?: string;
  };
  description?: string;
};

function requireBotToken(): string {
  if (!env.TELEGRAM_BOT_TOKEN) {
    throw new Error("TELEGRAM_BOT_TOKEN is required.");
  }
  return env.TELEGRAM_BOT_TOKEN;
}

function inferTelegramImageMimeType(filePath: string): string {
  const lower = filePath.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  if (lower.endsWith(".avif")) return "image/avif";
  return "image/jpeg";
}

export async function downloadTelegramFileAsImage(input: {
  fileId: string;
  fileName?: string;
  mimeType?: string;
}): Promise<File> {
  const token = requireBotToken();

  const metaResponse = await fetch(`https://api.telegram.org/bot${token}/getFile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      file_id: input.fileId,
    }),
  });

  const metaText = await metaResponse.text();
  let meta: TelegramGetFileResponse | string = metaText;
  try {
    meta = metaText ? (JSON.parse(metaText) as TelegramGetFileResponse) : { ok: false };
  } catch {
    meta = metaText;
  }

  if (!metaResponse.ok || typeof meta === "string" || !meta.ok || !meta.result?.file_path) {
    const reason = typeof meta === "string" ? meta : meta.description ?? "Unable to resolve Telegram file.";
    throw new Error(`Telegram getFile failed: ${reason}`);
  }

  const filePath = meta.result.file_path;
  const fileResponse = await fetch(`https://api.telegram.org/file/bot${token}/${filePath}`);
  if (!fileResponse.ok) {
    const raw = await fileResponse.text();
    throw new Error(`Telegram file download failed: ${raw}`);
  }

  const blob = await fileResponse.blob();
  const fallbackName = filePath.split("/").pop() || `telegram-image-${Date.now()}.jpg`;
  const fileName = input.fileName?.trim() || fallbackName;
  const mimeType = input.mimeType?.trim() || blob.type || inferTelegramImageMimeType(filePath);

  return new File([blob], fileName, {
    type: mimeType,
  });
}
