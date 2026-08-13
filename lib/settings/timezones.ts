/**
 * A curated shortlist covering the regions Al Burhan's early users are
 * most likely to be in, plus a few global anchors. Not exhaustive by
 * design — a full IANA list (400+ zones) would be unusable in a plain
 * <select> on mobile. The server action still accepts any valid IANA
 * zone name, so this list is a UI convenience, not a hard restriction.
 */
export const COMMON_TIMEZONES: { value: string; label: string }[] = [
  { value: "Asia/Karachi", label: "Karachi (PKT)" },
  { value: "Asia/Kolkata", label: "Kolkata / Delhi (IST)" },
  { value: "Asia/Dhaka", label: "Dhaka (BST)" },
  { value: "Asia/Dubai", label: "Dubai (GST)" },
  { value: "Asia/Riyadh", label: "Riyadh (AST)" },
  { value: "Europe/Istanbul", label: "Istanbul (TRT)" },
  { value: "Asia/Jakarta", label: "Jakarta (WIB)" },
  { value: "Asia/Kuala_Lumpur", label: "Kuala Lumpur (MYT)" },
  { value: "Africa/Cairo", label: "Cairo (EET)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "America/New_York", label: "New York (ET)" },
  { value: "America/Chicago", label: "Chicago (CT)" },
  { value: "America/Los_Angeles", label: "Los Angeles (PT)" },
  { value: "Australia/Sydney", label: "Sydney (AET)" },
  { value: "UTC", label: "UTC" },
];
