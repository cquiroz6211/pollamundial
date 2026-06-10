export interface User {
  id: string
  name: string
  group_id: string
  avatar?: string
}

export interface SupabaseUser {
  id: string
  name: string
  group_id: string
  avatar?: string
}

export interface SupabaseResult<T> {
  data: T | null
  error: Error | null
}

export interface SupabaseClient {
  from(table: string): SupabaseTable
}

export interface SupabaseTable {
  select(columns?: string): SupabaseQueryBuilder
  insert(record: Record<string, unknown>): SupabaseInsertBuilder
}

export interface SupabaseQueryBuilder {
  eq(column: string, value: unknown): SupabaseQueryBuilder
  limit(n: number): SupabaseQueryBuilder
  select(columns?: string): Promise<SupabaseResult<SupabaseUser[]>>
}

export interface SupabaseInsertBuilder {
  select(): SupabaseInsertSelectBuilder
}

export interface SupabaseInsertSelectBuilder {
  single(): Promise<SupabaseResult<SupabaseUser>>
}

export function generateAvatar(name: string): string {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const hexColors = [
    '#22c55e', '#3b82f6', '#a855f7', '#ef4444',
    '#eab308', '#ec4899', '#6366f1', '#14b8a6',
  ]

  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }

  const color = hexColors[Math.abs(hash) % hexColors.length]

  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="${color}"/><text x="50" y="55" text-anchor="middle" fill="white" font-size="40" font-family="Arial" font-weight="bold">${initials}</text></svg>`
  )}`
}

export interface GetUserOrCreateResult {
  user: User | null
  error: string | null
}

export async function getUserOrCreate(
  supabase: SupabaseClient,
  name: string,
  groupId: string
): Promise<GetUserOrCreateResult> {
  const trimmedName = name.trim()

  const { data: existingUsers, error: findError } = (await supabase
    .from('users')
    .select('*')
    .eq('name', trimmedName)
    .eq('group_id', groupId)
    .limit(1)
    .select()) as SupabaseResult<SupabaseUser[]>

  if (findError) {
    return { user: null, error: 'Error de conexión. Intenta de nuevo.' }
  }

  if (existingUsers && existingUsers.length > 0) {
    return { user: existingUsers[0] as User, error: null }
  }

  const { data: newUser, error: insertError } = await supabase
    .from('users')
    .insert({
      name: trimmedName,
      avatar: generateAvatar(trimmedName),
      group_id: groupId,
    })
    .select()
    .single() as SupabaseResult<SupabaseUser>

  if (insertError || !newUser) {
    return { user: null, error: 'Error al crear tu usuario. Intenta con otro nombre.' }
  }

  return { user: newUser as User, error: null }
}
