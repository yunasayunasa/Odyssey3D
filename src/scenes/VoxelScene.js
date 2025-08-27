// src/scenes/VoxelScene.js (DOM参照修正版)

// import文は不要です

export default class VoxelScene extends Phaser.Scene {
    constructor() {
        super({ key: 'VoxelScene' });

        this.bjs_engine = null;
        this.bjs_scene = null;
        // this.bjs_canvas プロパティはもう使いません
    }

    async create() {
        console.log("VoxelScene: create - 3Dシーンの構築を開始します。");

        await this.waitForBabylon();

        const BABYLON = window.BABYLON;
        const Scene = BABYLON.Scene;
        const Engine = BABYLON.Engine;
        const ArcRotateCamera = BABYLON.ArcRotateCamera;
        const Vector3 = BABYLON.Vector3;
        const HemisphericLight = BABYLON.HemisphericLight;
        const MeshBuilder = BABYLON.MeshBuilder;
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

        // ★★★ ここからが修正箇所 ★★★
        // 1. this.add.domを使わず、直接取得したHTML要素をEngineに渡す
        this.bjs_engine = new Engine(bjsCanvasNode, true);
        this.bjs_scene = new Scene(this.bjs_engine);
        this.bjs_scene.clearColor = new Color4(0.1, 0.1, 0.2, 1);

        // 2. カメラのattachControlも、直接取得したHTML要素を渡す
        const camera = new ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 15, Vector3.Zero(), this.bjs_scene);
        camera.attachControl(bjsCanvasNode, true);
        // ★★★ ここまでが修正箇所 ★★★

        const light = new HemisphericLight("light", new Vector3(0, 1, 0), this.bjs_scene);
        const box = MeshBuilder.CreateBox("box", { size: 2 }, this.bjs_scene);

        this.bjs_engine.runRenderLoop(() => {
            if (this.bjs_scene) {
                this.bjs_scene.render();
            }
        });

        this.scale.on('resize', this.resize, this);
        this.events.emit('scene-ready');
        
        this.input.keyboard.on('keydown-ESC', () => {
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