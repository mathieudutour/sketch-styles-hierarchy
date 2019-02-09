import sketch from 'sketch'
import { TEXT_STYLES_PAGE, LAYER_STYLES_PAGE } from './constants'
import { getHierarchy, updateLayerHierarchy } from './utils'

const buildLayerHierarchy = (parent, name, hierarchy, isTextStyle) => {
  const artboard = new sketch.Artboard({
    parent,
    name,
    frame: {
      x: 0,
      y: 0,
      width: 1000,
      height: 1000,
    },
  })

  updateLayerHierarchy(artboard, hierarchy, isTextStyle)
}

export function main(document) {
  const textStylesPage =
    document.pages.find(p => p.name === TEXT_STYLES_PAGE) ||
    new sketch.Page({
      name: TEXT_STYLES_PAGE,
      parent: document,
    })

  const layerStylesPage =
    document.pages.find(p => p.name === LAYER_STYLES_PAGE) ||
    new sketch.Page({
      name: LAYER_STYLES_PAGE,
      parent: document,
    })

  textStylesPage.layers = []
  layerStylesPage.layers = []

  const textStylesHierachy = getHierarchy(document, true)
  const layerStylesHierachy = getHierarchy(document, false)

  buildLayerHierarchy(textStylesPage, 'Text Styles', textStylesHierachy, true)
  buildLayerHierarchy(
    layerStylesPage,
    'Layer Styles',
    layerStylesHierachy,
    false
  )
}

export default function() {
  const document = sketch.getSelectedDocument()

  main(document)
}
