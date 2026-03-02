import { env } from "../env";

export async function sendTelegramMessage(chatId: number | string, text: string): Promise<void> {
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
    }),
  });

  if (!response.ok) {
    const raw = await response.text();
    throw new Error(`Telegram sendMessage failed: ${raw}`);
  }
}
