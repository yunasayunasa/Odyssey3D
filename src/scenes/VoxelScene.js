// src/scenes/VoxelScene.js (CDN URL修正版)

// ★★★ ここからが修正箇所 ★★★
// 存在する安定バージョン (2024年3月時点の最新安定版の一つ) のURLに修正
import {
    Scene,
    Engine,
    ArcRotateCamera,
    Vector3,
    HemisphericLight,
    MeshBuilder,
    Color4
} from "https://cdn.jsdelivr.net/npm/@babylonjs/core@7.8.0/index.min.js"; 
// Loaderも、対応するバージョンからimportする
import { SceneLoader } from "https://cdn.jsdelivr.net/npm/@babylonjs/loaders@7.8.0/index.min.js";
// ★★★ ここまでが修正箇所 ★★★


export default class VoxelScene extends Phaser.Scene {
    constructor() {
        super({ key: 'VoxelScene' });

        this.bjs_engine = null;
        this.bjs_scene = null;
    }

    create() {
        console.log("VoxelScene: create - 3Dシーンの構築を開始します。");
        const gameWidth = this.scale.width;
        const gameHeight = this.scale.height;

        const bjsCanvas = this.add.dom(0, 0, 'canvas', {
            width: `${gameWidth}px`,
            height: `${gameHeight}px`,
            position: 'absolute',
            top: '0',
            left: '0',
            'z-index': '-1'
        }).setOrigin(0, 0);

        this.bjs_engine = new Engine(bjsCanvas.node, true);
        this.bjs_scene = new Scene(this.bjs_engine);
        this.bjs_scene.clearColor = new Color4(0.1, 0.1, 0.2, 1);

        const camera = new ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 15, Vector3.Zero(), this.bjs_scene);
        camera.attachControl(bjsCanvas.node, true);

        const light = new HemisphericLight("light", new Vector3(0, 1, 0), this.bjs_scene);
        const box = MeshBuilder.CreateBox("box", { size: 2 }, this.bjs_scene);

        this.bjs_engine.runRenderLoop(() => {
            if (this.bjs_scene) {
                this.bjs_scene.render();
            }
        });

        this.scale.on('resize', this.resize, this);
        
        this.events.emit('scene-ready');
        console.log("VoxelScene: Scene is ready.");
        
        this.input.keyboard.on('keydown-ESC', () => {
            console.log("VoxelScene: ESCキーが押されました。ノベルシーンに戻ります。");
            this.scene.get('SystemScene').events.emit('return-to-novel', { from: 'VoxelScene' });
        });
    }

    resize(gameSize) {
        if (this.bjs_engine) {
            this.bjs_engine.resize();
        }
    }

    shutdown() {
        console.log("VoxelScene: shutdown - リソースを破棄します。");
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
