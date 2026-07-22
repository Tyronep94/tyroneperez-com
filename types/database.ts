export type Category = "photography" | "music";
export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";
export type InquiryStatus = "new" | "contacted" | "awaiting_response" | "confirmed" | "declined" | "archived";

export interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  preferred_contact_method: "email" | "phone" | "text" | null;
  referral_source: string | null;
  general_notes: string | null;
  requires_follow_up: boolean;
  follow_up_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  name: string;
  slug: string;
  category: Category;
  description: string | null;
  default_duration_minutes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  client_id: string;
  service_id: string;
  inquiry_id: string | null;
  title: string;
  category: Category;
  start_at: string;
  end_at: string;
  location: string | null;
  status: BookingStatus;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
  client?: Client;
  service?: Service;
}

export interface Inquiry {
  id: string;
  client_id: string;
  service_id: string;
  requested_date: string | null;
  requested_start_time: string | null;
  requested_end_time: string | null;
  message: string | null;
  location: string | null;
  status: InquiryStatus;
  created_at: string;
  updated_at: string;
  client?: Client;
  service?: Service;
}

export interface ActionState {
  success?: string;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}
