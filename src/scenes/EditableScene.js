// src/scenes/EditableScene.js

export default class EditableScene extends Phaser.Scene {
    constructor(config) {
        super(config);
        
        // エディタ関連のプロパティを初期化
        this.isEditorMode = false;
        this.stateManager = null;
        this.selectedObject = null;
        this.editorInitialized = false; // エディタが初期化済みかのフラグ
    }

    /**
     * Phaserのシーンライフサイクル：createの前に呼ばれる
     * StateManagerからデバッグモードの状態を取得するのに最適な場所
     */
    init(data) {
        // StateManagerはPreloadSceneで登録済みなので、registryから直接取得
        this.stateManager = this.sys.registry.get('stateManager');
        if (this.stateManager) {
            this.isEditorMode = this.stateManager.sf.debug_mode;
        }

        // 子シーン（GameSceneなど）が独自のinit処理を行えるように、handleInitを呼び出す
        if (this.handleInit) {
            this.handleInit(data);
        }
    }

    /**
     * Phaserのシーンライフサイクル：initの後に呼ばれる
     * this.addやthis.inputなどのシステムが、このメソッド内で使えるようになる
     */
    create() {
        // ★ デバッグモードなら、エディタ機能を初期化
        // この時点では、this.input や this.add は完全に準備が整っている
        if (this.isEditorMode) {
            this.initEditorControls();
        }

        // 子シーンが独自のcreate処理を実行できるように、handleCreateを呼び出す
        this.handleCreate();
    }

    // --- ここからが、子シーンが実装するためのメソッド ---

    /**
     * 子シーンが独自のinit処理を実装するためのメソッド
     * @param {object} data - シーン遷移時に渡されたデータ
     */
    handleInit(data) {
        // このメソッドは、子シーン（例: GameScene）でオーバーライドされることを想定しています
    }
    
    /**
     * 子シーンが独自のcreate処理を実装するためのメソッド
     */
    handleCreate() {
        // このメソッドは、子シーン（例: UIScene）でオーバーライドされることを想定しています
    }


    // --- ここからが、すべての子シーンで共通して使えるエディタ機能 ---

    /**
     * エディタのイベントリスナーなどを初期化する
     */
    initEditorControls() {
        // 既に初期化済みなら何もしない（二重登録防止）
        if (this.editorInitialized) return;

        console.warn(`[EditableScene] Editor Controls Initialized for scene: ${this.scene.key}`);

        // ドラッグ機能のイベントリスナー
        this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
            gameObject.x = Math.round(dragX); // 座標を整数に丸めると綺麗に配置しやすい
            gameObject.y = Math.round(dragY);
        });

        // オブジェクト選択機能のイベントリスナー
        // 'gameobjectdown' は、インタラクティブなオブジェクトがクリックされたときに発火する
        this.input.on('gameobjectdown', (pointer, gameObject) => {
            if (!this.isEditorMode) return;

            // 選択中のオブジェクトを更新
            this.selectedObject = gameObject;
            console.log(`[Editor] Selected: ${gameObject.name || '(no name)'}`);
            // (ここに、選択したオブジェクトをハイライトする処理や、
            //  プロパティウィンドウに情報を表示する処理を追加していく)
        });
        
        // 何もない場所をクリックしたら、選択を解除する
        this.input.on('pointerdown', (pointer) => {
            // 'gameobjectdown' はこのイベントより先に発火するので、
            // 0.1秒後にチェックして、まだ何も選択されていなければ選択解除とみなす
            setTimeout(() => {
                if (this.input.manager.hitTest(pointer, []).length === 0) {
                    this.selectedObject = null;
                    console.log("[Editor] Deselected.");
                }
            }, 100);
        });


        // JSONエクスポート機能のキーボードショートカット
        this.input.keyboard.on('keydown-P', this.exportLayoutToJson, this);

        this.editorInitialized = true;
    }

    /**
     * 指定されたゲームオブジェクトを編集可能（ドラッグ可能など）にする
     * @param {Phaser.GameObjects.GameObject} gameObject - 編集可能にしたいオブジェクト
     */
    makeEditable(gameObject) {
        if (!this.isEditorMode || !gameObject) return;
        
        // オブジェクトをインタラクティブ（操作可能）にする
        gameObject.setInteractive();

        // オブジェクトをドラッグ可能にする
        this.input.setDraggable(gameObject, true);
        
        // マウスオーバーで緑色に光らせる（視覚的なフィードバック）
        gameObject.on('pointerover', () => { 
            gameObject.setTint(0x00ff00); 
        });
        gameObject.on('pointerout', () => { 
            gameObject.clearTint(); 
        });
    }

    /**
     * 現在のシーンのレイアウトをJSON形式でコンソールに出力する
     */
    exportLayoutToJson() {
        if (!this.isEditorMode) return;

        console.log(`%c--- Exporting Layout for [${this.scene.key}] ---`, "color: lightgreen; font-weight: bold;");
        
        const exportData = {
            scene: this.scene.key,
            objects: []
        };

        // シーンの表示リスト（this.children）を走査
        this.children.list.forEach(gameObject => {
            // 編集可能なオブジェクト（inputプロパティがあり、draggableがtrue）のみを対象にする
            if (gameObject.input && gameObject.input.draggable) {
                exportData.objects.push({
                    name: gameObject.name || `unnamed_${gameObject.type}_${Math.round(gameObject.x)}_${Math.round(gameObject.y)}`,
                    type: gameObject.type, // 'Image', 'Text', 'Container'など
                    x: Math.round(gameObject.x),
                    y: Math.round(gameObject.y),
                    scaleX: gameObject.scaleX,
                    scaleY: gameObject.scaleY,
                    angle: Math.round(gameObject.angle),
                    alpha: gameObject.alpha,
                    // 将来的に、他のプロパティ（texture.keyなど）も追加していく
                });
            }
        });

        // JSON文字列に変換してコンソールに出力
        console.log(JSON.stringify(exportData, null, 2));
    }

    /**
     * シーンが破棄されるときに、イベントリスナーをクリーンアップする
     */
    shutdown() {
        // キーボードイベントを明示的に削除
        if (this.input && this.input.keyboard) {
             this.input.keyboard.off('keydown-P', this.exportLayoutToJson, this);
        }
        super.shutdown();
    }
}