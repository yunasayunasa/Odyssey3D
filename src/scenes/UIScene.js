// src/scenes/UIScene.js (構文修正版)

import EditableScene from './EditableScene.js';
import CoinHud from '../ui/CoinHud.js';
import HpBar from '../ui/HpBar.js';

export default class UIScene extends EditableScene {
    
    constructor() {
        super({ key: 'UIScene' }); // 'active: false'はPhaserが自動で処理するので不要
        
        this.menuButton = null;
        this.panel = null;
        this.isPanelOpen = false;
        this.coinHud = null;
        this.playerHpBar = null;
        this.enemyHpBar = null;
    }

    handleInit(data) {
        console.log("UIScene: handleInit");
    }

    handleCreate() {
        console.log("UIScene: 作成・初期化");
        this.scene.bringToTop();
        
        const stateManager = this.sys.registry.get('stateManager');
        const gameWidth = 1280;
        const gameHeight = 720;

        // --- パネルと、その中のボタンを生成 ---
        this.panel = this.add.container(0, gameHeight + 120);
        const panelBg = this.add.rectangle(gameWidth / 2, 0, gameWidth, 120, 0x000000, 0.8).setInteractive();
        const saveButton = this.add.text(0, 0, 'セーブ', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5).setInteractive();
        const loadButton = this.add.text(0, 0, 'ロード', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5).setInteractive();
        const backlogButton = this.add.text(0, 0, '履歴', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5).setInteractive();
        const configButton = this.add.text(0, 0, '設定', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5).setInteractive();
        const autoButton = this.add.text(0, 0, 'オート', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5).setInteractive();
        const skipButton = this.add.text(0, 0, 'スキップ', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5).setInteractive();
        this.panel.add([panelBg, saveButton, loadButton, backlogButton, configButton, autoButton, skipButton]);

        // --- パネル内のボタンのレイアウトを確定 ---
        const buttons = [saveButton, loadButton, backlogButton, configButton, autoButton, skipButton];
        const areaStartX = 250;
        const areaWidth = gameWidth - areaStartX - 100;
        const buttonMargin = areaWidth / buttons.length;
        buttons.forEach((button, index) => {
            button.setX(areaStartX + (buttonMargin * index) + (buttonMargin / 2));
        });

        // --- メインの「メニュー」ボタンを生成・配置 ---
        this.menuButton = this.add.text(100, gameHeight - 50, 'MENU', { fontSize: '36px', fill: '#fff' }).setOrigin(0.5);

        // --- イベントリスナーを、ここで一括設定 ---
        panelBg.on('pointerdown', e => e.stopPropagation());
        this.menuButton.on('pointerdown', e => { this.togglePanel(); e.stopPropagation(); });
        saveButton.on('pointerdown', e => { this.openScene('SaveLoadScene', { mode: 'save' }); e.stopPropagation(); });
        loadButton.on('pointerdown', e => { this.openScene('SaveLoadScene', { mode: 'load' }); e.stopPropagation(); });
        backlogButton.on('pointerdown', e => { this.openScene('BacklogScene'); e.stopPropagation(); });
        configButton.on('pointerdown', e => { this.openScene('ConfigScene'); e.stopPropagation(); });
        autoButton.on('pointerdown', e => { this.toggleGameMode('auto'); e.stopPropagation(); });
        skipButton.on('pointerdown', e => { this.toggleGameMode('skip'); e.stopPropagation(); });
        
        // --- HUDのインスタンスを生成 ---
        this.coinHud = new CoinHud(this, { x: 100, y: 50, stateManager: stateManager });
        this.playerHpBar = new HpBar(this, { x: 100, y: 100, width: 200, height: 25, type: 'player', stateManager: stateManager });
        this.enemyHpBar = new HpBar(this, { x: this.scale.width - 100 - 250, y: 100, width: 250, height: 25, type: 'enemy', stateManager: stateManager });

        // JSONで識別するための名前を付ける
        this.menuButton.name = 'menu_button';
        this.coinHud.name = 'coin_hud';
        this.playerHpBar.name = 'player_hp_bar';
        this.enemyHpBar.name = 'enemy_hp_bar';
        this.panel.name = 'bottom_panel'; // パネルにも名前を付けると便利
        

        
        // --- SystemSceneからの通知を受け取るリスナー ---
        const systemScene = this.scene.get('SystemScene');
        systemScene.events.on('transition-complete', this.onSceneTransition, this);
        
        console.log("UI作成完了");
      // ★★★ 自分のシーンのオブジェクトを編集可能にする ★★★
      if (this.isEditorMode) {
        this.children.list.forEach(gameObject => {
            // コンテナの中身も含めて再帰的に探索すると、より完璧
            if (gameObject.name) this.makeEditable(gameObject);
        });
    }
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
        super.shutdown(); // 親クラス(EditableScene)のshutdownを呼び出す
    }
}