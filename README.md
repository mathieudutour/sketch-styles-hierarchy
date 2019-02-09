# Shared Styles Hierarchy

_Organize your shared styles using the layers list, create a hierarchy where children inherit properties from their parent._

## Installation

_Requires Sketch >= 53_

- [Download](https://github.com/mathieudutour/sketch-styles-hierarchy/releases/latest) the latest release of the plugin
- Un-zip
- Double-click on sketch-styles-hierarchy.sketchplugin

## Usage

- You run the `setup` command which creates 2 new pages: `Text Styles` and `Layer Styles`.
- Then you use the layer list and the inspector to manage the shared styles.

Let's say you have 4 text styles: `Button/Primary`, `Button/Secondary`, `Header/H1` and `Header/H2`.
You should have 2 groups: `Button` and `Header` with 3 text layers in each: `Primary` (or `H1`), `Secondary` (or `H2`) and `__default`.

You now have multiple possible actions (each triggered after changing the selection):

- rename a group to rename all the children (eg. renaming the `Header` group to `Heading` will change `Header/H1` to `Heading/H1` and `Header/H2` to `Heading/H2`)
- rename a layer to rename the shared style
- create a new Group (eg. creating a new Group called `Inverted` from `Button/Secondary` will rename `Button/Secondary` to `Button/Inverted/Secondary` and create a new `__default` layer)
- drag and drop layers in the hierarchy to rename them
- delete groups or layers to delete the Shared Styles
- create new layers to create new shared styles

Now you might wonder what the `__default` layers are for, and that's where the magic comes in :sparkles:

- select a `__default` layer and press `cmd + shift + ,` to be able to select which style properties its children should inherit (the `__default` is linked to a group, so the children are the children of the parent group of the `__default` layer)
- then, every time you change the `__default` style, the children will change as well
