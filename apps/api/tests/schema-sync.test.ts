import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '../../..')

test('Schema and migration parity between packages/db and apps/api', async (t) => {
  await t.test('packages/db/src/schema.ts and apps/api/src/db/schema.ts must be identical', () => {
    const pkgSchemaPath = path.join(rootDir, 'packages/db/src/schema.ts')
    const apiSchemaPath = path.join(rootDir, 'apps/api/src/db/schema.ts')

    assert.ok(fs.existsSync(pkgSchemaPath), 'packages/db/src/schema.ts exists')
    assert.ok(fs.existsSync(apiSchemaPath), 'apps/api/src/db/schema.ts exists')

    const pkgSchema = fs.readFileSync(pkgSchemaPath, 'utf8').replace(/\r\n/g, '\n').trim()
    const apiSchema = fs.readFileSync(apiSchemaPath, 'utf8').replace(/\r\n/g, '\n').trim()

    assert.equal(apiSchema, pkgSchema, 'apps/api/src/db/schema.ts must match packages/db/src/schema.ts')
  })

  await t.test('drizzle migrations folders must have parity', () => {
    const pkgDrizzle = path.join(rootDir, 'packages/db/drizzle')
    const apiDrizzle = path.join(rootDir, 'apps/api/drizzle')

    assert.ok(fs.existsSync(pkgDrizzle), 'packages/db/drizzle exists')
    assert.ok(fs.existsSync(apiDrizzle), 'apps/api/drizzle exists')

    const pkgSqlFiles = fs.readdirSync(pkgDrizzle).filter((f) => f.endsWith('.sql')).sort()
    const apiSqlFiles = fs.readdirSync(apiDrizzle).filter((f) => f.endsWith('.sql')).sort()

    assert.deepEqual(apiSqlFiles, pkgSqlFiles, 'apps/api/drizzle must have the same SQL migration files as packages/db/drizzle')

    for (const sqlFile of pkgSqlFiles) {
      const pkgContent = fs.readFileSync(path.join(pkgDrizzle, sqlFile), 'utf8').replace(/\r\n/g, '\n').trim()
      const apiContent = fs.readFileSync(path.join(apiDrizzle, sqlFile), 'utf8').replace(/\r\n/g, '\n').trim()
      assert.equal(apiContent, pkgContent, `Migration ${sqlFile} content must be identical`)
    }

    const pkgJournal = fs.readFileSync(path.join(pkgDrizzle, 'meta/_journal.json'), 'utf8').replace(/\r\n/g, '\n').trim()
    const apiJournal = fs.readFileSync(path.join(apiDrizzle, 'meta/_journal.json'), 'utf8').replace(/\r\n/g, '\n').trim()
    assert.equal(apiJournal, pkgJournal, 'Migration journals must be identical')
  })
})
