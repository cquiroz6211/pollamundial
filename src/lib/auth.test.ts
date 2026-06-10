// Auth tests — simplified for new schema
import { generateAvatar } from './auth'

describe('generateAvatar', () => {
  it('should generate avatar with initials', () => {
    const svg = generateAvatar('John Doe')
    expect(svg).toContain('JD')
    expect(svg).toContain('data:image/svg+xml')
  })

  it('should handle single name', () => {
    const svg = generateAvatar('Carlos')
    expect(svg).toContain('CA')
  })
})
