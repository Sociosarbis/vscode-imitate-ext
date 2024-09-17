import type { DocumentSymbol, LanguageServicePlugin, LocationLink, SymbolKind } from '@volar/language-service'

export const service = {
  name: 'markdown-service',
  capabilities: {
    definitionProvider: true,
  },
  create(_) {
    return {
      provideDocumentSymbols(document, _) {
        const { lineCount } = document
        const ret: Array<DocumentSymbol> = []
        let range: [number, number] | undefined
        const addSymbol = (line: string, lineNo: number) => {
          const rng = {
            start: { line: lineNo, character: range[0] },
            end: { line: lineNo, character: range[1] },
          }
          const name = line.substring(range[0], range[1])
          ret.push({ name, range: rng, selectionRange: rng, children: [], detail: name, kind: 13 satisfies SymbolKind })
          range = undefined
        }
        for (let i = 0; i < lineCount; i++) {
          const line = document.getText({ start: { line: i, character: 0 }, end: { line: i, character: Number.POSITIVE_INFINITY } })
          for (let j = 0; j < line.length; j++) {
            if (!/[\s\r\n\t]/g.test(line[j])) {
              if (range) {
                range[1] = j + 1
              }
            }
            else {
              if (range) {
                addSymbol(line, i)
              }
            }
          }
          if (range) {
            addSymbol(line, i)
          }
        }
        return ret
      },
      provideDefinition(document, position, _) {
        let index = document.offsetAt(position)
        const ret: Array<LocationLink> = []
        const text = document.getText()
        const visibleCharReg = /[^\s\r\n\t]/
        const invisibleCharReg = /[\s\r\n\t]/
        while (index >= 0 && visibleCharReg.test(text[index])) {
          index--
        }
        while (index >= 0 && invisibleCharReg.test(text[index])) {
          index--
        }
        if (index >= 0) {
          const range = [index, index + 1]
          while (index >= 0 && visibleCharReg.test(text[index])) {
            index--
          }
          range[0] = index + 1
          const rng = {
            start: document.positionAt(range[0]),
            end: document.positionAt(range[1]),
          }
          ret.push({ targetUri: document.uri, targetRange: rng, targetSelectionRange: rng })
        }
        return ret
      },
    }
  },
} satisfies LanguageServicePlugin
