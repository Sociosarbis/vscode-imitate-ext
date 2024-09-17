import { createRequire } from 'node:module'
import { defineConfig } from 'tsup'

const require = createRequire(import.meta.url)

export default defineConfig(
  [
    {
      entry: {
        'dist/client': './packages/client/src/extension.ts',
        'dist/server': './packages/server/src/index.ts',
        // We need to generate this inside node_modules so VS Code can resolve it
        'node_modules/@sociosarbis/typescript-plugin/index': 'src/typesript-plugin/index.ts',
      },
      outDir: '.',
      format: 'cjs',
      external: ['vscode', /\.node$/],
      bundle: true,
      define: { 'process.env.NODE_ENV': '"production"' },
      esbuildPlugins: [
        {
          name: 'umd2esm',
          setup(build) {
            build.onResolve({ filter: /^(vscode-.*|estree-walker|jsonc-parser)/ }, (args) => {
              const pathUmdMay = require.resolve(args.path, { paths: [args.resolveDir] })
              // Call twice the replace is to solve the problem of the path in Windows
              let pathEsm = pathUmdMay
                .replace('/umd/', '/esm/')
                .replace('\\umd\\', '\\esm\\')

              if (pathEsm.includes('vscode-uri')) {
                pathEsm = pathEsm
                  .replace('/esm/index.js', '/esm/index.mjs')
                  .replace('\\esm\\index.js', '\\esm\\index.mjs')
              }

              return { path: pathEsm }
            })
          },
        },
      ],
    },
  ],
)
