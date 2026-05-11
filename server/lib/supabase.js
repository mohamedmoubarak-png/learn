import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const hasSupabaseServerConfig = Boolean(supabaseUrl && supabaseServiceRoleKey)

// RLS المرتبط: service role يستخدم في الخادم فقط، ولا يرسل أبداً للمتصفح.
export const supabaseAdmin = hasSupabaseServerConfig
  ? createClient(supabaseUrl, supabaseServiceRoleKey)
  : null
