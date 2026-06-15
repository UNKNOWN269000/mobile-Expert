/**
 * Build a WhatsApp click-to-chat URL with a pre-filled product inquiry message.
 *
 * Uses the official wa.me endpoint which works in WhatsApp Web, mobile app,
 * and WhatsApp desktop without any special integration.
 */
const SHOP_PHONE = '94779358777'; // E.164 format (Sri Lanka), no "+" or spaces
const SHOP_NAME = 'Mobile Expert';

export function buildProductInquiryMessage(product: {
  name: string;
  price: number;
  condition?: string;
  brand?: string;
  category?: string;
  productUrl: string;
}): string {
  const lines: string[] = [];
  lines.push(`Hi ${SHOP_NAME}! 👋`);
  lines.push('');
  lines.push(`I'm interested in this product:`);
  lines.push(`📱 *${product.name}*`);
  if (product.brand) lines.push(`   Brand: ${product.brand}`);
  if (product.category) lines.push(`   Category: ${product.category}`);
  if (product.condition) lines.push(`   Condition: ${product.condition}`);
  lines.push(`   Price: Rs. ${product.price.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  lines.push('');
  lines.push(`🔗 Product link: ${product.productUrl}`);
  lines.push('');
  lines.push('Is it still available? Can we arrange a viewing?');
  return lines.join('\n');
}

/**
 * Open WhatsApp chat in a new tab with a pre-filled product inquiry.
 * Encodes the message and uses the official wa.me endpoint.
 */
export function openWhatsAppChat(message: string): void {
  const encoded = encodeURIComponent(message);
  const url = `https://wa.me/${SHOP_PHONE}?text=${encoded}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

export const WHATSAPP_NUMBER = SHOP_PHONE;
export const WHATSAPP_DISPLAY = '+94 77 935 8777';
