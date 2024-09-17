import type ts from 'typescript/lib/tsserverlibrary'

interface Mapping {
  source?: string
  sourceOffsets: number[]
  generatedOffsets: number[]
  lengths: number[]
}

function binarySearch(values: number[], searchValue: number) {
  let low = 0
  let high = values.length - 1
  let match
  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    const midValue = values[mid]
    if (midValue < searchValue) {
      low = mid + 1
    }
    else if (midValue > searchValue) {
      high = mid - 1
    }
    else {
      low = mid
      high = mid
      match = mid
      break
    }
  }
  const finalLow = Math.max(Math.min(low, high, values.length - 1), 0)
  const finalHigh = Math.min(Math.max(low, high, 0), values.length - 1)
  return { low: finalLow, high: finalHigh, match }
}

function createMemo(mappings: Mapping[], fromRange: 'sourceOffsets' | 'generatedOffsets') {
  const offsetsSet = new Set<number>()
  for (const mapping of mappings) {
    const rangeOffsets = mapping[fromRange]
    const n = rangeOffsets.length
    for (let i = 0; i < n; i++) {
      offsetsSet.add(rangeOffsets[i])
      offsetsSet.add(rangeOffsets[i] + mapping.lengths[i])
    }
  }
  const offsets = [...offsetsSet]
  offsets.sort((a, b) => a - b)
  const maps = offsets.map(() => new Set<Mapping>())
  for (const mapping of mappings) {
    const rangeOffsets = mapping[fromRange]
    const n = rangeOffsets.length
    for (let i = 0; i < n; i++) {
      const start = binarySearch(offsets, rangeOffsets[i]).match!
      const end = binarySearch(offsets, rangeOffsets[i] + mapping.lengths[i]).match!
      for (let j = start; j <= end; j++) {
        maps[j].add(mapping)
      }
    }
  }
  return { offsets, mappings }
}

const fileLanguageIdProviderPlugin = {
  getLanguageId(scriptId: string) {
    const extRegExp = /\.([^\.])$/
    let match = scriptId.match(extRegExp)
    while (match) {
      const ext = match[1]
      switch (ext) {
        case 'js': return 'javascript'
        case 'cjs': return 'javascript'
        case 'mjs': return 'javascript'
        case 'ts': return 'typescript'
        case 'cts': return 'typescript'
        case 'mts': return 'typescript'
        case 'jsx': return 'javascriptreact'
        case 'tsx': return 'typescriptreact'
        case 'json': return 'json'
      }
      scriptId = scriptId.substring(0, scriptId.length - ext.length - 1)
      match = scriptId.match(extRegExp)
    }
  },
}

const init: ts.server.PluginModuleFactory = ({ typescript: ts }) => {
  function create({ languageService, languageServiceHost }: ts.server.PluginCreateInfo) {
    const { getDefinitionAtPosition, getDefinitionAndBoundSpan, getTypeDefinitionAtPosition } = languageService
    const { getScriptSnapshot } = languageServiceHost

    languageService.getTypeDefinitionAtPosition = (fileName, position) => {
      if (fileName.endsWith('.vine.ts') && fileLanguageIdProviderPlugin.getLanguageId(fileName) === 'typescript') {
        return [
          {
            kind: ts.ScriptElementKind.variableElement,
            name: 'a',
            containerKind: ts.ScriptElementKind.variableElement,
            containerName: 'b',
            textSpan: {
              start: 0,
              length: 10,
            },
            fileName,
          },
        ]
      }
      return getTypeDefinitionAtPosition.call(languageService, fileName, position)
    }

    languageService.getDefinitionAndBoundSpan = (fileName, position) => {
      if (fileName.endsWith('.vine.ts') && fileLanguageIdProviderPlugin.getLanguageId(fileName) === 'typescript') {
        return {
          textSpan: {
            start: 0,
            length: 10,
          },
        }
      }
      return getDefinitionAndBoundSpan.call(languageService, fileName, position)
    }

    languageService.getDefinitionAtPosition = (fileName, position) => {
      if (fileName.endsWith('.vine.ts') && fileLanguageIdProviderPlugin.getLanguageId(fileName) === 'typescript') {
        return [{
          kind: ts.ScriptElementKind.variableElement,
          name: 'a',
          containerKind: ts.ScriptElementKind.variableElement,
          containerName: 'b',
          textSpan: {
            start: 0,
            length: 10,
          },
          fileName,
        }]
      }
      return getDefinitionAtPosition.call(languageService, fileName, position)
    }
    languageServiceHost.getScriptSnapshot = (fileName) => {
      // if (fileName.endsWith('.vine.ts') && fileLanguageIdProviderPlugin.getLanguageId(fileName) === 'typescript') {
      //   return ts.ScriptSnapshot.fromString('declare const a: string;\n' + 'export default a;')
      // }
      return getScriptSnapshot.call(languageServiceHost, fileName)
    }
    return languageService
  }
  return {
    create,
  }
}

// eslint-disable-next-line ts/prefer-ts-expect-error
// @ts-ignore TypeScript Plugin needs to be exported with `export =`
// eslint-disable-next-line no-restricted-syntax
export = init
