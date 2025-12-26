import Phaser from 'phaser';

export class ConversationScene extends Phaser.Scene {
  private dialogueBox!: Phaser.GameObjects.Container;
  private chatHistory!: Phaser.GameObjects.Text;
  private inputField!: Phaser.GameObjects.DOMElement;
  private conversationMessages: string[] = [];
  private isActive: boolean = false;

  constructor() {
    super({ key: 'ConversationScene' });
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Create dialogue container
    this.dialogueBox = this.add.container(width / 2, height - 200);
    this.dialogueBox.setDepth(10000);
    this.dialogueBox.setVisible(false);

    // Background panel
    const background = this.add.rectangle(0, 0, 700, 370, 0x000000, 0.9);
    background.setStrokeStyle(3, 0x8b6914);
    this.dialogueBox.add(background);

    // Title
    const title = this.add.text(0, -160, 'Wizard Conversation', {
      fontSize: '22px',
      color: '#FFD700',
      fontStyle: 'bold',
      align: 'center',
    });
    title.setOrigin(0.5);
    this.dialogueBox.add(title);

    // Chat history area background
    const historyBg = this.add.rectangle(0, -50, 660, 200, 0x1a1a1a, 1);
    historyBg.setStrokeStyle(2, 0x5533aa);
    this.dialogueBox.add(historyBg);

    // Chat history text
    this.chatHistory = this.add.text(-320, -145, '', {
      fontSize: '14px',
      color: '#ffffff',
      wordWrap: { width: 640 },
      lineSpacing: 8,
    });
    this.dialogueBox.add(this.chatHistory);

    // Input label
    const inputLabel = this.add.text(-320, 80, 'Ask the wizard:', {
      fontSize: '16px',
      color: '#FFD700',
    });
    this.dialogueBox.add(inputLabel);

    // HTML Input field (created via DOM)
    const inputHTML = `
      <input type="text" id="wizardInput"
        style="width: 500px;
               height: 30px;
               font-size: 16px;
               padding: 5px;
               background: #2a2a2a;
               color: #ffffff;
               border: 2px solid #5533aa;
               border-radius: 4px;
               outline: none;"
        placeholder="Type your question..."
        maxlength="200" />
    `;

    this.inputField = this.add.dom(width / 2 - 100, height - 90).createFromHTML(inputHTML);
    this.inputField.setDepth(10001);
    this.inputField.setVisible(false);

    // Instructions
    const instructions = this.add.text(0, 135, 'Press ENTER to send | ESC to close', {
      fontSize: '12px',
      color: '#aaaaaa',
      align: 'center',
    });
    instructions.setOrigin(0.5);
    this.dialogueBox.add(instructions);

    // Setup keyboard controls
    this.setupControls();

    // Listen for open/close events
    this.events.on('openConversation', this.openConversation, this);
    this.events.on('closeConversation', this.closeConversation, this);
  }

  private setupControls(): void {
    // ESC to close
    this.input.keyboard?.on('keydown-ESC', () => {
      if (this.isActive) {
        this.closeConversation();
      }
    });

    // ENTER to send message
    this.input.keyboard?.on('keydown-ENTER', () => {
      if (this.isActive) {
        this.sendMessage();
      }
    });
  }

  private openConversation(): void {
    this.isActive = true;
    this.dialogueBox.setVisible(true);
    this.inputField.setVisible(true);

    // Add welcome message if this is the first time
    if (this.conversationMessages.length === 0) {
      this.addMessage('Wizard', 'Welcome to Mykola Mykhaliuk\'s interactive portfolio! I am your guide through this realm. Ask me about his SKILLS, PROJECTS, FUTURE, or CONTACTS!', '#FFD700');
    }

    // Focus the input field
    setTimeout(() => {
      const input = document.getElementById('wizardInput') as HTMLInputElement;
      if (input) {
        input.focus();
        input.value = '';
      }
    }, 100);

    // Pause the game scene
    this.scene.pause('CityScene');
  }

  private closeConversation(): void {
    this.isActive = false;
    this.dialogueBox.setVisible(false);
    this.inputField.setVisible(false);

    // Resume the game scene
    this.scene.resume('CityScene');

    // Emit event to notify wizard
    this.events.emit('conversationClosed');
  }

  private sendMessage(): void {
    const input = document.getElementById('wizardInput') as HTMLInputElement;
    if (!input || !input.value.trim()) return;

    const question = input.value.trim();

    // Add player message
    this.addMessage('You', question, '#4488ff');

    // Clear input
    input.value = '';

    // Get wizard response
    this.getWizardResponse(question);
  }

  private addMessage(sender: string, message: string, color: string): void {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const formattedMessage = `[${timestamp}] ${sender}: ${message}`;

    this.conversationMessages.push(formattedMessage);

    // Keep only last 10 messages
    if (this.conversationMessages.length > 10) {
      this.conversationMessages.shift();
    }

    // Update chat display with colored sender names
    let displayText = '';
    for (let i = 0; i < this.conversationMessages.length; i++) {
      displayText += this.conversationMessages[i] + '\n\n';
    }

    this.chatHistory.setText(displayText);

    // Auto-scroll to bottom (simulate by showing latest messages)
  }

  private getWizardResponse(question: string): void {
    // Response system about Mykola Mykhaliuk's portfolio
    let response = '';

    const lowerQuestion = question.toLowerCase();

    // About Mykola
    if (lowerQuestion.includes('who') || lowerQuestion.includes('mykola') || lowerQuestion.includes('mykhaliuk')) {
      response = 'This realm represents Mykola Mykhaliuk\'s journey! He is a skilled developer who conquers bugs and builds amazing projects. Explore the buildings to learn more about his skills, projects, future plans, and contacts!';
    }
    // Skills building
    else if (lowerQuestion.includes('skill') || lowerQuestion.includes('education') || lowerQuestion.includes('learn')) {
      response = 'The SKILLS building holds knowledge of Mykola\'s technical abilities! Enter it to discover his programming languages, frameworks, and expertise. Press E at the yellow door to explore!';
    }
    // Projects building
    else if (lowerQuestion.includes('project') || lowerQuestion.includes('work') || lowerQuestion.includes('portfolio')) {
      response = 'The PROJECTS building showcases Mykola\'s creations! Inside you\'ll find his completed works, applications, and innovations. Each project tells a story of problem-solving and creativity!';
    }
    // Future building
    else if (lowerQuestion.includes('future') || lowerQuestion.includes('goal') || lowerQuestion.includes('plan')) {
      response = 'The FUTURE building reveals Mykola\'s aspirations and roadmap! Discover his career goals, upcoming projects, and vision for technology. The future is bright!';
    }
    // Contacts building
    else if (lowerQuestion.includes('contact') || lowerQuestion.includes('email') || lowerQuestion.includes('reach') || lowerQuestion.includes('hire')) {
      response = 'The CONTACTS building contains ways to reach Mykola! Find his email, LinkedIn, GitHub, and other professional connections. He\'s always open to opportunities and collaboration!';
    }
    // Buildings general
    else if (lowerQuestion.includes('building') || lowerQuestion.includes('door') || lowerQuestion.includes('enter')) {
      response = 'Four buildings represent Mykola\'s professional profile: SKILLS, PROJECTS, FUTURE, and CONTACTS. Press E near yellow doors to enter and explore each section of his curriculum!';
    }
    // Bugs/enemies
    else if (lowerQuestion.includes('bug') || lowerQuestion.includes('enemy') || lowerQuestion.includes('enemies')) {
      response = 'The bugs symbolize challenges and obstacles in development! Mykola defeats them daily through debugging and problem-solving. Each bug defeated represents a problem solved!';
    }
    // Game purpose
    else if (lowerQuestion.includes('game') || lowerQuestion.includes('why') || lowerQuestion.includes('purpose')) {
      response = 'This interactive experience is Mykola\'s creative CV! Instead of a boring document, he built this isometric adventure to showcase his skills. Explore, fight bugs, and discover his professional journey!';
    }
    // Controls/help
    else if (lowerQuestion.includes('help') || lowerQuestion.includes('how') || lowerQuestion.includes('control')) {
      response = 'Use WASD to move, left-click to attack bugs, press E to enter buildings, and switch weapons with 1 and 2. Navigate through Mykola\'s world and discover his story!';
    }
    // Weapons (metaphor)
    else if (lowerQuestion.includes('weapon') || lowerQuestion.includes('gun') || lowerQuestion.includes('sword')) {
      response = 'Your weapons represent Mykola\'s tools: the gun is like his IDE (precise, ranged debugging), the sword is like his problem-solving (direct, powerful solutions). Both defeat bugs effectively!';
    }
    // Score/points
    else if (lowerQuestion.includes('score') || lowerQuestion.includes('point')) {
      response = 'Each bug defeated adds to your score, representing solved problems and completed tasks. Higher scores mean more challenges - just like real development projects!';
    }
    // Greetings
    else if (lowerQuestion.includes('hi') || lowerQuestion.includes('hello') || lowerQuestion.includes('greetings')) {
      response = 'Welcome to Mykola Mykhaliuk\'s interactive portfolio! I\'m here to guide you through his professional journey. What would you like to know?';
    }
    // Thanks
    else if (lowerQuestion.includes('thank') || lowerQuestion.includes('thanks')) {
      response = 'You\'re welcome! Feel free to explore the buildings to learn more about Mykola\'s skills and experience!';
    }
    // Goodbye
    else if (lowerQuestion.includes('bye') || lowerQuestion.includes('goodbye')) {
      response = 'Farewell! Don\'t forget to visit all four buildings and check out Mykola\'s contacts if you\'d like to connect!';
    }
    // About the wizard
    else if (lowerQuestion.includes('you') && (lowerQuestion.includes('who') || lowerQuestion.includes('what'))) {
      response = 'I am the guide of this realm, keeper of Mykola\'s professional knowledge. I\'m here to help you navigate his interactive curriculum!';
    }
    // Technology/tech stack
    else if (lowerQuestion.includes('tech') || lowerQuestion.includes('technology') || lowerQuestion.includes('stack')) {
      response = 'Visit the SKILLS building to discover Mykola\'s technology stack! He works with modern frameworks and languages. This game itself is built with Phaser 3 and TypeScript!';
    }
    // Experience
    else if (lowerQuestion.includes('experience') || lowerQuestion.includes('job') || lowerQuestion.includes('career')) {
      response = 'Explore the PROJECTS building to see Mykola\'s professional experience! Each completed project demonstrates his growing expertise and problem-solving abilities.';
    }
    else {
      // Default responses for unrecognized questions
      const defaultResponses = [
        'Interesting question! Try exploring the four buildings: SKILLS, PROJECTS, FUTURE, and CONTACTS to learn more about Mykola!',
        'I sense curiosity in your question. Navigate the city and defeat bugs to discover more about Mykola Mykhaliuk\'s journey!',
        'That\'s a unique inquiry! Press E at the yellow doors to enter buildings and uncover Mykola\'s professional story.',
        'Each building holds answers about Mykola. Which area interests you: his skills, projects, future plans, or contacts?',
        'Great question! This interactive portfolio showcases Mykola\'s abilities. Explore each building to learn more!',
      ];
      response = defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
    }

    // Add wizard response with a slight delay
    setTimeout(() => {
      this.addMessage('Wizard', response, '#FFD700');
    }, 500);
  }

  getIsActive(): boolean {
    return this.isActive;
  }
}
