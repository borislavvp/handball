import { createClient } from '@supabase/supabase-js'
import { Database } from '~/types/database.types'
const config = useRuntimeConfig()
export const supabase = createClient<Database>(
    config.public.supabaseUrl,
    config.supabaseServiceRoleKey
  )