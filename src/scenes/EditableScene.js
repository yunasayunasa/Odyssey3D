// src/scenes/EditableScene.js

export default class EditableScene extends Phaser.Scene {
    static editorInitialized = false;

    constructor(config) {
        super(config);
        
        // エディタ関連のプロパティを初期化
        this.isEditorMode = false;
        this.stateManager = null;
        this.selectedObject = null;
        this.editorInitialized = false; 
          this.editorPanel = null;
        this.editorTitle = null;
        this.editorPropsContainer = null;
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
      this.handleCreate();
    }

      // ★★★ updateメソッドを新設（または修正） ★★★
     update(time, delta) {
        // ★★★ チェックする対象を、静的プロパティに変更 ★★★
        if (this.isEditorMode && !EditableScene.editorInitialized) {
            this.initEditorControls();
            
            // ★★★ この初期化ロジックは、最初に起動したEditableSceneに任せるので、ここからは削除 ★★★
            // this.children.list.forEach(gameObject => { ... });
            
            EditableScene.editorInitialized = true; // ★ 静的プロパティを更新
        }
            
         

        // --- 子シーンのupdate処理を呼び出す ---
        if (this.handleUpdate) {
            this.handleUpdate(time, delta);
        }
    }

    // ★★★ 子シーンが実装するための、空のupdateメソッドを用意 ★★★
    handleUpdate(time, delta) {
        // このメソッドは、子シーンでオーバーライドされることを想定しています
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
    if (this.editorInitialized) return;
    console.warn(`[EditableScene] Editor Controls Initialized for scene: ${this.scene.key}`);
    
    // HTML要素を取得
    this.editorPanel = document.getElementById('editor-panel');
    this.editorTitle = document.getElementById('editor-title');
    this.editorPropsContainer = document.getElementById('editor-props');
    
    // ★★★ ここからが修正箇所 ★★★

    // --- オブジェクト選択/選択解除 ---
     this.input.on('pointerdown', (pointer) => {
            // ★ 現在アクティブな最前面のシーンを取得
            const topScene = this.scene.manager.getScenes(true)[0];

            // ★ 自分自身が最前面のシーンでなければ、何もしない
            if (topScene !== this) return;
            
            setTimeout(() => {
                const hitObjects = this.input.manager.hitTest(pointer, this.children.list, this.cameras.main);
                const editableHit = hitObjects.find(obj => obj.input && obj.input.draggable);
                
                // ★ selectedObjectはグローバルに一つだけにする
                this.registry.set('editor_selected_object', editableHit || null);
                
                this.updatePropertyPanel();
            }, 0);
        });

    // --- ドラッグ機能 ---
    this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
        gameObject.x = Math.round(dragX);
        gameObject.y = Math.round(dragY);
        // ドラッグ中もプロパティパネルの数値を更新
        if (gameObject === this.selectedObject) {
            this.updatePropertyPanel();
        }
    });

    // JSONエクスポート機能
    this.input.keyboard.on('keydown-P', this.exportLayoutToJson, this);

    // ★★★ gameobjectdownリスナーは、pointerdownで統合したので不要 ★★★
    
    this.editorInitialized = true;
}

     // ★★★ プロパティパネルを更新するメソッドを新規作成 ★★★
  updatePropertyPanel() {
        // ★ 選択オブジェクトを、レジストリから取得する
        const selectedObject = this.registry.get('editor_selected_object');
        
        if (!this.isEditorMode || !this.editorPanel) return;
        
        if (!selectedObject) {
            this.editorPanel.style.display = 'none';
            return;
        }

        this.editorPanel.style.display = 'block';
        this.editorTitle.innerText = `Editing: ${selectedObject.name}`;

        // --- 編集したいプロパティを定義 ---
        const properties = {
            x: { type: 'number', min: 0, max: 1280, step: 1 },
            y: { type: 'number', min: 0, max: 720, step: 1 },
            scaleX: { type: 'range', min: 0.1, max: 5, step: 0.1 },
            scaleY: { type: 'range', min: 0.1, max: 5, step: 0.1 },
            angle: { type: 'range', min: -180, max: 180, step: 1 },
            alpha: { type: 'range', min: 0, max: 1, step: 0.05 }
        };

        // --- プロパティごとにHTML入力要素を動的に生成 ---
        for (const key in properties) {
            const prop = properties[key];
            const value = this.selectedObject[key];
            
            const row = document.createElement('div');
            row.style.marginBottom = '8px';
            
            const label = document.createElement('label');
            label.innerText = `${key}: `;
            label.style.display = 'inline-block';
            label.style.width = '70px';

            const input = document.createElement('input');
            input.type = prop.type;
            input.min = prop.min;
            input.max = prop.max;
            input.step = prop.step;
            input.value = value;

            // ★ 入力が変更されたら、オブジェクトのプロパティをリアルタイムに更新
            input.addEventListener('input', (e) => {
                this.selectedObject[key] = parseFloat(e.target.value);
            });

            row.appendChild(label);
            row.appendChild(input);
            this.editorPropsContainer.appendChild(row);
        }
    }
    

    /**
     * 指定されたゲームオブジェクトを編集可能（ドラッグ可能など）にする
     * @param {Phaser.GameObjects.GameObject} gameObject - 編集可能にしたいオブジェクト
     */
   makeEditable(gameObject) {
    if (!this.isEditorMode || !gameObject) return;
    
    // ★★★ ここからが修正箇所 ★★★
    try {
        // setInteractiveをtry...catchで囲む
        gameObject.setInteractive();
        
        // 成功した場合のみ、draggableを設定
        this.input.setDraggable(gameObject, true);
          if (typeof gameObject.setTint === 'function') {
            // マウスオーバーで緑色に光らせる
            gameObject.on('pointerover', () => { 
                gameObject.setTint(0x00ff00); 
            });
            gameObject.on('pointerout', () => { 
                gameObject.clearTint(); 
            });
        }
     
    } catch (e) {
        console.warn(`[EditableScene] Object "${gameObject.name}" could not be made interactive. Did you forget setSize()?`, e);
    }
    // ★★★ ここまでが修正箇所 ★★★
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
     * 動的に追加されたオブジェクトを、後から編集可能にする
     */
    addEditableObject(gameObject) {
        if (!this.isEditorMode || !gameObject) return;
        
        // 既にエディタが初期化済みの場合のみ、makeEditableを呼び出す
        if (this.editorInitialized) {
            this.makeEditable(gameObject);
        }
    }

    /**
     * シーンが破棄されるときに、イベントリスナーをクリーンアップする
     */
    shutdown() {
        // キーボードイベントを明示的に削除
        if (this.input && this.input.keyboard) {
             this.input.keyboard.off('keydown-P', this.exportLayoutToJson, this);
        }

        if (this.editorPanel) {
            this.editorPanel.style.display = 'none';
        }
        super.shutdown();
    }
}