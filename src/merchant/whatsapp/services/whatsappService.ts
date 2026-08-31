export const formatPhoneNumber = (phone: string): string => {
  // Remove any non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Handle Iraqi numbers specifically
  if (cleaned.startsWith('07')) {
    cleaned = '964' + cleaned.substring(1);
  } else if (!cleaned.startsWith('964')) {
    // If it doesn't start with 0 and doesn't start with 964, prepend 964 just in case
    cleaned = '964' + cleaned;
  }
  
  return cleaned;
};

export const openWhatsApp = (phone: string, message: string) => {
  const formattedPhone = formatPhoneNumber(phone);
  const encodedMessage = encodeURIComponent(message);
  
  // Use wa.me link which works on both mobile and web
  const url = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
  window.open(url, '_blank');
};
