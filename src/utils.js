import * as sketch from 'sketch'
import {
  TEXT_EXAMPLES,
  ROOT_STYLE_NAME,
  TEXT_STYLES_PAGE,
  LAYER_STYLES_PAGE,
} from './constants'

let i = 0
export function getTextExample() {
  return TEXT_EXAMPLES[i++ % TEXT_EXAMPLES.length]
}

export function getParts(sharedStyle) {
  return sharedStyle.name.split('/').map(p => p.trim())
}

function buildHierarchy(sharedStyles) {
  return sharedStyles.reduce((prev, s) => {
    const parts = getParts(s)

    let currentParent = { children: prev }

    parts.forEach(p => {
      let index = currentParent.children.findIndex(x => x.name === p)
      if (index === -1) {
        index = currentParent.children.length
        currentParent.children.push({
          name: p,
          children: [],
        })
      }
      currentParent = currentParent.children[index]
    })

    currentParent.style = s

    return prev
  }, [])
}

export function getHierarchy(document, isTextStyle) {
  const sharedStyles = (isTextStyle
    ? document.sharedTextStyles || document.getSharedTextStyles()
    : document.sharedLayerStyles || document.getSharedLayerStyles()
  ).filter(s => !s.getLibrary())

  return buildHierarchy(sharedStyles)
}

export function createSharedStyle(isTextStyle, name, style, document) {
  if (document.sharedTextStyles) {
    const sharedStyles =
      document[isTextStyle ? 'sharedTextStyles' : 'sharedLayerStyles']
    const newLength = sharedStyles.push({
      name,
      style,
    })
    return sharedStyles[newLength - 1]
  }

  return sketch.SharedStyle.fromStyle({ name, style, document })
}

function _updateLayout({ name, style, children }, parent, isTextStyle, y) {
  if (!children.length && !style) {
    throw new Error('what')
  }

  const Primitive = isTextStyle ? sketch.Text : sketch.ShapePath

  if (!children.length) {
    let matchingLayer = parent.layers.find(l => l.name === name)
    if (!matchingLayer) {
      matchingLayer = new Primitive({
        parent,
        name,
        frame: {
          x: 20,
          y,
          width: 50,
          height: 50,
        },
        style: style.style,
        sharedStyle: style,
      })

      if (isTextStyle) {
        matchingLayer.text = getTextExample()
        matchingLayer.name = name
        matchingLayer.adjustToFit()
      }
    }

    // reposition the layer
    matchingLayer.frame.x = 20
    matchingLayer.frame.y = y

    return matchingLayer.frame.height
  }

  let matchingGroup = parent.layers.find(l => l.name === name)
  if (!matchingGroup) {
    matchingGroup = new sketch.Group({
      parent,
      name,
      frame: {
        x: 20,
        y,
        width: 1000,
        height: 1000,
      },
    })
  }

  // remove outdated layers
  matchingGroup.layers.forEach(l => {
    if (!children.find(c => c.name === l.name) && l.name !== ROOT_STYLE_NAME) {
      l.parent = undefined
    }
  })

  let matchingDefault = matchingGroup.layers.find(
    l => l.name === ROOT_STYLE_NAME
  )
  if (!matchingDefault) {
    matchingDefault = new Primitive({
      parent: matchingGroup,
      name: ROOT_STYLE_NAME,
      frame: {
        x: 0,
        y: 0,
        width: 50,
        height: 50,
      },
    })
    if (style) {
      matchingDefault.style = style.style
      matchingDefault.sharedStyle = style
    } else if (!isTextStyle) {
      // need to set a default style
      matchingDefault.style = {
        fills: ['#000'],
      }
    }

    if (isTextStyle) {
      matchingDefault.text = getTextExample()
      matchingDefault.name = ROOT_STYLE_NAME
      matchingDefault.adjustToFit()
    }
  }

  matchingDefault.frame.x = 0
  matchingDefault.frame.y = 0

  let childrenY = matchingDefault.frame.height + 20

  children.forEach(c => {
    childrenY += _updateLayout(c, matchingGroup, isTextStyle, childrenY) + 20
  })

  matchingGroup.adjustToFit()
  matchingGroup.frame.x = 20
  matchingGroup.frame.y = y

  return matchingGroup.frame.height
}

const adjustArtboard = artboard => {
  artboard.adjustToFit()
  artboard.frame.x = 0
  artboard.frame.y = 0
  artboard.frame.width += 40
  artboard.frame.height += 40
  artboard.layers.forEach(x => {
    x.frame.x += 20
    x.frame.y += 20
  })
}

export const updateLayerHierarchy = (artboard, hierarchy, isTextStyle) => {
  let y = 20

  hierarchy.forEach(c => {
    y += _updateLayout(c, artboard, isTextStyle, y) + 20
  })

  adjustArtboard(artboard)
}

export const getInheritedKeys = layer => {
  const inheritance = layer
    ? sketch.Settings.layerSettingForKey(layer, 'inheritance') || {}
    : {}
  return Object.keys(inheritance).filter(k => inheritance[k])
}

export const updateChildren = parent => {
  if (!parent || !parent.layers) {
    return
  }
  const defaultStyle = parent.layers.find(l => l.name === ROOT_STYLE_NAME)
  const inheritance = getInheritedKeys(defaultStyle)
  parent.layers.forEach(l => {
    if (l.name === ROOT_STYLE_NAME) {
      return
    }
    if (l.sharedStyle) {
      inheritance.forEach(k => {
        l.style[k] = defaultStyle.style[k]
      })
      l.sharedStyle.style = l.style
    }
    if (l.type === 'Group') {
      const child = l.layers.find(x => x.name === ROOT_STYLE_NAME)
      if (child) {
        inheritance.forEach(k => {
          child.style[k] = defaultStyle.style[k]
        })
        if (child.sharedStyle) {
          child.sharedStyle.style = child.style
        }
      }
    }
    updateChildren(l)
  })
}

export function updateLayout(document, hierarchy, isTextStyle) {
  const page = document.pages.find(
    p => p.name === (isTextStyle ? TEXT_STYLES_PAGE : LAYER_STYLES_PAGE)
  )
  updateLayerHierarchy(page.layers[0], hierarchy, isTextStyle)
}
