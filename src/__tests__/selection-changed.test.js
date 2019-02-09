/* globals test, expect */
import { initDummyDocument } from '../test-utils'
import { onSelectionChanged } from '../selection-changed'

test('should not do anything if there was no selection', (_, document) => {
  initDummyDocument(document)
  const context = {
    actionContext: {
      document: document.sketchObject,
      oldSelection: [],
    },
  }
  expect(onSelectionChanged(context)).toBe('no old selection')
})

test('should not do anything if there are more than one layer selected', (_, document) => {
  initDummyDocument(document)
  const context = {
    actionContext: {
      document: document.sketchObject,
      oldSelection: [
        document.pages[1].layers[0].layers[0].sketchObject,
        document.pages[1].layers[0].layers[1].sketchObject,
      ],
    },
  }
  expect(onSelectionChanged(context)).toBe('too big selection')
})

test('should not do anything if the selection is from another page', (_, document) => {
  initDummyDocument(document)
  const context = {
    actionContext: {
      document: document.sketchObject,
      oldSelection: [document.pages[0].sketchObject],
    },
  }
  expect(onSelectionChanged(context)).toBe('ignoring because wrong page')
})

test('should not do anything if the selection is not the right type', (_, document) => {
  initDummyDocument(document)
  const context = {
    actionContext: {
      document: document.sketchObject,
      oldSelection: [document.pages[2].layers[0].sketchObject],
    },
  }
  expect(onSelectionChanged(context)).toBe(
    'ignoring because wrong type Artboard'
  )
})

test('should delete the shared style when deleting a layer', (_, document) => {
  initDummyDocument(document)
  let sharedStyles = (
    document.sharedTextStyles || document.getSharedTextStyles()
  ).filter(s => !s.getLibrary())
  expect(sharedStyles.length).toBe(4)
  document.pages[1].selected = true
  const layer = document.pages[1].layers[0].layers[1].layers[1]
  const sharedStyleName = layer.sharedStyle.name
  layer.parent = undefined
  const context = {
    actionContext: {
      document: document.sketchObject,
      oldSelection: [layer.sketchObject],
    },
  }
  expect(onSelectionChanged(context)).toBe('handled deleted')
  sharedStyles = (
    document.sharedTextStyles || document.getSharedTextStyles()
  ).filter(s => !s.getLibrary())
  expect(sharedStyles.length).toBe(3)
  expect(sharedStyles.find(s => s.name === sharedStyleName)).toBe(undefined)
})

test('should delete the shared styles when deleting a group', (_, document) => {
  initDummyDocument(document)
  let sharedStyles = (
    document.sharedTextStyles || document.getSharedTextStyles()
  ).filter(s => !s.getLibrary())
  expect(sharedStyles.length).toBe(4)
  document.pages[1].selected = true
  const group = document.pages[1].layers[0].layers[1]
  group.parent = undefined
  const context = {
    actionContext: {
      document: document.sketchObject,
      oldSelection: [group.sketchObject],
    },
  }
  expect(onSelectionChanged(context)).toBe('handled deleted')
  sharedStyles = (
    document.sharedTextStyles || document.getSharedTextStyles()
  ).filter(s => !s.getLibrary())
  expect(sharedStyles.length).toBe(2)
})

test('should ignore a group without style inside', (_, document) => {
  initDummyDocument(document)

  document.pages[1].layers[0].layers.push({
    type: 'Group',
  })

  const group = document.pages[1].layers[0].layers[2]
  const context = {
    actionContext: {
      document: document.sketchObject,
      oldSelection: [group.sketchObject],
    },
  }
  expect(onSelectionChanged(context)).toBe(
    'A group without styles inside is forbidden'
  )
})
