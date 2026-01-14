/**
 * Preset Gallery - Interesting fractal locations
 */

const PRESETS = [
    {
        name: "Seahorse Valley",
        centerX: -0.743643887037151,
        centerY: 0.131825904205330,
        scale: 0.00004,
        maxIter: 2000
    },
    {
        name: "Elephant Valley",
        centerX: 0.2549870375,
        centerY: 0.0005007625,
        scale: 0.00001,
        maxIter: 1500
    },
    {
        name: "Double Spiral",
        centerX: -0.7453,
        centerY: 0.1127,
        scale: 0.00002,
        maxIter: 1800
    },
    {
        name: "Satellite",
        centerX: -0.7746,
        centerY: 0.1102,
        scale: 0.00005,
        maxIter: 2000
    },
    {
        name: "Spiral",
        centerX: -0.7269,
        centerY: 0.1889,
        scale: 0.00002,
        maxIter: 1500
    },
    {
        name: "Mini Mandelbrot",
        centerX: -0.74364085,
        centerY: 0.13188204,
        scale: 0.00001,
        maxIter: 2500
    }
];

export class PresetGallery {
    constructor(stateManager, animator) {
        this.state = stateManager;
        this.animator = animator;

        this.galleryElement = document.getElementById('preset-gallery');
        this.gridElement = document.getElementById('gallery-grid');

        this.setupGallery();
        this.setupControls();
    }

    setupGallery() {
        PRESETS.forEach((preset, index) => {
            const card = document.createElement('div');
            card.className = 'preset-card';

            // Create placeholder thumbnail
            const thumbnail = document.createElement('div');
            thumbnail.className = 'preset-thumbnail';
            thumbnail.style.width = '100%';
            thumbnail.style.height = '150px';
            thumbnail.style.background = 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)';
            thumbnail.style.display = 'flex';
            thumbnail.style.alignItems = 'center';
            thumbnail.style.justifyContent = 'center';
            thumbnail.style.color = '#00d4ff';
            thumbnail.textContent = '🌀';
            thumbnail.style.fontSize = '48px';

            const name = document.createElement('div');
            name.className = 'preset-name';
            name.textContent = preset.name;

            card.appendChild(thumbnail);
            card.appendChild(name);

            card.addEventListener('click', () => this.loadPreset(preset));

            this.gridElement.appendChild(card);
        });
    }

    setupControls() {
        const btnOpen = document.getElementById('btn-open-gallery');
        const btnClose = document.getElementById('btn-close-gallery');

        btnOpen?.addEventListener('click', () => {
            this.galleryElement.classList.remove('hidden');
        });

        btnClose?.addEventListener('click', () => {
            this.galleryElement.classList.add('hidden');
        });

        // Close on background click
        this.galleryElement.addEventListener('click', (e) => {
            if (e.target === this.galleryElement) {
                this.galleryElement.classList.add('hidden');
            }
        });
    }

    loadPreset(preset) {
        // Close gallery
        this.galleryElement.classList.add('hidden');

        // Switch to Mandelbrot mode
        this.state.setMode('mandelbrot');

        // Animate to preset location
        const currentViewport = this.state.getViewport();
        const newViewport = {
            ...currentViewport,
            centerX: preset.centerX,
            centerY: preset.centerY,
            scale: preset.scale
        };

        // Update max iterations
        this.state.setMaxIterations(preset.maxIter);
        document.getElementById('max-iterations').value = preset.maxIter;
        document.getElementById('iterations-value').textContent = preset.maxIter;

        // Animate
        this.animator.animateViewport(currentViewport, newViewport, 1000);
    }

    getPresets() {
        return PRESETS;
    }
}
