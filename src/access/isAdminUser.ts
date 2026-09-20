export function isAdminUser(user: { collection?: string } | null | undefined): boolean {
  return Boolean(user && user.collection === 'users')
}
