const esbuild = require('esbuild')
const path = require('path')

const distElectron = path.resolve(__dirname, '..', 'dist-electron')
const fs = require('fs')
if (!fs.existsSync(distElectron)) fs.mkdirSync(distElectron, { recursive: true })

async function bundle(entry, outfile) {
  await esbuild.build({
    entryPoints: [entry],
    bundle: true,
    outdir: distElectron,
    format: 'cjs',
    platform: 'node',
    target: ['node18'],
    external: ['electron'],
    logLevel: 'info',
  })
  console.log(`✅ bundled: ${entry} -> ${outfile}`)
}

async function main() {
  await bundle(path.resolve(__dirname, '..', 'electron', 'main.ts'), path.join(distElectron, 'main.js'))
  await bundle(path.resolve(__dirname, '..', 'electron', 'preload.ts'), path.join(distElectron, 'preload.js'))
}

main().catch(err => { console.error(err); process.exit(1) })
