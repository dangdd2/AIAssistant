import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vaakokdzcicznzoqqmsy.supabase.co'
const supabaseKey = 'sb_publishable_To8kDKCd4KGKXVD_wHj7lQ_qACR7MkS'

export const supabase = createClient(supabaseUrl, supabaseKey)
