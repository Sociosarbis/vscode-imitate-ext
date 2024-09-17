import { extname } from 'node:path'
import * as vscode from 'vscode'
import { decodeSingleFile } from 'tencent-mars-xlog'

export class XLogTextContentProvider implements vscode.TextDocumentContentProvider, vscode.Disposable {
  static scheme = 'xlog'
  private emitter = new vscode.EventEmitter<vscode.Uri>()
  private fileMap = new Map<string, string>()

  get onDidChange() {
    return this.emitter.event
  }

  async provideTextDocumentContent(uri: vscode.Uri, _token: vscode.CancellationToken): Promise<string> {
    try {
      const ext = extname(uri.path)
      if (this.fileMap.has(uri.path)) {
        return this.fileMap.get(uri.path)
      }
      const content = await decodeSingleFile(uri.path.substring(0, uri.path.length - ext.length), vscode.workspace.getConfiguration('vscode-imitate-ext.xlog').get('private-key'))
      this.fileMap.set(uri.path, content)
      return content
    }
    catch (e) {
      return e.message
    }
  }

  private async show(uri: vscode.Uri) {
    const ext = extname(uri.path)
    if (ext === '.xlog') {
      uri = vscode.Uri.from({ scheme: 'xlog', path: `${uri.path}.log` })
      if (vscode.workspace.textDocuments.some(v => v.uri === uri)) {
        return
      }
      const doc = await vscode.workspace.openTextDocument(uri)
      await vscode.window.showTextDocument(doc)
    }
  }

  onDidChangeTabs = async () => {
    const input = vscode.window.tabGroups.activeTabGroup.activeTab.input
    if (input instanceof vscode.TabInputText) {
      this.show(input.uri)
    }
  }

  dispose() {
    this.emitter.dispose()
  }
}
