import { createSharedStyle } from './utils'
import { main as init } from './init'

export function initDummyDocument(document) {
  document.pages[0].layers = [{ type: 'Artboard' }]
  createSharedStyle(true, 'Header/H1', { fontSize: 12 }, document)
  createSharedStyle(true, 'Header/H2', { fontSize: 12 }, document)
  createSharedStyle(true, 'Button/Primary', { fontSize: 12 }, document)
  createSharedStyle(true, 'Button/Secondary', { fontSize: 12 }, document)
  init(document)
}
