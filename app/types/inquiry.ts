export type Inquiry = {
  id?: number;
  company_name?: string;
  contact_name?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  status_id?: number;
  status_name?: string;
  status_description?: string;
  inquiry_source_id?: number;
  inquiry_source_name?: string;
  inquiry_source?: string;
  number_of_units?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
};

export type StatusOption = {
  id: number;
  name: string;
  description: string;
};

export type HistoryItem = {
  id?: number;
  status_id?: number;
  status_name?: string;
  status_description?: string;
  notes?: string;
  created_at?: string;
};
