import { createConnection, createServer, createSimpleProject } from '@volar/language-server/node'
import { create as createHtmlService } from 'volar-service-html'
import { create as createCssService } from 'volar-service-css'
import { language } from './languagePlugin'
import { service } from './languageServicePlugin'

const connection = createConnection()
const server = createServer(connection)

connection.listen()

connection.onInitialize((params) => {
  return server.initialize(params, createSimpleProject([language]), [createHtmlService(), createCssService(), service])
})

connection.onInitialized(server.initialized)
connection.onShutdown(server.shutdown)
