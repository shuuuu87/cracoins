export const COUNTRY_TIMEZONE_MAP: Record<string, string> = {
  "United States": "America/New_York",
  "United Kingdom": "Europe/London",
  "Canada": "America/Toronto",
  "Australia": "Australia/Sydney",
  "India": "Asia/Kolkata",
  "Germany": "Europe/Berlin",
  "France": "Europe/Paris",
  "Spain": "Europe/Madrid",
  "Italy": "Europe/Rome",
  "Japan": "Asia/Tokyo",
  "South Korea": "Asia/Seoul",
  "China": "Asia/Shanghai",
  "Brazil": "America/Sao_Paulo",
  "Mexico": "America/Mexico_City",
  "Russia": "Europe/Moscow",
  "South Africa": "Africa/Johannesburg",
  "Singapore": "Asia/Singapore",
  "Malaysia": "Asia/Kuala_Lumpur",
  "Philippines": "Asia/Manila",
  "Thailand": "Asia/Bangkok",
  "Indonesia": "Asia/Jakarta",
  "Vietnam": "Asia/Ho_Chi_Minh",
  "Pakistan": "Asia/Karachi",
  "Bangladesh": "Asia/Dhaka",
  "Egypt": "Africa/Cairo",
  "Nigeria": "Africa/Lagos",
  "Kenya": "Africa/Nairobi",
  "Argentina": "America/Argentina/Buenos_Aires",
  "Chile": "America/Santiago",
  "Colombia": "America/Bogota",
  "Peru": "America/Lima",
  "Other": "UTC",
};

export const getTimezoneForCountry = (country: string | undefined): string => {
  if (!country) return "UTC";
  return COUNTRY_TIMEZONE_MAP[country] || "UTC";
};
