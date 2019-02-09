import * as sketch from 'sketch'
import {
  TEXT_STYLES_PAGE,
  LAYER_STYLES_PAGE,
  ROOT_STYLE_NAME,
} from './constants'
import {
  getHierarchy,
  getParts,
  createSharedStyle,
  updateLayout,
  getTextExample,
  updateChildren,
} from './utils'

function updateStyleNames(hierarchy, newName) {
  if (hierarchy.style) {
    hierarchy.style.name = newName
  }
  hierarchy.children.forEach(c => {
    updateStyleNames(c, `${newName} / ${c.name}`)
  })
}

function getPreviousParts(group) {
  const { layers } = group
  const layerWithSharedStyle = layers.find(l => l.sharedStyle)
  if (!layerWithSharedStyle) {
    return undefined
  }
  const parts = getParts(layerWithSharedStyle.sharedStyle)
  if (layerWithSharedStyle.name === ROOT_STYLE_NAME) {
    return parts
  }
  parts.pop()
  return parts
}

function deleteSharedStyles(isTextStyle, group, document) {
  if (group.sharedStyle) {
    const documentData = document._getMSDocumentData()
    const container = documentData.sharedObjectContainerOfType(
      isTextStyle ? 2 : 1
    )
    container.removeSharedObject(group.sharedStyle.sketchObject)
  }

  if (group.layers) {
    group.layers.forEach(l => {
      deleteSharedStyles(isTextStyle, l, document)
    })
  }
}

export function onSelectionChanged(context) {
  if (!context.actionContext || !context.actionContext.oldSelection) {
    return
  }

  if (
    !context.actionContext.oldSelection.length ||
    context.actionContext.oldSelection.length > 1
  ) {
    return
  }

  const oldSelection = sketch.fromNative(context.actionContext.oldSelection[0])
  const wasDeleted = !oldSelection.getParentPage()
  const document = sketch.fromNative(context.actionContext.document)
  const parentPage = wasDeleted
    ? document.selectedPage
    : oldSelection.getParentPage()

  if (
    !parentPage ||
    (parentPage.name !== TEXT_STYLES_PAGE &&
      parentPage.name !== LAYER_STYLES_PAGE)
  ) {
    return
  }

  const isTextStyle = parentPage.name === TEXT_STYLES_PAGE

  if (
    oldSelection.type !== 'Group' &&
    (isTextStyle || oldSelection.type !== 'ShapePath') &&
    (!isTextStyle || oldSelection.type !== 'Text')
  ) {
    console.log(oldSelection.type)
    return
  }

  if (wasDeleted) {
    deleteSharedStyles(isTextStyle, oldSelection, document)

    updateLayout(document, getHierarchy(document, isTextStyle), isTextStyle)
    return
  }

  const sharedStylesHierachy = getHierarchy(document, isTextStyle)

  const newParts = [oldSelection.name]
  let current = oldSelection.parent
  while (current && current.type === 'Group') {
    newParts.unshift(current.name)
    current = current.parent
  }

  if (oldSelection.type === 'Group') {
    const previousParts = getPreviousParts(oldSelection)

    if (!previousParts) {
      sketch.UI.message('A group without styles inside is forbidden')
      return
    }

    if (!oldSelection.layers.find(l => l.name === ROOT_STYLE_NAME)) {
      // it's a new group. Let's create the default style
      oldSelection.layers.push({
        name: ROOT_STYLE_NAME,
        type: isTextStyle ? 'Text' : 'ShapePath',
        frame: {
          x: 0,
          y: 0,
          width: 50,
          height: 50,
        },
      })

      const defaultLayer = oldSelection.layers[oldSelection.layers.length - 1]

      if (isTextStyle) {
        defaultLayer.text = getTextExample()
        defaultLayer.name = ROOT_STYLE_NAME
        defaultLayer.adjustToFit()
        defaultLayer.frame.x = 0
        defaultLayer.frame.y = 0
      } else {
        defaultLayer.style = {
          fills: ['#000'],
        }
      }

      // set the inheritance setting like the parent
      const parentDefaultStyle = oldSelection.parent
        ? oldSelection.parent.layers.find(l => l.name === ROOT_STYLE_NAME)
        : undefined
      if (parentDefaultStyle) {
        sketch.Settings.setLayerSettingForKey(
          defaultLayer,
          'inheritance',
          sketch.Settings.layerSettingForKey(
            parentDefaultStyle,
            'inheritance'
          ) || {}
        )
      }

      // set the style depending on the parent
      updateChildren(oldSelection.parent)

      updateLayout(document, sharedStylesHierachy, isTextStyle)
      return
    }

    if (
      previousParts.length === newParts.length &&
      previousParts.every((p, i) => p === newParts[i])
    ) {
      // nothing changed
      return
    }

    // we might have changed the name
    const foundParts = []
    let currentHierarchy = { children: sharedStylesHierachy }
    let index = currentHierarchy.children.findIndex(
      x => x.name === newParts[foundParts.length]
    )
    while (index !== -1) {
      currentHierarchy = currentHierarchy.children[index]
      foundParts.push(currentHierarchy.name)
      index = currentHierarchy.children.findIndex(
        x => x.name === newParts[foundParts.length]
      )
    }

    if (foundParts.length === newParts.length) {
      // nothing changed but should have
      sketch.UI.message(
        'probably means that 2 groups are called the same, bad!'
      )
      return
    }

    // we need to find the group that changed
    const siblings = oldSelection.parent.layers.filter(
      l => l.name !== ROOT_STYLE_NAME && l.id !== oldSelection.id
    )
    const childLeft = currentHierarchy.children.filter(
      c => !siblings.find(s => s.name === c.name)
    )
    if (childLeft.length > 1) {
      sketch.UI.message('too many children left!')
      return
    }
    // it's been moved or renamed
    updateStyleNames(childLeft[0], newParts.join(' / '))

    updateLayout(document, getHierarchy(document, isTextStyle), isTextStyle)
    return
  }

  // now we are dealing with a proper layer

  // a layer shared style should be up to date with its style at all time
  if (
    oldSelection.sharedStyle &&
    oldSelection.style.isOutOfSyncWithSharedStyle(oldSelection.sharedStyle)
  ) {
    oldSelection.sharedStyle.style = oldSelection.style
  }

  if (oldSelection.name === ROOT_STYLE_NAME) {
    newParts.pop()
    // update the children
    updateChildren(oldSelection.parent)
  } else if (!oldSelection.sharedStyle) {
    // we create a new layer so we need to transform it into a shared style
    const sharedStyle = createSharedStyle(
      isTextStyle,
      newParts.join(' / '),
      oldSelection.style,
      document
    )
    oldSelection.sharedStyle = sharedStyle
  }

  if (oldSelection.sharedStyle) {
    oldSelection.sharedStyle.name = newParts.join(' / ')
  }

  updateLayout(document, getHierarchy(document, isTextStyle), isTextStyle)
}
