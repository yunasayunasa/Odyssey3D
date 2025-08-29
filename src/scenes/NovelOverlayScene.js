
// 必要なコアクラスとハンドラをインポート
import ScenarioManager from '../core/ScenarioManager.js';
import MessageWindow from '../ui/MessageWindow.js';
import { tagHandlers } from '../handlers/index.js';
import { handleOverlayEnd } from '../handlers/overlay_end.js'; // 専用タグのみ個別インポート

export default class NovelOverlayScene extends Phaser.Scene {
    constructor() {
        super({ key: 'NovelOverlayScene' });
        
        // --- プロパティの初期化 ---
        this.scenarioManager = null;
        this.soundManager = null;
        this.stateManager = null;
        this.configManager = null;
        this.messageWindow = null;
        this.layer = {};
        this.charaDefs = null;
        this.characters = {};
        
        this.startScenario = null;
        this.returnTo = null; // どのシーンに戻るか
        
        this.choiceButtons = [];
        this.pendingChoices = [];
        this.inputBlocker = null;
    } 

    init(data) {
        this.startScenario = data.scenario;
        this.charaDefs = data.charaDefs;
        this.returnTo = data.returnTo; // ★ SystemSceneから渡された戻り先シーンキー
         this.inputWasBlocked = data.inputWasBlocked;
        // プロパティをリセット
        this.characters = {};
        this.choiceButtons = [];
        this.pendingChoices = [];
    }
    
    // このシーンで使うシナリオファイルだけを動的にロード
    preload() {
        if (this.startScenario) {
            console.log(`[NovelOverlayScene] シナリオ '${this.startScenario}' をロードします。`);
            this.load.text(this.startScenario, `assets/data/scenario/${this.startScenario}`);
        }
    }

    async create() {
        console.log("[NovelOverlayScene] create 開始");
        
        // --- 1. グローバルサービスを取得 ---
        // ★★★ newするのではなく、Registryから共有インスタンスを取得 ★★★
        this.configManager = this.sys.registry.get('configManager');
        this.stateManager = this.sys.registry.get('stateManager'); 
        // 2. デバッグモードかどうかを判定
        this.isEditorMode = this.stateManager.sf.debug_mode;
        
        if (this.isEditorMode) {
            console.warn("[GameScene] エディタモードで起動しました。");
            this.initEditorControls();
        }
        this.soundManager = this.sys.registry.get('soundManager');

        // --- 2. レイヤーとUIを生成 ---
        // 背景は透過させるので、backgroundColorの設定はしない
        this.layer.character = this.add.container(0, 0).setDepth(10);
        this.layer.cg = this.add.container(0, 0).setDepth(5);
        this.layer.message = this.add.container(0, 0).setDepth(20);

        this.messageWindow = new MessageWindow(this, this.soundManager, this.configManager);
        this.layer.message.add(this.messageWindow);
        
        // --- 3. ScenarioManagerを初期化 ---
        this.scenarioManager = new ScenarioManager(this, this.layer, this.charaDefs, this.messageWindow, this.soundManager, this.stateManager, this.configManager);
        
        // --- 4. タグハンドラを一括登録 ---
        for (const tagName in tagHandlers) {
            this.scenarioManager.registerTag(tagName, tagHandlers[tagName]);
        }
        // ★ このシーン専用のタグを上書き（または追加）で登録
        this.scenarioManager.registerTag('overlay_end', handleOverlayEnd);
        console.log(`[NovelOverlayScene] ${Object.keys(tagHandlers).length + 1}個のタグを登録しました。`);
           
        // --- 5. シナリオを開始 ---
        this.scenarioManager.loadScenario(this.startScenario);
        this.input.on('pointerdown', this.onPointerDown, this);
        this.time.delayedCall(10, () => this.scenarioManager.next());
        
        console.log("[NovelOverlayScene] create 完了");
    }

    onPointerDown() {
        // クリック待ちなどでなければ何もしない
        if (!this.scenarioManager.isWaitingClick && !this.scenarioManager.isWaitingChoice) {
            return;
        }
        
        // 選択肢表示中は、ボタン以外への入力をブロック
        if (this.scenarioManager.isWaitingChoice) {
            console.log("選択肢を選んでください");
            return;
        }
        
        this.scenarioManager.onClick();
    }

/**
 * 溜まっている選択肢情報を元に、ボタンを一括で画面に表示する
 */
 displayChoiceButtons() {
        // ... (GameSceneと全く同じ実装でOK) ...
        const totalButtons = this.pendingChoices.length;
        const startY = (this.scale.height / 2) - ((totalButtons / 2 - 0.5) * 70);

        this.pendingChoices.forEach((choice, index) => {
    const button = this.add.text(this.scale.width / 2, y, choice.text, { fontSize: '36px', fill: '#fff', backgroundColor: '#555', padding: { x: 20, y: 10 }})
        .setOrigin(0.5)
        .setInteractive();
    
        button.on('pointerdown', (pointer) => {
                pointer.stopPropagation(); // ★ 背後のシーンへのクリックイベント伝播を止める
                this.clearChoiceButtons();
                this.scenarioManager.jumpTo(choice.target);
                this.scenarioManager.next();
            });
            this.choiceButtons.push(button);
        });
        this.pendingChoices = [];
    }


 clearChoiceButtons() {
        // ... (GameSceneと全く同じ実装でOK) ...
        this.choiceButtons.forEach(button => button.destroy());
        this.choiceButtons = [];
        if (this.scenarioManager) {
            this.scenarioManager.isWaitingChoice = false;
        }
    }

     // ★★★ エディタ初期化メソッドを新規作成 ★★★
    initEditorControls() {
        // --- ドラッグ＆ドロップ機能 ---
        this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
            // オブジェクトをドラッグした座標に追従させる
            gameObject.x = dragX;
            gameObject.y = dragY;

            // (オプション) ドラッグ中の座標をコンソールに出力
            // console.log(`[Editor] Dragging ${gameObject.name}: x=${dragX.toFixed(0)}, y=${dragY.toFixed(0)}`);
        });

        // --- オブジェクトの選択とプロパティ表示 (フェーズ2の内容) ---
        // (今はまだ実装しない)

        // --- JSON出力機能 (フェーズ3の内容) ---
        // (今はまだ実装しない)
    }

    // ★★★ 新しいオブジェクトが追加された時に、ドラッグ可能にする処理 ★★★
    // [chara_show]などのタグハンドラがキャラクター画像を追加した後、
    // このメソッドを呼び出すように、ハンドラを改造する必要があります。
    enableDragFor(gameObject) {
        // エディタモードでない場合は、何もしない
        if (!this.isEditorMode) return;

        // オブジェクトに名前がない場合は、識別用に名前を付ける
        if (!gameObject.name) {
            gameObject.name = `editable_${this.children.list.length}`;
        }
        
        // オブジェクトをドラッグ可能にする
        this.input.setDraggable(gameObject, true);

        // (オプション) ドラッグ可能なオブジェクトを分かりやすくするために、枠線を表示する
        gameObject.setInteractive(); // setDraggableの前でも後でもOK
        gameObject.on('pointerover', () => { gameObject.setTint(0x00ff00); });
        gameObject.on('pointerout', () => { gameObject.clearTint(); });

        console.log(`[Editor] Object "${gameObject.name}" is now draggable.`);
    }
}

   // ★★★ 安定性のためのshutdownメソッドを実装 ★★★
    shutdown() {
        console.log("[NovelOverlayScene] shutdown されました。リソースをクリーンアップします。");
        
        // 1. ScenarioManagerのループを停止
        if (this.scenarioManager) {
            this.scenarioManager.stop();
        }
        
        // 2. このシーンで登録したイベントリスナーを解除
        this.input.off('pointerdown', this.onPointerDown, this);
        
        // 3. 生成したUIオブジェクトを破棄
        if (this.messageWindow) {
            this.messageWindow.destroy();
        }
        this.clearChoiceButtons();
        this.layer.character.destroy();
        this.layer.cg.destroy();
        this.layer.message.destroy();
    }
}