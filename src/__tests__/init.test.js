/* globals test, expect */
import { initDummyDocument } from '../test-utils'

test('should create 2 pages', (_, document) => {
  expect(document.pages.length).toBe(1)
  initDummyDocument(document)
  expect(document.pages.length).toBe(3)
})
