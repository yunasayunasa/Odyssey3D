// src/scenes/EditableScene.js

export default class EditableScene extends Phaser.Scene {
   
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
        if (this.isEditorMode) {
            // ★ createの最後でエディタを初期化する
            this.sys.events.once('postupdate', this.initEditorControls, this);
        }
        this.handleCreate();
    }

      // ★★★ updateメソッドを新設（または修正） ★★★
     update(time, delta) {
       if (this.isEditorMode && !EditableScene.editorInitialized) {
            this.initEditorControls();
            EditableScene.editorInitialized = true;
        }

        if (this.handleUpdate) this.handleUpdate(time, delta);
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
 
      // --- 共通エディタ機能 ---
    // src/scenes/EditableScene.js

initEditorControls() {
    // このシーンが既にエディタとして初期化済みなら、何もしない（二重登録防止）
    if (this.editorInitialized) return;

    console.warn(`[EditableScene] Editor Controls Initialized for scene: ${this.scene.key}`);
    
    // プロパティパネルのHTML要素を取得
    this.editorPanel = document.getElementById('editor-panel');
    this.editorTitle = document.getElementById('editor-title');
    this.editorPropsContainer = document.getElementById('editor-props');

    // --- 1. ドラッグ機能 ---
    // このシーンで発生したdragイベントをリッスン
    this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
        gameObject.x = Math.round(dragX);
        gameObject.y = Math.round(dragY);
        // もしドラッグ中のオブジェクトが選択されていたら、パネルも更新
        if (gameObject === this.selectedObject) {
            this.updatePropertyPanel();
        }
    });

    // --- 2. オブジェクト選択機能 ---
    // このシーンのゲームオブジェクトがクリックされたら発火
    this.input.on('gameobjectdown', (pointer, gameObject) => {
        // 選択されたオブジェクトを、このシーンのプロパティとして保持
        this.selectedObject = gameObject;
        // プロパティパネルを更新
        this.updatePropertyPanel();
    });

    // --- 3. 選択解除機能 ---
    // このシーンの、何もない場所がクリックされたら発火
    this.input.on('pointerdown', (pointer) => {
        // クリックされた場所にオブジェクトがヒットしなかった場合
        if (this.input.manager.hitTest(pointer, this.children.list, this.cameras.main).length === 0) {
            // 選択を解除
            this.selectedObject = null;
            // プロパティパネルを更新（隠す）
            this.updatePropertyPanel();
        }
    });
    
    // --- 4. JSONエクスポート機能 ---
    this.input.keyboard.on('keydown-P', this.exportLayoutToJson, this);

    this.editorInitialized = true;
}


// src/scenes/EditableScene.js

updatePropertyPanel() {
    // 必要なHTML要素や、エディタモードの状態をチェック
    if (!this.isEditorMode || !this.editorPanel) return;
    
    // このシーンで選択されているオブジェクトを取得
    const selectedObject = this.selectedObject;
    
    // 選択されているオブジェクトがなければ、パネルを隠して終了
    if (!selectedObject) {
        this.editorPanel.style.display = 'none';
        return;
    }

    // オブジェクトが選択されていれば、パネルを表示
    this.editorPanel.style.display = 'block';
    
    // パネルの内容を、選択されたオブジェクトの情報で更新
    this.editorTitle.innerText = `Editing: ${selectedObject.name || '(no name)'}`;
    this.editorPropsContainer.innerHTML = ''; // 中身を一度空にする

    // 編集したいプロパティの定義
    const properties = {
        x: { type: 'number', min: 0, max: 1280, step: 1 },
        y: { type: 'number', min: 0, max: 720, step: 1 },
        scaleX: { type: 'range', min: 0.1, max: 5, step: 0.1 },
        scaleY: { type: 'range', min: 0.1, max: 5, step: 0.1 },
        angle: { type: 'range', min: -180, max: 180, step: 1 },
        alpha: { type: 'range', min: 0, max: 1, step: 0.05 }
    };
    
    // プロパティごとにHTML入力要素を動的に生成
    for (const key in properties) {
        // selectedObjectがそのプロパティを持っているか確認
        if (selectedObject[key] === undefined) continue;

        const prop = properties[key];
        const value = selectedObject[key];
        
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

        // 入力が変更されたら、選択中のオブジェクトのプロパティをリアルタイムに更新
        input.addEventListener('input', (e) => {
            selectedObject[key] = parseFloat(e.target.value);
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
        if (!this.isEditorMode || !gameObject.name) return; // 名前がないものは編集不可
        try {
            gameObject.setInteractive();
            this.input.setDraggable(gameObject, true);
            if (typeof gameObject.setTint === 'function') {
                gameObject.on('pointerover', () => gameObject.setTint(0x00ff00));
                gameObject.on('pointerout', () => gameObject.clearTint());
            }
     
    } catch (e) {
        console.warn(`[EditableScene] Object "${gameObject.name}" could not be made interactive. Did you forget setSize()?`, e);
    }
    // ★★★ ここまでが修正箇所 ★★★
}

    /**
     * 動的に追加されたゲームオブジェクトを、後から編集可能にする
     * @param {Phaser.GameObjects.GameObject} gameObject - 新しく追加されたオブジェクト
     */
    addEditableObject(gameObject) {
        // エディタモードであり、かつエディタが既に初期化済みの場合のみ実行
        if (this.isEditorMode && this.editorInitialized) {
            this.makeEditable(gameObject);
        }
    }

    /**
     * 現在のシーンのレイアウトをJSON形式でコンソールに出力する
     */
    exportLayoutToJson() {
        if (!this.isEditorMode) return;
        const topScene = this.scene.manager.getScenes(true)[0];
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
        if (this.isEditorMode && this.editorInitialized) {
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