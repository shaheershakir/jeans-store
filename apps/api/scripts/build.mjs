import { build } from 'esbuild'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const appRoot = path.resolve(__dirname, '..')

// Compile using esbuild:
// - Inline monorepo packages (@jeans-store/*) so the production output is standalone
// - Externalize 3rd-party node_modules (express, drizzle-orm, pg, etc.)
await build({
  entryPoints: [path.join(appRoot, 'src/index.ts')],
  outfile: path.join(appRoot, 'dist/index.js'),
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'esm',
  sourcemap: true,
  banner: {
    js: `import { createRequire as __createRequire } from 'module'; const require = __createRequire(import.meta.url);`
  },
  plugins: [
    {
      name: 'external-npm-dependencies',
      setup(build) {
        build.onResolve({ filter: /.*/ }, (args) => {
          // Keep internal monorepo workspace packages bundled
          if (args.path.startsWith('@jeans-store/')) {
            return undefined
          }
          // Keep relative and absolute local paths bundled
          if (args.path.startsWith('.') || path.isAbsolute(args.path)) {
            return undefined
          }
          // Mark all 3rd-party npm packages as external
          return { path: args.path, external: true }
        })
      }
    }
  ]
})

console.log('✓ @jeans-store/api build complete')
