import type { CodeMapping, LanguagePlugin, Mapping, VirtualCode } from '@volar/language-core'
import type { URI } from 'vscode-uri'
import type * as ts from 'typescript'

export const language: LanguagePlugin<URI, MarkdownCode> = {
  getLanguageId(uri) {
    if (uri.path.endsWith('.md')) {
      return 'markdown'
    }
  },
  createVirtualCode(scriptId, languageId, snapshot) {
    if (languageId === 'markdown') {
      return new MarkdownCode(snapshot)
    }
  },
  updateVirtualCode(scriptId, virtualCode, newSnapshot) {
    virtualCode.update(newSnapshot)
    return virtualCode
  },
}

export class MarkdownCode implements VirtualCode {
  mappings: CodeMapping[]
  id = 'root'
  languageId = 'markdown'

  constructor(public snapshot: ts.IScriptSnapshot) {
    this.onSnapshotUpdated()
  }

  update(newSnapshot: ts.IScriptSnapshot) {
    this.snapshot = newSnapshot
    this.onSnapshotUpdated()
  }

  onSnapshotUpdated() {
    this.mappings = [{
      sourceOffsets: [0],
      generatedOffsets: [0],
      lengths: [this.snapshot.getLength()],
      data: {
        completion: true,
        format: true,
        navigation: true,
        semantic: true,
        structure: true,
        verification: true,
      },
    }]
  }
}
