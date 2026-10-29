import { validateAdminEnv } from '@jeans-store/validators'

export async function register() {
  validateAdminEnv(process.env)
}
