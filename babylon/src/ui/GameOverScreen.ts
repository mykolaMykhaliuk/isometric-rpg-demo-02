import {
  Rectangle,
  TextBlock,
  Button,
  StackPanel,
  Control,
  AdvancedDynamicTexture,
} from '@babylonjs/gui';
import { EventBus, GameEvents } from '../core/EventBus';

/**
 * Game over overlay screen
 */
export class GameOverScreen {
  private advancedTexture: AdvancedDynamicTexture;
  private container: Rectangle;
  private scoreText: TextBlock;
  private eventBus: EventBus;

  public onRestart?: () => void;

  constructor(advancedTexture: AdvancedDynamicTexture) {
    this.advancedTexture = advancedTexture;
    this.eventBus = EventBus.getInstance();
    this.container = this.create();
    this.scoreText = this.container.getChildByName('finalScore') as TextBlock;
    this.hide();

    // Listen for game over event
    this.eventBus.on(GameEvents.PLAYER_DIED, () => {
      this.show(0); // Score will be updated separately
    });
  }

  private create(): Rectangle {
    // Semi-transparent overlay
    const container = new Rectangle('gameOverContainer');
    container.width = 1;
    container.height = 1;
    container.background = 'rgba(0, 0, 0, 0.8)';
    container.zIndex = 100;
    this.advancedTexture.addControl(container);

    // Inner panel
    const panel = new StackPanel('gameOverPanel');
    panel.isVertical = true;
    panel.width = '400px';
    container.addControl(panel);

    // Game Over title
    const title = new TextBlock('gameOverTitle', 'GAME OVER');
    title.color = '#ff4444';
    title.fontSize = 64;
    title.fontFamily = 'Arial Black';
    title.fontWeight = 'bold';
    title.height = '100px';
    title.outlineWidth = 3;
    title.outlineColor = 'black';
    panel.addControl(title);

    // Skull icon (text-based)
    const skull = new TextBlock('skull', '💀');
    skull.fontSize = 80;
    skull.height = '100px';
    panel.addControl(skull);

    // Score display
    const scoreText = new TextBlock('finalScore', 'Final Score: 0');
    scoreText.name = 'finalScore';
    scoreText.color = 'white';
    scoreText.fontSize = 32;
    scoreText.fontFamily = 'Arial';
    scoreText.height = '60px';
    panel.addControl(scoreText);

    // Spacer
    const spacer = new Rectangle('spacer');
    spacer.height = '40px';
    spacer.background = 'transparent';
    spacer.color = 'transparent';
    panel.addControl(spacer);

    // Restart button
    const restartBtn = Button.CreateSimpleButton('restartBtn', 'PLAY AGAIN');
    restartBtn.width = '200px';
    restartBtn.height = '50px';
    restartBtn.color = 'white';
    restartBtn.fontSize = 20;
    restartBtn.fontFamily = 'Arial';
    restartBtn.fontWeight = 'bold';
    restartBtn.background = '#44aa44';
    restartBtn.cornerRadius = 10;
    restartBtn.thickness = 2;
    restartBtn.onPointerEnterObservable.add(() => {
      restartBtn.background = '#66cc66';
    });
    restartBtn.onPointerOutObservable.add(() => {
      restartBtn.background = '#44aa44';
    });
    restartBtn.onPointerClickObservable.add(() => {
      this.hide();
      this.eventBus.emit(GameEvents.GAME_RESTART);
      if (this.onRestart) {
        this.onRestart();
      }
    });
    panel.addControl(restartBtn);

    // Tips text
    const tips = new TextBlock('tips', 'Tip: Collect ammo pickups and use sword when out of bullets!');
    tips.color = 'rgba(255, 255, 255, 0.6)';
    tips.fontSize = 14;
    tips.fontFamily = 'Arial';
    tips.height = '50px';
    tips.paddingTop = '20px';
    panel.addControl(tips);

    return container;
  }

  show(finalScore: number): void {
    this.container.isVisible = true;
    this.scoreText.text = `Final Score: ${finalScore}`;

    // Animate in
    this.container.alpha = 0;
    let alpha = 0;
    const fadeIn = setInterval(() => {
      alpha += 0.1;
      this.container.alpha = alpha;
      if (alpha >= 1) {
        clearInterval(fadeIn);
      }
    }, 30);
  }

  hide(): void {
    this.container.isVisible = false;
  }

  setScore(score: number): void {
    this.scoreText.text = `Final Score: ${score}`;
  }

  dispose(): void {
    this.container.dispose();
  }
}
