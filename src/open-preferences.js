/* globals NSAlert, __command, NSAlertFirstButtonReturn, NSOnState, NSOffState */
import * as sketch from 'sketch'
import {
  TEXT_STYLES_PAGE,
  LAYER_STYLES_PAGE,
  ROOT_STYLE_NAME,
} from './constants'
import { updateChildren, updateLayout, getHierarchy } from './utils'

const TextStylePreferencesUI = require('../xib-views/TextStylePreferences.xib')
const LayerStylePreferencesUI = require('../xib-views/LayerStylePreferences.xib')

export default function() {
  const document = sketch.getSelectedDocument()

  const selection = document.selectedLayers

  if (!selection.length || selection.length > 1) {
    sketch.UI.message('You need to select 1 layer')
    return
  }

  const layer = selection.layers[0]
  const parentPage = layer.getParentPage()

  if (
    !parentPage ||
    (parentPage.name !== TEXT_STYLES_PAGE &&
      parentPage.name !== LAYER_STYLES_PAGE)
  ) {
    sketch.UI.message('Only for layers in the right pages')
    return
  }

  const isTextStyle = parentPage.name === TEXT_STYLES_PAGE

  if (
    (isTextStyle || layer.type !== 'ShapePath') &&
    (!isTextStyle || layer.type !== 'Text')
  ) {
    sketch.UI.message('Only for layers of the right types')
    return
  }

  if (layer.name !== ROOT_STYLE_NAME) {
    sketch.UI.message('Only for default style layers')
    return
  }

  let preferencesUI

  if (isTextStyle) {
    preferencesUI = TextStylePreferencesUI()
  } else {
    preferencesUI = LayerStylePreferencesUI()
  }

  let inheritance =
    sketch.Settings.layerSettingForKey(layer, 'inheritance') || {}

  preferencesUI.opacity.state = inheritance.opacity ? NSOnState : NSOffState
  preferencesUI.blendingMode.state = inheritance.blendingMode
    ? NSOnState
    : NSOffState
  preferencesUI.borderOptions.state = inheritance.borderOptions
    ? NSOnState
    : NSOffState
  preferencesUI.blur.state = inheritance.blur ? NSOnState : NSOffState
  preferencesUI.fills.state = inheritance.fills ? NSOnState : NSOffState
  preferencesUI.borders.state = inheritance.borders ? NSOnState : NSOffState
  preferencesUI.shadows.state = inheritance.shadows ? NSOnState : NSOffState
  preferencesUI.innerShadows.state = inheritance.innerShadows
    ? NSOnState
    : NSOffState

  if (isTextStyle) {
    preferencesUI.alignment.state = inheritance.alignment
      ? NSOnState
      : NSOffState
    preferencesUI.verticalAlignment.state = inheritance.verticalAlignment
      ? NSOnState
      : NSOffState
    preferencesUI.kerning.state = inheritance.kerning ? NSOnState : NSOffState
    preferencesUI.lineHeight.state = inheritance.lineHeight
      ? NSOnState
      : NSOffState
    preferencesUI.paragraphSpacing.state = inheritance.paragraphSpacing
      ? NSOnState
      : NSOffState
    preferencesUI.textColor.state = inheritance.textColor
      ? NSOnState
      : NSOffState
    preferencesUI.fontSize.state = inheritance.fontSize ? NSOnState : NSOffState
    preferencesUI.textTransform.state = inheritance.textTransform
      ? NSOnState
      : NSOffState
    preferencesUI.fontFamily.state = inheritance.fontFamily
      ? NSOnState
      : NSOffState
    preferencesUI.fontWeight.state = inheritance.fontWeight
      ? NSOnState
      : NSOffState
    preferencesUI.fontStyle.state = inheritance.fontStyle
      ? NSOnState
      : NSOffState
    preferencesUI.fontVariant.state = inheritance.fontVariant
      ? NSOnState
      : NSOffState
    preferencesUI.fontStretch.state = inheritance.fontStretch
      ? NSOnState
      : NSOffState
    preferencesUI.textUnderline.state = inheritance.textUnderline
      ? NSOnState
      : NSOffState
    preferencesUI.textStrikethrough.state = inheritance.textStrikethrough
      ? NSOnState
      : NSOffState
  }

  const dialog = NSAlert.alloc().init()

  dialog.setMessageText('Style properties to pass down')
  dialog.setInformativeText(
    'Select the properties of the style that the children will inherit.'
  )
  dialog.addButtonWithTitle('Save')
  dialog.addButtonWithTitle('Cancel')
  dialog.setAccessoryView(preferencesUI.getRoot())
  dialog.icon = __command.pluginBundle().alertIcon()

  const responseCode = dialog.runModal()

  if (responseCode !== NSAlertFirstButtonReturn) {
    return
  }

  inheritance = {
    opacity: preferencesUI.opacity.state() === NSOnState,
    blendingMode: preferencesUI.blendingMode.state() === NSOnState,
    borderOptions: preferencesUI.borderOptions.state() === NSOnState,
    blur: preferencesUI.blur.state() === NSOnState,
    fills: preferencesUI.fills.state() === NSOnState,
    borders: preferencesUI.borders.state() === NSOnState,
    shadows: preferencesUI.shadows.state() === NSOnState,
    innerShadows: preferencesUI.innerShadows.state() === NSOnState,
  }

  if (isTextStyle) {
    Object.assign(inheritance, {
      alignment: preferencesUI.alignment.state() === NSOnState,
      verticalAlignment: preferencesUI.verticalAlignment.state() === NSOnState,
      kerning: preferencesUI.kerning.state() === NSOnState,
      lineHeight: preferencesUI.lineHeight.state() === NSOnState,
      paragraphSpacing: preferencesUI.paragraphSpacing.state() === NSOnState,
      textColor: preferencesUI.textColor.state() === NSOnState,
      fontSize: preferencesUI.fontSize.state() === NSOnState,
      textTransform: preferencesUI.textTransform.state() === NSOnState,
      fontFamily: preferencesUI.fontFamily.state() === NSOnState,
      fontWeight: preferencesUI.fontWeight.state() === NSOnState,
      fontStyle: preferencesUI.fontStyle.state() === NSOnState,
      fontVariant: preferencesUI.fontVariant.state() === NSOnState,
      fontStretch: preferencesUI.fontStretch.state() === NSOnState,
      textUnderline: preferencesUI.textUnderline.state() === NSOnState,
      textStrikethrough: preferencesUI.textStrikethrough.state() === NSOnState,
    })
  }

  sketch.Settings.setLayerSettingForKey(layer, 'inheritance', inheritance)

  // update the children
  updateChildren(layer.parent)

  updateLayout(document, getHierarchy(document, isTextStyle), isTextStyle)
}
