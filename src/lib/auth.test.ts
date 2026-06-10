import { describe, it, expect, vi } from 'vitest'
import { getUserOrCreate, generateAvatar } from './auth'
import type { SupabaseClient, SupabaseUser } from './auth'

function createMockSupabase(
  findBehavior: (name: string, groupId: string) => SupabaseUser[] | null,
  insertBehavior: (record: Record<string, unknown>) => SupabaseUser | null
): SupabaseClient {
  return {
    from: vi.fn((table: string) => {
      const filters: Record<string, unknown> = {}

      // Chainable builder: .select().eq().eq().limit() all return this same object
      const builder: any = {
        eq(col: string, val: unknown) {
          filters[col] = val
          return builder
        },
        limit() {
          // Terminal .select() returns the result Promise
          return {
            select() {
              if (table === 'users') {
                const name = filters['name'] as string
                const groupId = filters['group_id'] as string
                const result = findBehavior(name, groupId)
                return Promise.resolve({ data: result, error: null })
              }
              return Promise.resolve({ data: null, error: null })
            },
          }
        },
      }

      return {
        select() {
          return builder
        },
        insert(record: Record<string, unknown>) {
          return {
            select() {
              return {
                single() {
                  const result = insertBehavior(record)
                  if (result) {
                    return Promise.resolve({ data: result, error: null })
                  }
                  return Promise.resolve({ data: null, error: new Error('Insert failed') })
                },
              }
            },
          }
        },
      }
    }),
  } as unknown as SupabaseClient
}

describe('generateAvatar', () => {
  it('should generate an SVG data URI with the user initials', () => {
    const avatar = generateAvatar('Carlos')
    expect(avatar).toBeTypeOf('string')
    expect(avatar).toContain('data:image/svg+xml')
    expect(avatar).toContain('C')
  })

  it('should handle multi-word names', () => {
    const avatar = generateAvatar('Carlos Rodriguez')
    expect(avatar).toContain('CR')
  })

  it('should generate consistent colors for the same name', () => {
    const avatar1 = generateAvatar('Carlos')
    const avatar2 = generateAvatar('Carlos')
    expect(avatar1).toBe(avatar2)
  })
})

describe('getUserOrCreate', () => {
  it('should return existing user when user already exists in the group', async () => {
    const existingUser: SupabaseUser = {
      id: 'user-123',
      name: 'Carlos',
      group_id: 'group-456',
      avatar: 'avatar-url',
    }

    const supabase = createMockSupabase(
      (_name, groupId) => {
        if (_name === 'Carlos' && groupId === 'group-456') return [existingUser]
        return null
      },
      () => {
        throw new Error('insertBehavior should not be called when user exists')
      }
    )

    const result = await getUserOrCreate(supabase, 'Carlos', 'group-456')

    expect(result.error).toBeNull()
    expect(result.user).toEqual(existingUser)
  })

  it('should create a new user when user does not exist', async () => {
    const supabase = createMockSupabase(
      () => null,
      (record) => ({
        id: 'user-new',
        name: record.name as string,
        group_id: record.group_id as string,
        avatar: record.avatar as string,
      })
    )

    const result = await getUserOrCreate(supabase, 'Maria', 'group-789')

    expect(result.error).toBeNull()
    expect(result.user?.name).toBe('Maria')
    expect(result.user?.group_id).toBe('group-789')
    expect(result.user?.avatar).toContain('M')
  })

  it('should NOT create a duplicate when the same user logs in twice', async () => {
    const existingUser: SupabaseUser = {
      id: 'user-123',
      name: 'Carlos',
      group_id: 'group-456',
      avatar: 'avatar-url',
    }

    let insertCount = 0

    const supabase = createMockSupabase(
      (_name, groupId) => {
        if (_name === 'Carlos' && groupId === 'group-456') return [existingUser]
        return null
      },
      () => {
        insertCount++
        return {
          id: 'user-duplicate',
          name: 'Carlos',
          group_id: 'group-456',
        }
      }
    )

    const result1 = await getUserOrCreate(supabase, 'Carlos', 'group-456')
    const result2 = await getUserOrCreate(supabase, 'Carlos', 'group-456')

    expect(result1.user?.id).toBe('user-123')
    expect(result2.user?.id).toBe('user-123')
    expect(insertCount).toBe(0)
  })

  it('should handle different users in the same group', async () => {
    const carlos: SupabaseUser = {
      id: 'carlos-id',
      name: 'Carlos',
      group_id: 'group-456',
    }

    const maria: SupabaseUser = {
      id: 'maria-id',
      name: 'Maria',
      group_id: 'group-456',
    }

    const supabase = createMockSupabase(
      (_name, groupId) => {
        if (_name === 'Carlos' && groupId === 'group-456') return [carlos]
        if (_name === 'Maria' && groupId === 'group-456') return [maria]
        return null
      },
      (record) => ({
        id: `new-${record.name}`,
        name: record.name as string,
        group_id: record.group_id as string,
      })
    )

    const result1 = await getUserOrCreate(supabase, 'Carlos', 'group-456')
    const result2 = await getUserOrCreate(supabase, 'Maria', 'group-456')

    expect(result1.user?.id).toBe('carlos-id')
    expect(result2.user?.id).toBe('maria-id')
  })

  it('should handle different users with same name in different groups', async () => {
    const carlosGroup1: SupabaseUser = {
      id: 'carlos-g1',
      name: 'Carlos',
      group_id: 'group-1',
    }

    const carlosGroup2: SupabaseUser = {
      id: 'carlos-g2',
      name: 'Carlos',
      group_id: 'group-2',
    }

    const supabase = createMockSupabase(
      (_name, groupId) => {
        if (_name === 'Carlos' && groupId === 'group-1') return [carlosGroup1]
        if (_name === 'Carlos' && groupId === 'group-2') return [carlosGroup2]
        return null
      },
      (record) => ({
        id: `new-${record.group_id}`,
        name: record.name as string,
        group_id: record.group_id as string,
      })
    )

    const result1 = await getUserOrCreate(supabase, 'Carlos', 'group-1')
    const result2 = await getUserOrCreate(supabase, 'Carlos', 'group-2')

    expect(result1.user?.id).toBe('carlos-g1')
    expect(result2.user?.id).toBe('carlos-g2')
  })

  it('should return error when connection fails', async () => {
    const supabase = {
      from: vi.fn(() => {
        const builder: any = {
          eq() { return builder },
          limit() {
            return {
              select() {
                return Promise.resolve({
                  data: null,
                  error: new Error('Connection failed'),
                })
              },
            }
          },
        }
        return {
          select() { return builder },
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({ data: null, error: new Error('Insert failed') })
              ),
            })),
          })),
        }
      }),
    } as unknown as SupabaseClient

    const result = await getUserOrCreate(supabase, 'Carlos', 'group-456')

    expect(result.user).toBeNull()
    expect(result.error).toBe('Error de conexión. Intenta de nuevo.')
  })

  it('should trim whitespace from names before checking', async () => {
    const existingUser: SupabaseUser = {
      id: 'user-123',
      name: 'Carlos',
      group_id: 'group-456',
    }

    const supabase = createMockSupabase(
      (_name, groupId) => {
        if (_name === 'Carlos' && groupId === 'group-456') return [existingUser]
        return null
      },
      () => {
        throw new Error('Should not insert when user exists with trimmed name')
      }
    )

    const result = await getUserOrCreate(supabase, '  Carlos  ', 'group-456')

    expect(result.error).toBeNull()
    expect(result.user?.id).toBe('user-123')
  })
})
