export type Profile = {
  id: string
  email: string | null
  full_name: string | null
  role: 'tenant' | 'staff' | 'admin'
  created_at: string
}

export type Location = {
  id: number
  name: string
  type: 'daily' | 'monthly'
  rate_khemah: number
  rate_cbs: number
  rate_monthly: number
  image_url: string | null
  created_at: string
}

export type Tenant = {
  id: number
  profile_id: string | null
  full_name: string
  business_name: string | null
  phone_number: string | null
  ic_number: string | null
  email: string | null
  status: string
  created_at: string
}

export type TenantLocation = {
  id: number
  tenant_id: number
  location_id: number
  stall_number: string | null
  rate_type: 'khemah' | 'cbs' | 'monthly'
  status: string
  created_at: string
  locations?: Location // For join queries
}

export type Transaction = {
  id: number
  tenant_id: number | null
  amount: number
  type: 'income' | 'expense'
  category: string | null
  status: string
  date: string
  description: string | null
  receipt_url: string | null
  created_at: string
}