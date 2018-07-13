# svg2bsv
Converts SVG files to BSV.

## Installation
`npm install svg2bsv -g`  

## Usage
`svg2bsv --in face.svg --out book.bsv`

## Supported SVG featuers

### Common
- [ ] Mask, Clipping Mask
- [ ] Refs
- [x] Style attributes

### Shapes
- [x] Rect
- [x] Circle
- [ ] Elipse
- [ ] Line
- [ ] Polyline
- [ ] Path
- [ ] Polygon

### Styles
- [x] Fill color
- [ ] Fill pattern
- [ ] Fill gradient
- [x] Fill opacity
- [x] Stroke color
- [ ] Stroke pattern
- [ ] Stroke gradient
- [x] Stroke opacity
- [x] Stroke width
- [ ] Line Dash 
- [ ] Fill Rule
- [x] Cap Style
- [x] Joint Style
- [x] Miter Limit
- [x] Opacity
- [ ] Display

### Other 
- [ ] Markers

### Units
- [x] px, pt, pc, mm, cm, in

### Next Release
- CSS styles and Inlined styles

## Not supported SVG features
- CSS styles and Inlined styles (only attributes is supported)
- Text - must be converted to outlines
- Animations
- Visibility
- Filters
- color-interpolation, color-interpolation-filters
- color-rendering
- shape-rendering
- text-rendering
- image-rendering
- viewBox
- Scripts
- External resources
- Interactivity
- Linking