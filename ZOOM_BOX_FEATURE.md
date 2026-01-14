# Zoom Box Feature

## Overview

The zoom box feature allows users to select a rectangular region to zoom into by holding Shift and dragging the mouse. This provides precise control over the zoom target area.

## How to Use

### Mouse Controls

1. **Hold Shift key** - The cursor changes to a crosshair
2. **Click and drag** - A semi-transparent cyan box appears showing the selection
3. **Release mouse** - The view smoothly animates to zoom into the selected region

### Visual Feedback

- **Cursor**: Changes to crosshair when Shift is held
- **Zoom Box**: Dashed cyan border with semi-transparent fill
- **Glow Effect**: Subtle cyan shadow around the box
- **Minimum Size**: 20x20 pixels to prevent accidental tiny zooms

## Implementation Details

### User Interface

The zoom box is rendered as an absolutely positioned overlay div with:
- 2px dashed cyan border (#00d4ff)
- Semi-transparent cyan background (10% opacity)
- Cyan glow shadow effect
- No pointer events (doesn't interfere with mouse interactions)

### Coordinate Calculation

1. **Box Bounds**: Calculated from start and end mouse positions
2. **Complex Coordinates**: Box corners converted to complex plane coordinates
3. **New Center**: Midpoint of box in complex space
4. **New Scale**: Calculated to fit entire box in viewport
   - Uses larger of width/height ratio to ensure full box visibility
   - Maintains aspect ratio of the viewport

### Animation

- **Duration**: 600ms smooth animation
- **Easing**: Uses cubic ease-out for natural feel
- **Progressive Rendering**: Shows preview during animation

## Code Structure

### Files Modified

- **src/js/interaction-handler.js**: Main implementation
  - `createZoomBoxOverlay()` - Creates the visual overlay
  - `updateZoomBox()` - Updates box size during drag
  - `completeZoomBox()` - Calculates and applies zoom
  - `hideZoomBox()` - Hides overlay after completion

- **src/html/index.html**: Updated help text

### Key Methods

```javascript
// Initialize zoom box overlay
createZoomBoxOverlay()

// Update box during drag
updateZoomBox(endX, endY)

// Complete zoom operation
completeZoomBox(endX, endY)

// Hide the overlay
hideZoomBox()
```

### Zoom Calculation Algorithm

```javascript
// 1. Get box bounds
const left = Math.min(startX, endX);
const right = Math.max(startX, endX);
const top = Math.min(startY, endY);
const bottom = Math.max(startY, endY);

// 2. Convert corners to complex coordinates
const topLeftComplex = screenToComplex(left, top);
const bottomRightComplex = screenToComplex(right, bottom);

// 3. Calculate new center
const newCenter = midpoint(topLeftComplex, bottomRightComplex);

// 4. Calculate new scale
const complexWidth = abs(bottomRightComplex.real - topLeftComplex.real);
const complexHeight = abs(bottomRightComplex.imag - topLeftComplex.imag);
const newScale = max(complexWidth / viewportWidth, complexHeight / viewportHeight);

// 5. Animate to new viewport
animate(currentViewport, newViewport, duration);
```

## Features

### Smart Behavior

- **Minimum Size Check**: Boxes smaller than 20x20 pixels are ignored
- **Direction Independent**: Works regardless of drag direction (up/down/left/right)
- **Shift Detection**: Only activates when Shift is held
- **Fallback**: Small drags are ignored to prevent accidental zooms

### Visual Polish

- **Smooth Animations**: 600ms animated zoom transitions
- **Cursor Feedback**: Crosshair indicates zoom box mode
- **Visual Overlay**: Clear indication of selected region
- **Progressive Rendering**: Low-iteration preview during zoom

### Integration

- **Non-Intrusive**: Doesn't interfere with existing pan/zoom controls
- **Mode Aware**: Works in both Mandelbrot and Julia set modes
- **Touch Compatible**: Primary designed for mouse, but doesn't break touch
- **Keyboard Modifier**: Uses standard Shift key convention

## Testing

To test the zoom box feature:

1. Open http://localhost:8000
2. Hold Shift key (cursor becomes crosshair)
3. Click and drag a rectangle on the fractal
4. Release mouse to zoom into the selected region
5. Repeat to zoom deeper into specific areas

## Benefits

### Precision

- Select exact region of interest
- Better than scroll zoom for specific targets
- No need for multiple zoom/pan operations

### Exploration

- Quickly investigate interesting features
- Easy to compare different regions
- Navigate complex structures efficiently

### User Experience

- Intuitive interaction (familiar from image editors)
- Visual feedback throughout operation
- Smooth, polished animations

## Future Enhancements

Potential improvements:

1. **Aspect Ratio Lock**: Option to maintain specific aspect ratio
2. **Zoom Out Box**: Hold Alt to zoom out from selection
3. **Touch Support**: Two-finger pinch-to-select on mobile
4. **Grid Overlay**: Show coordinate grid during selection
5. **Preset Aspect Ratios**: Quick buttons for 16:9, 4:3, etc.

## Performance

- **Lightweight**: Simple div overlay with CSS
- **No Canvas Redraw**: Uses DOM element for visual feedback
- **Efficient**: Minimal calculations during drag
- **Animated**: Smooth 60 FPS zoom transition

---

**Implementation Status**: ✅ Complete and functional
**Last Updated**: 2026-01-14
