export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { validateAdminEnv } = await import('@jeans-store/validators/env')
    validateAdminEnv(process.env)
  }
}
