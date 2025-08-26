// src/scenes/VoxelScene.js

// Babylon.jsのクラスを変数に入れておくと、コード補完が効きやすくなります
const Scene = BABYLON.Scene;
const Engine = BABYLON.Engine;
const ArcRotateCamera = BABYLON.ArcRotateCamera;
const Vector3 = BABYLON.Vector3;
const HemisphericLight = BABYLON.HemisphericLight;
const CreateBox = BABYLON.MeshBuilder.CreateBox; // テスト用の箱を作るため

export default class VoxelScene extends Phaser.Scene {
    constructor() {
        super({ key: 'VoxelScene' });

        // Babylon.js関連のプロパティを初期化
        this.bjs_engine = null;
        this.bjs_scene = null;
    }

    create() {
        console.log("VoxelScene: create - 3Dシーンの構築を開始します。");
        const gameWidth = this.scale.width;
        const gameHeight = this.scale.height;

        // 1. Babylon.jsを描画するためのcanvas要素を、PhaserのDOM要素として追加
        //    CSSで、Phaserのcanvasの真下に配置されるように調整
        const bjsCanvas = this.add.dom(0, 0, 'canvas', {
            width: `${gameWidth}px`,
            height: `${gameHeight}px`,
            position: 'absolute',
            top: '0',
            left: '0',
            'z-index': '-1' // Phaserのcanvasより後ろに表示
        }).setOrigin(0, 0);

        // 2. Babylon.jsのEngineとSceneを初期化
        this.bjs_engine = new Engine(bjsCanvas.node, true);
        this.bjs_scene = new Scene(this.bjs_engine);
        this.bjs_scene.clearColor = new BABYLON.Color4(0.1, 0.1, 0.2, 1); // 背景色（紺色）

        // 3. カメラを作成し、操作できるようにする
        const camera = new ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 15, Vector3.Zero(), this.bjs_scene);
        camera.attachControl(bjsCanvas.node, true);

        // 4. ライト（光源）を作成
        const light = new HemisphericLight("light", new Vector3(0, 1, 0), this.bjs_scene);

        // 5. テスト用に、中央に箱を1つ配置
        const box = CreateBox("box", { size: 2 }, this.bjs_scene);

        // 6. Babylon.jsのレンダリングループを開始
        this.bjs_engine.runRenderLoop(() => {
            this.bjs_scene.render();
        });

        // 7. Phaserの画面リサイズ時に、Babylon.jsの描画サイズも追従させる
        this.scale.on('resize', this.resize, this);
        
        // --- ★ Odyssey Engineとの契約遵守（5ヶ条） ★ ---
        
        // 5ヶ条-1: createの最後にscene-readyを発行
        this.events.emit('scene-ready');
        console.log("VoxelScene: Scene is ready.");
        
        // 5ヶ条-3: ノベルパートに戻る処理 (ESCキーで戻る)
        this.input.keyboard.on('keydown-ESC', () => {
            console.log("VoxelScene: ESCキーが押されました。ノベルシーンに戻ります。");
            this.scene.get('SystemScene').events.emit('return-to-novel', { from: 'VoxelScene' });
        });
    }

    // 画面リサイズ用のヘルパーメソッド
    resize(gameSize) {
        if (this.bjs_engine) {
            this.bjs_engine.resize();
        }
    }

    // 5ヶ条-4: shutdownで後片付け
    shutdown() {
        console.log("VoxelScene: shutdown - リソースを破棄します。");
        this.scale.off('resize', this.resize, this);
        this.input.keyboard.off('keydown-ESC');

        if (this.bjs_engine) {
            this.bjs_engine.dispose();
        }
        
        super.shutdown();
    }
}