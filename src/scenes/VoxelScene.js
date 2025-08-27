// src/scenes/VoxelScene.js (ハイブリッド・安定版)

// このファイルの先頭にimport文は不要です

export default class VoxelScene extends Phaser.Scene {
    constructor() {
        super({ key: 'VoxelScene' });

        // Babylon.js関連のプロパティを初期化
        this.bjs_engine = null;
        this.bjs_scene = null;
        this.bjs_canvas = null;
    }

    // createメソッドを async に変更します
    async create() {
        console.log("VoxelScene: create - 3Dシーンの構築を開始します。");

        // ★★★ Babylon.jsがグローバルにロードされるのを待機 ★★★
        await this.waitForBabylon();

        // ここまで来れば、window.BABYLONが確実に存在します
        const BABYLON = window.BABYLON;

        // Babylon.jsのクラスを変数に入れておくと、コードが読みやすくなります
        const Scene = BABYLON.Scene;
        const Engine = BABYLON.Engine;
        const ArcRotateCamera = BABYLON.ArcRotateCamera;
        const Vector3 = BABYLON.Vector3;
        const HemisphericLight = BABYLON.HemisphericLight;
        const MeshBuilder = BABYLON.MeshBuilder;
        const Color4 = BABYLON.Color4;

        // --- ここからがBabylon.jsの初期化処理 ---

        const gameWidth = this.scale.width;
        const gameHeight = this.scale.height;

        // 1. Babylon.jsを描画するためのcanvas要素を、PhaserのDOM要素として追加
       // 1. HTMLからBabylon.js用のcanvasを取得
       // ★★★ レイヤー管理 ★★★
        const phaserContainer = document.getElementById('phaser-container');
        const bjsCanvasNode = document.getElementById('babylon-canvas');

        // Phaserの舞台を隠し、Babylonの舞台を見せる
        phaserContainer.style.display = 'none';
        bjsCanvasNode.style.display = 'block';
        if (!bjsCanvasNode) {
            console.error("babylon-canvasが見つかりません！");
            return;
        }
        
        // canvasを表示状態にする
        bjsCanvasNode.style.display = 'block';

        // 2. Babylon.jsのEngineとSceneを初期化
        this.bjs_engine = new Engine(bjsCanvasNode, true);
        this.bjs_scene = new Scene(this.bjs_engine);

        // 3. カメラを作成し、操作できるようにする
        const camera = new ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 15, Vector3.Zero(), this.bjs_scene);
        camera.attachControl(this.bjs_canvas.node, true);

        // 4. ライト（光源）を作成
        const light = new HemisphericLight("light", new Vector3(0, 1, 0), this.bjs_scene);

        // 5. テスト用に、中央に箱を1つ配置
        const box = MeshBuilder.CreateBox("box", { size: 2 }, this.bjs_scene);

        // 6. Babylon.jsのレンダリングループを開始
        this.bjs_engine.runRenderLoop(() => {
            if (this.bjs_scene) {
                this.bjs_scene.render();
            }
        });

        // 7. Phaserの画面リサイズ時に、Babylon.jsの描画サイズも追従させる
        this.scale.on('resize', this.resize, this);
        
        // --- ★ Odyssey Engineとの契約遵守（5ヶ条） ★ ---
        
        this.events.emit('scene-ready');
        console.log("VoxelScene: Scene is ready.");
        
        this.input.keyboard.on('keydown-ESC', () => {
            console.log("VoxelScene: ESCキーが押されました。ノベルシーンに戻ります。");
            this.scene.get('SystemScene').events.emit('return-to-novel', { from: 'VoxelScene' });
        });
    }

    /**
     * Babylon.jsがロードされるのを待つためのヘルパー関数
     * @returns {Promise<void>}
     */
    waitForBabylon() {
        return new Promise(resolve => {
            const check = () => {
                if (window.BABYLON) {
                    console.log("Babylon.js is loaded.");
                    resolve();
                } else {
                    // 100ミリ秒後にもう一度チェック
                    setTimeout(check, 100); 
                }
            };
            check();
        });
    }

    resize(gameSize) {
        if (this.bjs_engine) {
            this.bjs_engine.resize();
        }
    }

    shutdown() {
        console.log("VoxelScene: shutdown - リソースを破棄します。");
           // ★★★ レイヤー管理 ★★★
        const phaserContainer = document.getElementById('phaser-container');
        const bjsCanvasNode = document.getElementById('babylon-canvas');
        
        // Babylonの舞台を隠し、Phaserの舞台を元に戻す
        if (bjsCanvasNode) bjsCanvasNode.style.display = 'none';
        if (phaserContainer) phaserContainer.style.display = 'block';
        if (bjsCanvasNode) {
            bjsCanvasNode.style.display = 'none';
        }
        // イベントリスナーを解除
        this.scale.off('resize', this.resize, this);
        this.input.keyboard.off('keydown-ESC');

        // Babylon.jsのエンジンとシーンを安全に破棄
        if (this.bjs_engine) {
            this.bjs_engine.stopRenderLoop();
            this.bjs_engine.dispose();
            this.bjs_engine = null;
        }
        this.bjs_scene = null;

        // DOM要素を破棄
        if (this.bjs_canvas) {
            this.bjs_canvas.destroy();
            this.bjs_canvas = null;
        }
        
        super.shutdown();
    }
}
