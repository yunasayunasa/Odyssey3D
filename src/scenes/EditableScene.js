// src/scenes/EditableScene.js

export default class EditableScene extends Phaser.Scene {
    constructor(config) {
        super(config);
        
        // エディタ関連のプロパティ
        this.isEditorMode = false;
        this.stateManager = null;
        this.selectedObject = null;
    }

    create() {
        // StateManagerを取得し、デバッグモードを判定
        this.stateManager = this.sys.registry.get('stateManager');
        this.isEditorMode = this.stateManager.sf.debug_mode;
        
        // もしエディタモードなら、エディタ機能を初期化
        if (this.isEditorMode) {
            this.initEditorControls();
        }
    }

    // --- ここからが共通エディタ機能 ---

    initEditorControls() {
        console.warn(`[EditableScene] Editor Controls Initialized for ${this.scene.key}`);

        // ドラッグ機能
        this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
            gameObject.x = dragX;
            gameObject.y = dragY;
        });

        // オブジェクト選択機能 (今後、プロパティウィンドウで拡張)
        this.input.on('gameobjectdown', (pointer, gameObject) => {
            if (!this.isEditorMode) return;
            this.selectedObject = gameObject;
            console.log(`[Editor] Selected: ${gameObject.name}`);
            // (選択されたオブジェクトに枠線を付けるなどの処理)
        });

        // JSONエクスポート機能 (今後実装)
        this.input.keyboard.on('keydown-P', this.exportLayoutToJson, this);
    }

    // シーンに追加されたオブジェクトを、自動的に編集可能にするメソッド
    makeEditable(gameObject) {
        if (!this.isEditorMode) return;
        
        gameObject.setInteractive();
        this.input.setDraggable(gameObject, true);
        
        // マウスオーバーでハイライト
        gameObject.on('pointerover', () => { gameObject.setTint(0x00ff00); });
        gameObject.on('pointerout', () => { gameObject.clearTint(); });
    }

    exportLayoutToJson() {
        if (!this.isEditorMode) return;
        console.log(`[Editor] Exporting layout for ${this.scene.key}...`);
        // (ここに、シーン内のオブジェクトをJSON化するロジックを実装)
    }
}