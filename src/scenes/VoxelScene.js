// src/scenes/VoxelScene.js (最終・完全版)

// Babylon.jsのクラスをグローバルから取得
const BABYLON = window.BABYLON;
const CANNON = window.CANNON; // Cannon.jsもグローバルから取得

export default class VoxelScene extends Phaser.Scene {
    constructor() {
        super({ key: 'VoxelScene' });

        // プロパティを初期化
        this.bjs_engine = null;
        this.bjs_scene = null;
        this.stageKey = 'stage_01_tutorial'; // デフォルトステージキー
        this.player = null;
        this.cursors = null;
    }
    
    // シナリオからデータを受け取る
    init(data) {
        if (data && data.stageKey) {
            this.stageKey = data.stageKey;
        }
    }

    async create() {
        console.log("VoxelScene: create - 3Dシーンの構築を開始します。");
        await this.waitForBabylon();

        // Babylon.jsの主要クラスを変数に入れる
        const Scene = BABYLON.Scene;
        const Engine = BABYLON.Engine;
        const SceneLoader = BABYLON.SceneLoader;
        const ArcRotateCamera = BABYLON.ArcRotateCamera;
        const Vector3 = BABYLON.Vector3;
        const HemisphericLight = BABYLON.HemisphericLight;
        const Color4 = BABYLON.Color4;
        const CannonJSPlugin = BABYLON.CannonJSPlugin;
        const PhysicsImpostor = BABYLON.PhysicsImpostor;

        // --- レイヤー管理 ---
        const phaserContainer = document.getElementById('phaser-container');
        const bjsCanvasNode = document.getElementById('babylon-canvas');
        phaserContainer.style.display = 'none';
        bjsCanvasNode.style.display = 'block';
        
        // --- Babylon.jsの初期化 ---
        this.bjs_engine = new Engine(bjsCanvasNode, true);
        this.bjs_scene = new Scene(this.bjs_engine);
        this.bjs_scene.clearColor = new Color4(0.1, 0.1, 0.2, 1);

        const camera = new ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 30, new Vector3(0, 5, 0));
        camera.attachControl(bjsCanvasNode, true);
        const light = new HemisphericLight("light", new Vector3(0, 1, 0), this.bjs_scene);

        // --- 物理エンジンのセットアップ ---
        const cannonPlugin = new CannonJSPlugin(true, 10, CANNON);
        this.bjs_scene.enablePhysics(new BABYLON.Vector3(0, -9.81, 0), cannonPlugin);

        // --- ステージとモデルのロード ---
        const assetDefine = this.cache.json.get('asset_define');
        const stageData = assetDefine.stages[this.stageKey];
        if (!stageData) {
            console.error(`VoxelScene: ステージキー[${this.stageKey}]がasset_define.jsonに見つかりません。`);
            return;
        }

        console.log(`VoxelScene: ステージ「${stageData.name}」のモデルをロードします...`);
        for (const obj of stageData.objects) {
            const modelKey = obj.key;
            const modelPath = assetDefine.models[modelKey];
            if (!modelPath) {
                console.warn(`モデルキー[${modelKey}]が見つかりません。スキップします。`);
                continue;
            }
            
            try {
                const result = await SceneLoader.ImportMeshAsync(null, modelPath.rootUrl, modelPath.fileName, this.bjs_scene);
                const model = result.meshes[0];
                model.name = obj.name;

                model.position = new Vector3(obj.position.x, obj.position.y, obj.position.z);
                if (obj.scale) {
                    model.scaling = new Vector3(obj.scale.x, obj.scale.y, obj.scale.z);
                }
                
                // 物理ボディ(Impostor)の追加
                if (obj.key === 'ground_basic') {
                    model.physicsImpostor = new PhysicsImpostor(model, PhysicsImpostor.BoxImpostor, { mass: 0, friction: 0.5, restitution: 0.1 }, this.bjs_scene);
                } else if (obj.key === 'player_borntest') {
                    model.physicsImpostor = new PhysicsImpostor(model, PhysicsImpostor.CapsuleImpostor, { mass: 1, friction: 0.5, restitution: 0.0 }, this.bjs_scene);
                    model.physicsImpostor.physicsBody.angularDamping = 1.0;
                    this.player = model; 
                }

                if (result.animationGroups.length > 0) {
                    result.animationGroups[0].play(true);
                }
                console.log(`モデル「${model.name}」を配置し、物理ボディを設定しました。`);

            } catch (error) {
                console.error(`モデル[${modelKey}]のロード中にエラーが発生しました。`, error);
            }
        }

        // --- 入力設定 ---
        this.cursors = this.input.keyboard.createCursorKeys();
        this.input.keyboard.on('keydown-SPACE', this.playerJump, this);

        // --- レンダリングループ開始 ---
        this.bjs_engine.runRenderLoop(() => {
            if (this.bjs_scene) this.bjs_scene.render();
        });

        // --- Odyssey Engineとの契約遵守 ---
        this.scale.on('resize', this.resize, this);
        this.events.emit('scene-ready');
        this.input.keyboard.on('keydown-ESC', () => {
            this.scene.get('SystemScene').events.emit('return-to-novel', { from: 'VoxelScene' });
        });
    }

    waitForBabylon() {
        return new Promise(resolve => {
            const check = () => {
                // CANNONもロードされているかチェック
                if (window.BABYLON && window.CANNON) {
                    console.log("Babylon.js and Cannon.js are loaded.");
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
    
    playerJump() {
        if (!this.player || !this.player.physicsImpostor) return;
        const velocity = this.player.physicsImpostor.getLinearVelocity();
        if (Math.abs(velocity.y) < 0.1) { // 判定を少し甘く
            this.player.physicsImpostor.applyImpulse(
                new BABYLON.Vector3(0, 15, 0), // ジャンプ力を少し上げる
                this.player.getAbsolutePosition()
            );
        }
    }
    
    update(time, delta) {
        if (!this.player || !this.player.physicsImpostor) return;

        const speed = 5;
        const velocity = this.player.physicsImpostor.getLinearVelocity();
        const newVelocity = new BABYLON.Vector3(0, velocity.y, 0);

        if (this.cursors.left.isDown) {
            newVelocity.x = -speed;
            this.player.rotation.y = Math.PI;
        } else if (this.cursors.right.isDown) {
            newVelocity.x = speed;
            this.player.rotation.y = 0;
        } else {
            // X方向の速度を減速させる (物理エンジンがやってくれるので不要な場合も)
            // newVelocity.x = velocity.x * 0.95;
        }

        this.player.physicsImpostor.setLinearVelocity(newVelocity);

        // ★★★ 物理エンジンの更新と3Dシーンの描画は Babylon.js のレンダリングループに任せるので、
        // Phaserのupdateで直接何かを描画する必要はない ★★★
    }
    
    shutdown() {
        console.log("VoxelScene: shutdown");
        const phaserContainer = document.getElementById('phaser-container');
        const bjsCanvasNode = document.getElementById('babylon-canvas');
        if (bjsCanvasNode) bjsCanvasNode.style.display = 'none';
        if (phaserContainer) phaserContainer.style.display = 'block';

        this.scale.off('resize', this.resize, this);
        this.input.keyboard.off('keydown-ESC');
        this.input.keyboard.off('keydown-SPACE');

        if (this.bjs_engine) {
            this.bjs_engine.stopRenderLoop();
            this.bjs_engine.dispose();
            this.bjs_engine = null;
        }
        this.bjs_scene = null;
        this.player = null;
        this.cursors = null;
        
        super.shutdown();
    }
}