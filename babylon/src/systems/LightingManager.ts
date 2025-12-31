import {
  Scene,
  HemisphericLight,
  DirectionalLight,
  ShadowGenerator,
  Vector3,
  Color3,
  Mesh,
  GlowLayer,
  DefaultRenderingPipeline,
} from '@babylonjs/core';

/**
 * Manages scene lighting, shadows, and post-processing effects
 */
export class LightingManager {
  private scene: Scene;
  private ambientLight: HemisphericLight;
  private sunLight: DirectionalLight;
  private shadowGenerator: ShadowGenerator;
  private glowLayer: GlowLayer;
  private pipeline: DefaultRenderingPipeline | null = null;

  constructor(scene: Scene) {
    this.scene = scene;

    // Create lights
    this.ambientLight = this.createAmbientLight();
    this.sunLight = this.createSunLight();

    // Create shadow generator
    this.shadowGenerator = this.createShadowGenerator();

    // Create glow layer for emissive effects
    this.glowLayer = this.createGlowLayer();

    // Create post-processing pipeline
    this.createPostProcessing();
  }

  private createAmbientLight(): HemisphericLight {
    const light = new HemisphericLight(
      'ambientLight',
      new Vector3(0, 1, 0),
      this.scene
    );

    light.intensity = 0.6;
    light.diffuse = new Color3(1, 0.98, 0.95);
    light.specular = new Color3(0.5, 0.5, 0.5);
    light.groundColor = new Color3(0.2, 0.22, 0.25);

    return light;
  }

  private createSunLight(): DirectionalLight {
    const light = new DirectionalLight(
      'sunLight',
      new Vector3(-1, -2, -1).normalize(),
      this.scene
    );

    light.intensity = 0.8;
    light.diffuse = new Color3(1, 0.95, 0.9);
    light.specular = new Color3(1, 0.95, 0.85);

    // Position for shadow calculation
    light.position = new Vector3(30, 50, 30);

    return light;
  }

  private createShadowGenerator(): ShadowGenerator {
    const shadowGen = new ShadowGenerator(2048, this.sunLight);

    // High quality shadows
    shadowGen.useBlurExponentialShadowMap = true;
    shadowGen.blurKernel = 32;
    shadowGen.blurScale = 2;
    shadowGen.depthScale = 50;

    // Soft shadows
    shadowGen.useKernelBlur = true;
    shadowGen.filteringQuality = ShadowGenerator.QUALITY_HIGH;

    // Shadow bias to reduce artifacts
    shadowGen.bias = 0.001;
    shadowGen.normalBias = 0.02;

    return shadowGen;
  }

  private createGlowLayer(): GlowLayer {
    const glow = new GlowLayer('glowLayer', this.scene, {
      mainTextureFixedSize: 512,
      blurKernelSize: 64,
    });

    glow.intensity = 0.8;

    return glow;
  }

  private createPostProcessing(): void {
    // Check if we can use the default pipeline
    if (!this.scene.getEngine().getCaps().standardDerivatives) {
      console.warn('Post-processing not supported');
      return;
    }

    this.pipeline = new DefaultRenderingPipeline(
      'defaultPipeline',
      true,
      this.scene,
      [this.scene.activeCamera!]
    );

    // Bloom effect
    this.pipeline.bloomEnabled = true;
    this.pipeline.bloomThreshold = 0.8;
    this.pipeline.bloomWeight = 0.3;
    this.pipeline.bloomKernel = 64;
    this.pipeline.bloomScale = 0.5;

    // FXAA anti-aliasing
    this.pipeline.fxaaEnabled = true;

    // Sharpen
    this.pipeline.sharpenEnabled = true;
    this.pipeline.sharpen.edgeAmount = 0.3;

    // Vignette
    this.pipeline.imageProcessingEnabled = true;
    this.pipeline.imageProcessing.vignetteEnabled = true;
    this.pipeline.imageProcessing.vignetteWeight = 1.5;
    this.pipeline.imageProcessing.vignetteCameraFov = 0.5;

    // Color grading
    this.pipeline.imageProcessing.toneMappingEnabled = true;
    this.pipeline.imageProcessing.contrast = 1.1;
    this.pipeline.imageProcessing.exposure = 1.0;
  }

  /**
   * Add mesh to shadow casters
   */
  addShadowCaster(mesh: Mesh): void {
    this.shadowGenerator.addShadowCaster(mesh);
  }

  /**
   * Enable shadow receiving for mesh
   */
  enableShadowReceiver(mesh: Mesh): void {
    mesh.receiveShadows = true;
  }

  /**
   * Add mesh to glow layer
   */
  addToGlow(mesh: Mesh, intensity: number = 1): void {
    this.glowLayer.addIncludedOnlyMesh(mesh);
    this.glowLayer.customEmissiveColorSelector = (
      _mesh,
      _subMesh,
      _material,
      result
    ) => {
      result.set(intensity, intensity, intensity, 1);
    };
  }

  /**
   * Set time of day (affects lighting)
   */
  setTimeOfDay(hour: number): void {
    // Normalize to 0-24
    hour = hour % 24;

    if (hour >= 6 && hour < 18) {
      // Daytime
      const dayProgress = (hour - 6) / 12;
      const sunIntensity = Math.sin(dayProgress * Math.PI) * 0.5 + 0.5;

      this.sunLight.intensity = 0.5 + sunIntensity * 0.5;
      this.sunLight.diffuse = new Color3(1, 0.95 + sunIntensity * 0.05, 0.85 + sunIntensity * 0.1);
      this.ambientLight.intensity = 0.5 + sunIntensity * 0.2;
    } else {
      // Nighttime
      this.sunLight.intensity = 0.15;
      this.sunLight.diffuse = new Color3(0.4, 0.45, 0.6);
      this.ambientLight.intensity = 0.25;
      this.ambientLight.diffuse = new Color3(0.3, 0.35, 0.5);
    }
  }

  /**
   * Flash effect for damage/pickup
   */
  flashScreen(color: Color3, duration: number = 100): void {
    if (!this.pipeline) return;

    const originalExposure = this.pipeline.imageProcessing.exposure;
    this.pipeline.imageProcessing.exposure = 1.5;

    setTimeout(() => {
      if (this.pipeline) {
        this.pipeline.imageProcessing.exposure = originalExposure;
      }
    }, duration);
  }

  getSunLight(): DirectionalLight {
    return this.sunLight;
  }

  getAmbientLight(): HemisphericLight {
    return this.ambientLight;
  }

  getShadowGenerator(): ShadowGenerator {
    return this.shadowGenerator;
  }

  dispose(): void {
    this.ambientLight.dispose();
    this.sunLight.dispose();
    this.shadowGenerator.dispose();
    this.glowLayer.dispose();
    if (this.pipeline) {
      this.pipeline.dispose();
    }
  }
}
