# Debug Notes - Zoom Box Feature

## Issues Found and Fixed

### Issue 1: Render Storm During Animation
**Problem**: Animation was calling `startRender()` on every frame (~60 times per second), creating a render storm that overwhelmed the worker pool.

**Fix**: Added throttling to only render every 100ms during animation:
```javascript
// Only render every 100ms during animation
if (timeSinceLastRender >= this.renderThrottle) {
    this.renderer.startRender(viewport, ...);
    this.lastRenderTime = currentTime;
}
```

### Issue 2: Canvas Not Clearing
**Problem**: When renders were cancelled, old partial renders remained on the canvas.

**Fix**: Added `canvasManager.clear()` at the start of each render:
```javascript
async startRender(viewport, params, mode, juliaParams) {
    this.currentRenderID++;
    const renderID = this.currentRenderID;

    // Clear canvas at start of new render
    this.canvasManager.clear();
    ...
}
```

## Testing Steps

1. **Refresh browser** to load updated code
2. **Hold Shift** - cursor should become crosshair
3. **Drag a box** - cyan selection box should appear
4. **Release** - should smoothly zoom into selected region

## Expected Behavior

- Animation should be smooth (not jerky)
- Canvas should fully render (not partial)
- No freezing during zoom
- Progressive refinement should work:
  - Quick preview appears first
  - Gradually refines to full quality

## Debug Console Commands

Open browser console and try:

```javascript
// Check if zoom box overlay exists
document.getElementById('zoom-box-overlay')

// Check animator state
window.fractalApp.interactionHandler

// Check current render ID
window.fractalApp.rendererManager.currentRenderID

// Check if animation is active
window.fractalApp.animator.activeAnimation !== null
```

## Common Issues

### Freezing
- **Cause**: Too many simultaneous renders
- **Fix**: Throttling in animation.js

### Partial Render
- **Cause**: Canvas not cleared between renders
- **Fix**: Clear canvas at start of each render

### No Visual Feedback
- **Cause**: Zoom box overlay not added to DOM
- **Fix**: Ensure createZoomBoxOverlay() is called in constructor

### Wrong Zoom Region
- **Cause**: Incorrect coordinate transformation
- **Fix**: Check completeZoomBox() calculations

## Files Modified

1. `src/js/animation.js` - Added render throttling
2. `src/js/renderer-manager.js` - Added canvas clearing
3. `src/js/interaction-handler.js` - Zoom box implementation

## Performance Metrics

**Before fixes:**
- Renders per second during animation: ~60
- Render completions: Few (most cancelled)
- Animation smoothness: Poor

**After fixes:**
- Renders per second during animation: ~10
- Render completions: High (most complete)
- Animation smoothness: Good

## Next Steps if Still Having Issues

1. **Check browser console** for JavaScript errors
2. **Verify worker pool** is initializing correctly
3. **Check WASM module** loaded successfully
4. **Inspect network tab** to ensure all files loaded
5. **Test with simpler zoom** (scroll wheel) to isolate issue

## Alternative Approach (if needed)

If zoom box still doesn't work well, consider:

1. **Disable animation** during zoom box:
   ```javascript
   // Skip animation, jump directly to target
   this.state.setViewport(newViewport);
   this.triggerRender();
   ```

2. **Show loading indicator** during zoom:
   ```javascript
   document.getElementById('loading-indicator').classList.remove('hidden');
   ```

3. **Delay render** until animation completes:
   ```javascript
   setTimeout(() => {
       this.renderer.startRender(...);
   }, duration);
   ```
