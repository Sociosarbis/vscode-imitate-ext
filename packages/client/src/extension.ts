import * as serverProtocol from '@volar/language-server/protocol'
import { activateAutoInsertion, createLabsInfo } from '@volar/vscode'
import * as vscode from 'vscode'
import * as lsp from 'vscode-languageclient/node'
import { XLogTextContentProvider } from './provider/xlog'

let client: lsp.BaseLanguageClient | undefined

export async function activate(context: vscode.ExtensionContext) {
  const serverModule = vscode.Uri.joinPath(context.extensionUri, 'server.js')
  const serverOptions: lsp.ServerOptions = {
    run: {
      module: serverModule.fsPath,
      transport: lsp.TransportKind.ipc,
      options: { execArgv: [] },
    },
    debug: {
      module: serverModule.fsPath,
      transport: lsp.TransportKind.ipc,
      options: { execArgv: ['--nolazy', '--inspect=6009'] },
    },
  }
  const clientOptions: lsp.LanguageClientOptions = {
    documentSelector: [{ language: 'markdown' }, { language: 'xlog' }],
    initializationOptions: {},
  }

  client = new lsp.LanguageClient('markdown-language-server', 'Markdown Language Server', serverOptions, clientOptions)
  const xlogProvider = new XLogTextContentProvider()
  context.subscriptions.push(vscode.window.tabGroups.onDidChangeTabs(xlogProvider.onDidChangeTabs), vscode.workspace.registerTextDocumentContentProvider(XLogTextContentProvider.scheme, xlogProvider))
  xlogProvider.onDidChangeTabs()
  await client.start()
  activateAutoInsertion('markdown', client)
  const labsInfo = createLabsInfo(serverProtocol)
  labsInfo.addLanguageClient(client)
  return labsInfo.extensionExports
}

export function deactivate() {
  return client?.stop()
}
