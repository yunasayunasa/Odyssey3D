import CoinHud from '../ui/CoinHud.js';
import HpBar from '../ui/HpBar.js';

export default class UIScene extends Phaser.Scene {
    
    constructor() {
        super({ key: 'UIScene', active: false });
        this.menuButton = null;
        this.panel = null;
        this.isPanelOpen = false;
        
        // 管理するHUDをプロパティとして初期化
        this.coinHud = null;
        this.playerHpBar = null;
        this.enemyHpBar = null; // バトルシーン用に敵HPバーも管理
    }

    create() {
        console.log("UIScene: 作成・初期化");
        this.scene.bringToTop();
        
        const stateManager = this.sys.registry.get('stateManager');
        const gameWidth = 1280;
        const gameHeight = 720;

        // --- 1. パネルと、その中のボタンを生成 ---
        this.panel = this.add.container(0, gameHeight + 120); // 初期位置は画面下
        
        const panelBg = this.add.rectangle(gameWidth / 2, 0, gameWidth, 120, 0x000000, 0.8).setInteractive();
        const saveButton = this.add.text(0, 0, 'セーブ', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5).setInteractive();
        const loadButton = this.add.text(0, 0, 'ロード', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5).setInteractive();
        const backlogButton = this.add.text(0, 0, '履歴', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5).setInteractive();
        const configButton = this.add.text(0, 0, '設定', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5).setInteractive();
        const autoButton = this.add.text(0, 0, 'オート', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5).setInteractive();
        const skipButton = this.add.text(0, 0, 'スキップ', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5).setInteractive();
        
        this.panel.add([panelBg, saveButton, loadButton, backlogButton, configButton, autoButton, skipButton]);

        // --- 2. パネル内のボタンのレイアウトを確定 ---
        const buttons = [saveButton, loadButton, backlogButton, configButton, autoButton, skipButton];
        const areaStartX = 250;
        const areaWidth = gameWidth - areaStartX - 100;
        const buttonMargin = areaWidth / buttons.length;
        buttons.forEach((button, index) => {
            button.setX(areaStartX + (buttonMargin * index) + (buttonMargin / 2));
        });

        // --- 3. メインの「メニュー」ボタンを生成・配置 ---
        this.menuButton = this.add.text(100, gameHeight - 50, 'MENU', { fontSize: '36px', fill: '#fff' }).setOrigin(0.5).setInteractive();

        // --- 4. すべてのイベントリスナーを、ここで一括設定 ---
        
        // パネル背景は、クリックイベントを止めるだけ
        panelBg.on('pointerdown', (pointer, localX, localY, event) => {
            event.stopPropagation();
        });

        // メニューボタンは、パネルの開閉をトリガー
        this.menuButton.on('pointerdown', (pointer, localX, localY, event) => {
            this.togglePanel();
            event.stopPropagation();
        });

        // 各機能ボタン
        saveButton.on('pointerdown', (pointer, localX, localY, event) => {
            this.openScene('SaveLoadScene', { mode: 'save' });
            event.stopPropagation();
        });
        loadButton.on('pointerdown', (pointer, localX, localY, event) => {
            this.openScene('SaveLoadScene', { mode: 'load' });
            event.stopPropagation();
        });
        backlogButton.on('pointerdown', (pointer, localX, localY, event) => {
            this.openScene('BacklogScene');
            event.stopPropagation();
        });
        configButton.on('pointerdown', (pointer, localX, localY, event) => {
            this.openScene('ConfigScene');
            event.stopPropagation();
        });
        autoButton.on('pointerdown', (pointer, localX, localY, event) => {
            this.toggleGameMode('auto');
            event.stopPropagation();
        });
        skipButton.on('pointerdown', (pointer, localX, localY, event) => {
            this.toggleGameMode('skip');
            event.stopPropagation();
        });
        
        // --- HUDのインスタンスを生成 ---
        this.coinHud = new CoinHud(this, { x: 100, y: 50, stateManager: stateManager });
        this.playerHpBar = new HpBar(this, { x: 100, y: 100, width: 200, height: 25, type: 'player', stateManager: stateManager });
        // BattleSceneにしか出てこない敵HPバーもここで作ってしまう
        this.enemyHpBar = new HpBar(this, { x: this.scale.width - 100 - 250, y: 100, width: 250, height: 25, type: 'enemy', stateManager: stateManager });

        // --- SystemSceneからの通知を受け取るリスナー ---
        const systemScene = this.scene.get('SystemScene');
        systemScene.events.on('transition-complete', this.onSceneTransition, this);
        
       
        console.log("UI作成");
    }

    // --- 以下、このクラスが持つメソッド群 ---
   onSceneTransition(newSceneKey) {
        console.log(`[UIScene] シーン遷移を検知。HUD表示を更新します。新しいシーン: ${newSceneKey}`);

        const isGameScene = (newSceneKey === 'GameScene');
        const isBattleScene = (newSceneKey === 'BattleScene');

        // シーンに応じてHUDの表示/非表示を切り替える
        if (this.coinHud) this.coinHud.setVisible(isGameScene || isBattleScene);
        
        // ★★★★★★★★★★★★★★★★★★★★★★★★★★★
        // ★★★ ここを修正 ★★★
        // ★★★ playerHpBarはBattleSceneの時だけ表示 ★★★
        // ★★★★★★★★★★★★★★★★★★★★★★★★★★★
        if (this.playerHpBar) this.playerHpBar.setVisible(isBattleScene); 
        
        if (this.enemyHpBar) this.enemyHpBar.setVisible(isBattleScene);
    }
    togglePanel() {
        this.isPanelOpen = !this.isPanelOpen;
        const targetY = this.isPanelOpen ? 720 - 60 : 720 + 120;
        this.tweens.add({
            targets: this.panel,
            y: targetY,
            duration: 300,
            ease: 'Cubic.easeInOut'
        });
    }

    openScene(sceneKey, data = {}) {
        this.scene.pause('GameScene');
        // Config, Backlog, SaveLoadシーンを開くときは、UI自身も止める
      /*  if (['ConfigScene', 'BacklogScene', 'SaveLoadScene'].includes(sceneKey)) {
            this.scene.pause();
        }*/
        this.scene.launch(sceneKey, data);
    }
    
    toggleGameMode(mode) {
        const gameScene = this.scene.get('GameScene');
        if (gameScene && gameScene.scenarioManager) {
            const currentMode = gameScene.scenarioManager.mode;
            const newMode = currentMode === mode ? 'normal' : mode;
            gameScene.scenarioManager.setMode(newMode);
        }
    }
  setVisible(isVisible) {
        console.log(`UIScene: setVisible(${isVisible}) が呼ばれました。`);
        // UIScene内の全ての表示オブジェクトの可視性を切り替える
        if (this.menuButton) this.menuButton.setVisible(isVisible);
        if (this.panel) this.panel.setVisible(isVisible); 
        
        // パネルが開いている状態でも、パネルを非表示にする
        if (!isVisible && this.isPanelOpen) {
            this.isPanelOpen = false; // 状態をリセット
            // Tweenなしで即座に隠す
            if (this.panel) this.panel.y = this.scale.height + 120; 
        }
    }
     shutdown() {
        const systemScene = this.scene.get('SystemScene');
        if (systemScene) {
            systemScene.events.off('transition-complete', this.onSceneTransition, this);
        }
    }
}