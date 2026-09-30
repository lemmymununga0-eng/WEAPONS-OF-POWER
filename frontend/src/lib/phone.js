// Branch/pastor phone numbers are already normalized by the backend to
// +260XXXXXXXXX (or another country's E.164 form), so these are just
// straightforward link builders.
export function callLink(phone) {
  return `tel:${phone}`;
}

export function whatsappLink(phone) {
  return `https://wa.me/${phone.replace(/^\+/, "")}`;
}

export function mailtoLink(email) {
  return `mailto:${email}`;
}
