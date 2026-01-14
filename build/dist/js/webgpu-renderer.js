/**
 * WebGPU Renderer - High-performance GPU-accelerated fractal rendering
 * with orbit trap coloring support
 */

export class WebGPURenderer {
    constructor() {
        this.device = null;
        this.context = null;
        this.pipeline = null;
        this.bindGroup = null;
        this.uniformBuffer = null;
        this.outputTexture = null;
        this.readBuffer = null;
        this.isInitialized = false;
        this.isSupported = false;
    }

    async initialize(canvas) {
        // Check WebGPU support
        if (!navigator.gpu) {
            console.warn('WebGPU not supported, falling back to WASM');
            this.isSupported = false;
            return false;
        }

        try {
            const adapter = await navigator.gpu.requestAdapter({
                powerPreference: 'high-performance'
            });

            if (!adapter) {
                console.warn('No WebGPU adapter found');
                this.isSupported = false;
                return false;
            }

            this.device = await adapter.requestDevice({
                requiredLimits: {
                    maxStorageBufferBindingSize: 1024 * 1024 * 256, // 256MB
                    maxBufferSize: 1024 * 1024 * 256
                }
            });

            // Get canvas context
            this.context = canvas.getContext('webgpu');
            if (!this.context) {
                console.warn('Could not get WebGPU context');
                this.isSupported = false;
                return false;
            }

            const format = navigator.gpu.getPreferredCanvasFormat();
            this.context.configure({
                device: this.device,
                format: format,
                alphaMode: 'opaque'
            });

            // Create compute pipeline
            await this.createPipeline();

            this.isInitialized = true;
            this.isSupported = true;
            console.log('WebGPU initialized successfully');
            return true;

        } catch (error) {
            console.warn('WebGPU initialization failed:', error);
            this.isSupported = false;
            return false;
        }
    }

    async createPipeline() {
        const shaderCode = this.getShaderCode();

        const shaderModule = this.device.createShaderModule({
            code: shaderCode
        });

        this.pipeline = this.device.createComputePipeline({
            layout: 'auto',
            compute: {
                module: shaderModule,
                entryPoint: 'main'
            }
        });
    }

    getShaderCode() {
        return /* wgsl */`
            struct Uniforms {
                centerX: f32,
                centerY: f32,
                scale: f32,
                width: u32,
                height: u32,
                maxIter: u32,
                fractalType: u32,  // 0 = Mandelbrot, 1 = Julia
                juliaCReal: f32,
                juliaCImag: f32,
                paletteId: u32,
                // Orbit trap settings
                orbitTrapEnabled: u32,
                orbitTrapType: u32,  // 0=point, 1=cross, 2=circle, 3=line, 4=square
                orbitTrapX: f32,
                orbitTrapY: f32,
                orbitTrapSize: f32,
                orbitTrapRotation: f32,
                colorCycleOffset: f32,
                _padding: f32,
            }

            @group(0) @binding(0) var<uniform> uniforms: Uniforms;
            @group(0) @binding(1) var<storage, read_write> output: array<u32>;

            // Color palettes
            fn getClassicColor(t: f32) -> vec3<f32> {
                // Blue -> Cyan -> Yellow -> Orange
                let r = 0.5 + 0.5 * cos(6.28318 * (t + 0.0));
                let g = 0.5 + 0.5 * cos(6.28318 * (t + 0.33));
                let b = 0.5 + 0.5 * cos(6.28318 * (t + 0.67));
                return vec3<f32>(r, g, b);
            }

            fn getRainbowColor(t: f32) -> vec3<f32> {
                let hue = t * 6.0;
                let x = 1.0 - abs(hue % 2.0 - 1.0);
                var rgb: vec3<f32>;

                if (hue < 1.0) { rgb = vec3<f32>(1.0, x, 0.0); }
                else if (hue < 2.0) { rgb = vec3<f32>(x, 1.0, 0.0); }
                else if (hue < 3.0) { rgb = vec3<f32>(0.0, 1.0, x); }
                else if (hue < 4.0) { rgb = vec3<f32>(0.0, x, 1.0); }
                else if (hue < 5.0) { rgb = vec3<f32>(x, 0.0, 1.0); }
                else { rgb = vec3<f32>(1.0, 0.0, x); }

                return rgb;
            }

            fn getFireColor(t: f32) -> vec3<f32> {
                // Black -> Red -> Orange -> Yellow -> White
                let r = clamp(t * 3.0, 0.0, 1.0);
                let g = clamp(t * 3.0 - 1.0, 0.0, 1.0);
                let b = clamp(t * 3.0 - 2.0, 0.0, 1.0);
                return vec3<f32>(r, g, b);
            }

            fn getIceColor(t: f32) -> vec3<f32> {
                // Black -> Blue -> Cyan -> White
                let r = clamp(t * 2.0 - 1.0, 0.0, 1.0);
                let g = clamp(t * 2.0 - 0.5, 0.0, 1.0);
                let b = clamp(t * 1.5, 0.0, 1.0);
                return vec3<f32>(r, g, b);
            }

            fn getColor(t: f32, paletteId: u32) -> vec3<f32> {
                let cycled = fract(t + uniforms.colorCycleOffset);

                switch(paletteId) {
                    case 0u: { return getClassicColor(cycled); }
                    case 1u: { return getRainbowColor(cycled); }
                    case 2u: { return getFireColor(cycled); }
                    case 3u: { return getIceColor(cycled); }
                    default: { return vec3<f32>(cycled, cycled, cycled); }
                }
            }

            // Orbit trap distance functions
            fn pointTrapDistance(z: vec2<f32>, trap: vec2<f32>) -> f32 {
                return length(z - trap);
            }

            fn crossTrapDistance(z: vec2<f32>, trap: vec2<f32>, size: f32) -> f32 {
                let local = z - trap;
                let dh = abs(local.y);  // Distance to horizontal line
                let dv = abs(local.x);  // Distance to vertical line
                return min(dh, dv);
            }

            fn circleTrapDistance(z: vec2<f32>, trap: vec2<f32>, radius: f32) -> f32 {
                return abs(length(z - trap) - radius);
            }

            fn lineTrapDistance(z: vec2<f32>, trap: vec2<f32>, rotation: f32) -> f32 {
                // Rotate point relative to trap center
                let local = z - trap;
                let s = sin(rotation);
                let c = cos(rotation);
                let rotated = vec2<f32>(local.x * c - local.y * s, local.x * s + local.y * c);
                return abs(rotated.y);  // Distance to horizontal line after rotation
            }

            fn squareTrapDistance(z: vec2<f32>, trap: vec2<f32>, size: f32) -> f32 {
                let local = abs(z - trap);
                let d = max(local.x, local.y) - size;
                return abs(d);
            }

            fn getOrbitTrapDistance(z: vec2<f32>) -> f32 {
                let trap = vec2<f32>(uniforms.orbitTrapX, uniforms.orbitTrapY);
                let size = uniforms.orbitTrapSize;
                let rotation = uniforms.orbitTrapRotation;

                switch(uniforms.orbitTrapType) {
                    case 0u: { return pointTrapDistance(z, trap); }
                    case 1u: { return crossTrapDistance(z, trap, size); }
                    case 2u: { return circleTrapDistance(z, trap, size); }
                    case 3u: { return lineTrapDistance(z, trap, rotation); }
                    case 4u: { return squareTrapDistance(z, trap, size); }
                    default: { return pointTrapDistance(z, trap); }
                }
            }

            struct FractalResult {
                iterations: f32,
                trapped: bool,
                trapDistance: f32,
                trapIteration: f32,
                lastZ: vec2<f32>,
            }

            fn computeFractal(c: vec2<f32>, z0: vec2<f32>) -> FractalResult {
                var z = z0;
                var result: FractalResult;
                result.iterations = 0.0;
                result.trapped = false;
                result.trapDistance = 1e10;
                result.trapIteration = 0.0;
                result.lastZ = z;

                let bailout = 256.0;
                let bailout2 = bailout * bailout;
                let maxIter = uniforms.maxIter;

                // Main cardioid check for Mandelbrot
                if (uniforms.fractalType == 0u) {
                    let q = (c.x - 0.25) * (c.x - 0.25) + c.y * c.y;
                    if (q * (q + (c.x - 0.25)) < 0.25 * c.y * c.y) {
                        result.iterations = f32(maxIter);
                        return result;
                    }
                    // Period-2 bulb check
                    if ((c.x + 1.0) * (c.x + 1.0) + c.y * c.y < 0.0625) {
                        result.iterations = f32(maxIter);
                        return result;
                    }
                }

                for (var i = 0u; i < maxIter; i++) {
                    let z2 = z * z;
                    let mag2 = z2.x + z2.y;

                    if (mag2 > bailout2) {
                        // Smooth iteration count
                        let log_zn = log(mag2) / 2.0;
                        let nu = log(log_zn / log(2.0)) / log(2.0);
                        result.iterations = f32(i) + 1.0 - nu;
                        result.lastZ = z;
                        return result;
                    }

                    // Orbit trap check
                    if (uniforms.orbitTrapEnabled != 0u) {
                        let dist = getOrbitTrapDistance(z);
                        if (dist < result.trapDistance) {
                            result.trapDistance = dist;
                            result.trapIteration = f32(i);
                            result.trapped = true;
                        }
                    }

                    // z = z^2 + c
                    z = vec2<f32>(z2.x - z2.y + c.x, 2.0 * z.x * z.y + c.y);
                }

                result.iterations = f32(maxIter);
                result.lastZ = z;
                return result;
            }

            @compute @workgroup_size(16, 16)
            fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
                let x = global_id.x;
                let y = global_id.y;

                if (x >= uniforms.width || y >= uniforms.height) {
                    return;
                }

                // Convert pixel to complex coordinate
                let px = f32(x) - f32(uniforms.width) / 2.0;
                let py = f32(y) - f32(uniforms.height) / 2.0;
                let real = px * uniforms.scale + uniforms.centerX;
                let imag = py * uniforms.scale + uniforms.centerY;

                var c: vec2<f32>;
                var z0: vec2<f32>;

                if (uniforms.fractalType == 0u) {
                    // Mandelbrot: c = pixel, z0 = 0
                    c = vec2<f32>(real, imag);
                    z0 = vec2<f32>(0.0, 0.0);
                } else {
                    // Julia: c = constant, z0 = pixel
                    c = vec2<f32>(uniforms.juliaCReal, uniforms.juliaCImag);
                    z0 = vec2<f32>(real, imag);
                }

                let result = computeFractal(c, z0);

                var color: vec3<f32>;

                if (result.iterations >= f32(uniforms.maxIter)) {
                    // Interior - black
                    color = vec3<f32>(0.0, 0.0, 0.0);
                } else if (uniforms.orbitTrapEnabled != 0u && result.trapped) {
                    // Orbit trap coloring
                    let trapT = result.trapDistance * 2.0;
                    let iterT = result.trapIteration / f32(uniforms.maxIter);

                    // Blend trap distance and iteration for color
                    let t = mix(trapT, iterT, 0.3);
                    color = getColor(t, uniforms.paletteId);

                    // Add some glow based on trap distance
                    let glow = exp(-result.trapDistance * 10.0);
                    color = mix(color, vec3<f32>(1.0), glow * 0.3);
                } else {
                    // Standard escape-time coloring
                    let t = result.iterations / f32(uniforms.maxIter);
                    color = getColor(sqrt(t), uniforms.paletteId);
                }

                // Convert to RGBA u32
                let r = u32(clamp(color.x, 0.0, 1.0) * 255.0);
                let g = u32(clamp(color.y, 0.0, 1.0) * 255.0);
                let b = u32(clamp(color.z, 0.0, 1.0) * 255.0);
                let rgba = r | (g << 8u) | (b << 16u) | (255u << 24u);

                let idx = y * uniforms.width + x;
                output[idx] = rgba;
            }
        `;
    }

    async render(viewport, params, mode, juliaParams, orbitTrapParams = null) {
        if (!this.isInitialized) {
            throw new Error('WebGPU not initialized');
        }

        const width = viewport.width;
        const height = viewport.height;
        const pixelCount = width * height;

        // Create uniform buffer
        const uniformData = new ArrayBuffer(72);  // 18 floats/uints = 72 bytes
        const uniformView = new DataView(uniformData);

        uniformView.setFloat32(0, viewport.centerX, true);
        uniformView.setFloat32(4, viewport.centerY, true);
        uniformView.setFloat32(8, viewport.scale, true);
        uniformView.setUint32(12, width, true);
        uniformView.setUint32(16, height, true);
        uniformView.setUint32(20, params.maxIter || 1000, true);
        uniformView.setUint32(24, mode === 'julia' ? 1 : 0, true);
        uniformView.setFloat32(28, juliaParams?.cReal || -0.7, true);
        uniformView.setFloat32(32, juliaParams?.cImag || 0.27015, true);
        uniformView.setUint32(36, params.paletteID || 0, true);

        // Orbit trap settings
        const trapEnabled = orbitTrapParams?.enabled ? 1 : 0;
        uniformView.setUint32(40, trapEnabled, true);
        uniformView.setUint32(44, orbitTrapParams?.type || 0, true);
        uniformView.setFloat32(48, orbitTrapParams?.x || 0, true);
        uniformView.setFloat32(52, orbitTrapParams?.y || 0, true);
        uniformView.setFloat32(56, orbitTrapParams?.size || 0.5, true);
        uniformView.setFloat32(60, orbitTrapParams?.rotation || 0, true);
        uniformView.setFloat32(64, params.colorCycleOffset || 0, true);
        uniformView.setFloat32(68, 0, true);  // padding

        const uniformBuffer = this.device.createBuffer({
            size: uniformData.byteLength,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        this.device.queue.writeBuffer(uniformBuffer, 0, uniformData);

        // Create output buffer
        const outputBuffer = this.device.createBuffer({
            size: pixelCount * 4,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
        });

        // Create read buffer for CPU access
        const readBuffer = this.device.createBuffer({
            size: pixelCount * 4,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
        });

        // Create bind group
        const bindGroup = this.device.createBindGroup({
            layout: this.pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: uniformBuffer } },
                { binding: 1, resource: { buffer: outputBuffer } }
            ]
        });

        // Dispatch compute shader
        const commandEncoder = this.device.createCommandEncoder();
        const passEncoder = commandEncoder.beginComputePass();
        passEncoder.setPipeline(this.pipeline);
        passEncoder.setBindGroup(0, bindGroup);

        const workgroupsX = Math.ceil(width / 16);
        const workgroupsY = Math.ceil(height / 16);
        passEncoder.dispatchWorkgroups(workgroupsX, workgroupsY);
        passEncoder.end();

        // Copy output to read buffer
        commandEncoder.copyBufferToBuffer(outputBuffer, 0, readBuffer, 0, pixelCount * 4);

        this.device.queue.submit([commandEncoder.finish()]);

        // Read back results
        await readBuffer.mapAsync(GPUMapMode.READ);
        const resultData = new Uint8ClampedArray(readBuffer.getMappedRange().slice(0));
        readBuffer.unmap();

        // Clean up
        uniformBuffer.destroy();
        outputBuffer.destroy();
        readBuffer.destroy();

        return resultData;
    }

    destroy() {
        if (this.device) {
            this.device.destroy();
            this.device = null;
        }
        this.isInitialized = false;
    }
}

// Orbit trap type constants
export const OrbitTrapType = {
    POINT: 0,
    CROSS: 1,
    CIRCLE: 2,
    LINE: 3,
    SQUARE: 4
};
