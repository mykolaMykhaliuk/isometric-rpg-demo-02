import Phaser from 'phaser';
import { Player } from './Player';

export class Wizard extends Phaser.Physics.Arcade.Sprite {
  private player: Player | null = null;
  private hasGreeted: boolean = false;
  private greetingText: Phaser.GameObjects.Text | null = null;
  private interactionHint: Phaser.GameObjects.Text | null = null;
  private greetingDistance: number = 80;
  private interactionDistance: number = 60;
  private eKey: Phaser.Input.Keyboard.Key | null = null;
  private isPlayerNear: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'wizard');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setScale(1.5);
    this.setImmovable(true);

    if (this.body) {
      (this.body as Phaser.Physics.Arcade.Body).setSize(28, 32);
      (this.body as Phaser.Physics.Arcade.Body).setOffset(2, 0);
    }

    // Setup E key
    if (scene.input.keyboard) {
      this.eKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    }

    // Create interaction hint
    this.interactionHint = scene.add.text(
      this.x,
      this.y - 60,
      'Press E to talk',
      {
        fontSize: '14px',
        color: '#ffffff',
        backgroundColor: '#000000AA',
        padding: { x: 8, y: 4 },
        align: 'center',
        fontStyle: 'bold',
      }
    );
    this.interactionHint.setOrigin(0.5);
    this.interactionHint.setDepth(10000);
    this.interactionHint.setVisible(false);
  }

  setPlayer(player: Player): void {
    this.player = player;
  }

  update(_time: number, _delta: number): void {
    if (!this.player || !this.active) return;

    const distanceToPlayer = Phaser.Math.Distance.Between(
      this.x,
      this.y,
      this.player.x,
      this.player.y
    );

    // Check if player is within interaction distance
    const wasPlayerNear = this.isPlayerNear;
    this.isPlayerNear = distanceToPlayer < this.interactionDistance;

    // Show/hide interaction hint
    if (this.isPlayerNear && !wasPlayerNear) {
      this.showInteractionHint();
    } else if (!this.isPlayerNear && wasPlayerNear) {
      this.hideInteractionHint();
    }

    // Update hint position
    if (this.interactionHint && this.isPlayerNear) {
      this.interactionHint.setPosition(this.x, this.y - 60);
    }

    // Show greeting when player first approaches
    if (distanceToPlayer < this.greetingDistance && !this.hasGreeted) {
      this.greet();
    } else if (distanceToPlayer >= this.greetingDistance && this.hasGreeted) {
      this.hideGreeting();
    }

    // Check for E key press to open conversation
    if (this.isPlayerNear && this.eKey && Phaser.Input.Keyboard.JustDown(this.eKey)) {
      this.openConversation();
    }

    this.updateDepth();
  }

  private greet(): void {
    this.hasGreeted = true;

    // Create greeting text above the wizard
    this.greetingText = this.scene.add.text(
      this.x,
      this.y - 50,
      'Welcome to Mykola\'s portfolio!',
      {
        fontSize: '16px',
        color: '#FFD700',
        backgroundColor: '#000000AA',
        padding: { x: 8, y: 4 },
        align: 'center',
        fontStyle: 'bold',
      }
    );
    this.greetingText.setOrigin(0.5);
    this.greetingText.setDepth(10000); // Always on top

    // Fade out after 3 seconds
    this.scene.time.delayedCall(3000, () => {
      if (this.greetingText && this.greetingText.active) {
        this.scene.tweens.add({
          targets: this.greetingText,
          alpha: 0,
          duration: 500,
          onComplete: () => {
            this.greetingText?.destroy();
            this.greetingText = null;
          },
        });
      }
    });
  }

  private hideGreeting(): void {
    if (this.greetingText && this.greetingText.active) {
      this.greetingText.destroy();
      this.greetingText = null;
    }
    this.hasGreeted = false;
  }

  private showInteractionHint(): void {
    if (this.interactionHint) {
      this.interactionHint.setVisible(true);

      // Add pulsing animation
      this.scene.tweens.add({
        targets: this.interactionHint,
        scale: { from: 1, to: 1.1 },
        duration: 600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  private hideInteractionHint(): void {
    if (this.interactionHint) {
      this.interactionHint.setVisible(false);
      this.scene.tweens.killTweensOf(this.interactionHint);
      this.interactionHint.setScale(1);
    }
  }

  private openConversation(): void {
    // Get the conversation scene and emit open event
    const conversationScene = this.scene.scene.get('ConversationScene');
    if (conversationScene) {
      conversationScene.events.emit('openConversation');

      // Hide interaction hint while conversation is open
      this.hideInteractionHint();
    }
  }

  private updateDepth(): void {
    this.setDepth(this.y);
  }

  destroy(fromScene?: boolean): void {
    if (this.greetingText) {
      this.greetingText.destroy();
    }
    if (this.interactionHint) {
      this.interactionHint.destroy();
    }
    super.destroy(fromScene);
  }
}
