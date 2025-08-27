// src/scenes/VoxelScene.js (JSONキャッシュ利用・最終版)

// Babylon.jsのクラスをグローバルから取得
const BABYLON = window.BABYLON;

export default class VoxelScene extends Phaser.Scene {
    constructor() {
        super({ key: 'VoxelScene' });
        this.bjs_engine = null;
        this.bjs_scene = null;
        this.modelKey = 'stage_01'; // デフォルトで表示するモデルのキー
    }
    
    // シナリオからデータを受け取る
    init(data) {
         console.log("VoxelScene init() received data:", data);
        // [jump]タグのparamsで指定されたmodelKeyを受け取る
        if (data && data.modelKey) {
            this.modelKey = data.modelKey;
        }
          console.log(`VoxelScene: Target model key is set to: ${this.modelKey}`);
    }

    async create() {
        console.log("VoxelScene: create - 3Dシーンの構築を開始します。");
        await this.waitForBabylon();

        // Babylon.jsのクラスを変数に入れる
        const Scene = BABYLON.Scene;
        const Engine = BABYLON.Engine;
        const SceneLoader = BABYLON.SceneLoader;
        const ArcRotateCamera = BABYLON.ArcRotateCamera;
        const Vector3 = BABYLON.Vector3;
        const HemisphericLight = BABYLON.HemisphericLight;
        const Color4 = BABYLON.Color4;

        // --- レイヤー管理 ---
        const phaserContainer = document.getElementById('phaser-container');
        const bjsCanvasNode = document.getElementById('babylon-canvas');
        if (!bjsCanvasNode || !phaserContainer) {
            console.error("HTML要素が見つかりません。index.htmlを確認してください。");
            return;
        }
        phaserContainer.style.display = 'none';
        bjsCanvasNode.style.display = 'block';
        
        // --- Babylon.jsの初期化 ---
        this.bjs_engine = new Engine(bjsCanvasNode, true);
        this.bjs_scene = new Scene(this.bjs_engine);
        this.bjs_scene.clearColor = new Color4(0.1, 0.1, 0.2, 1);

        const camera = new ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 15, Vector3.Zero(), this.bjs_scene);
        camera.attachControl(bjsCanvasNode, true);
        const light = new HemisphericLight("light", new Vector3(0, 1, 0), this.bjs_scene);

        // ★★★ ここからが修正箇所 ★★★

        // 1. PhaserのJSONキャッシュからアセット定義を取得
        const assetDefine = this.cache.json.get('asset_define');
        
        // 2. キーを使ってモデルのパス情報を取得
        let modelPath = null;
        if (assetDefine && assetDefine.models && assetDefine.models[this.modelKey]) {
            modelPath = assetDefine.models[this.modelKey];
        } else {
            console.error(`VoxelScene: モデルキー[${this.modelKey}]がasset_define.jsonに見つかりません。`);
        }

        // 3. パス情報を使ってモデルをロード
        if (modelPath) {
            console.log(`VoxelScene: モデル[${this.modelKey}]のロードを開始します...`);

            try {
                const result = await SceneLoader.ImportMeshAsync("", modelPath.rootUrl, modelPath.fileName, this.bjs_scene);
                console.log("VoxelScene: モデルのロードに成功しました！", result);

                const model = result.meshes[0];
                model.scaling.scaleInPlace(1.0);
                model.position = new BABYLON.Vector3(0, 0, 0);

                if (result.animationGroups && result.animationGroups.length > 0) {
                    result.animationGroups[0].play(true);
                    console.log(`VoxelScene: アニメーション「${result.animationGroups[0].name}」を再生します。`);
                }

            } catch (error) {
                console.error(`VoxelScene: モデル[${this.modelKey}]のロード中にエラーが発生しました。`, error);
                this.add.text(100, 100, "Model Load Error!", { color: "red", fontSize: "32px" });
            }
        }
        
        // ★★★ ここまでが修正箇所 ★★★

        this.bjs_engine.runRenderLoop(() => {
            if (this.bjs_scene) this.bjs_scene.render();
        });

        this.scale.on('resize', this.resize, this);
        this.events.emit('scene-ready');
        
        this.input.keyboard.on('keydown-ESC', () => {
            this.scene.get('SystemScene').events.emit('return-to-novel', { from: 'VoxelScene' });
        });
    }

    waitForBabylon() {
        return new Promise(resolve => {
            const check = () => {
                if (window.BABYLON) {
                    console.log("Babylon.js is loaded.");
                    resolve();
                } else {
                    setTimeout(check, 100); 
                }
            };
            check();
        });
    }

    resize(gameSize) {
        if (this.bjs_engine) this.bjs_engine.resize();
    }
   
    shutdown() {
        console.log("VoxelScene: shutdown");
        const phaserContainer = document.getElementById('phaser-container');
        const bjsCanvasNode = document.getElementById('babylon-canvas');
        if (bjsCanvasNode) bjsCanvasNode.style.display = 'none';
        if (phaserContainer) phaserContainer.style.display = 'block';

        this.scale.off('resize', this.resize, this);
        this.input.keyboard.off('keydown-ESC');

        if (this.bjs_engine) {
            this.bjs_engine.stopRenderLoop();
            this.bjs_engine.dispose();
            this.bjs_engine = null;
        }
        this.bjs_scene = null;
        
        super.shutdown();
    }
}