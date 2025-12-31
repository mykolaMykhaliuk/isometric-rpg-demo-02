import { Engine } from '@babylonjs/core';
import { Game } from './core/Game';

/**
 * Main entry point for the Babylon.js 3D RPG game
 */
async function main(): Promise<void> {
  // Get canvas element
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;

  if (!canvas) {
    console.error('Could not find game canvas element');
    return;
  }

  // Create Babylon engine
  const engine = new Engine(canvas, true, {
    preserveDrawingBuffer: true,
    stencil: true,
    antialias: true,
  });

  // Handle window resize
  window.addEventListener('resize', () => {
    engine.resize();
  });

  // Create and initialize game
  const game = new Game(engine);

  try {
    await game.initialize();

    // Main render loop
    engine.runRenderLoop(() => {
      game.update();
      game.getScene().render();
    });
  } catch (error) {
    console.error('Failed to initialize game:', error);

    // Show error on loading screen
    const loadingText = document.getElementById('loading-text');
    if (loadingText) {
      loadingText.textContent = 'Failed to load game. Please refresh.';
      loadingText.style.color = '#ff4444';
    }
  }
}

// Start the game when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
