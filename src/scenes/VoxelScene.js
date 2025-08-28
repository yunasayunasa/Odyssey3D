// src/scenes/VoxelScene.js (物理演算と操作を追加した改良版)

// Babylon.jsのクラスをグローバルから取得
const BABYLON = window.BABYLON;
const CANNON = window.CANNON; // ★★★ Cannon.jsもグローバルから取得 ★★★

export default class VoxelScene extends Phaser.Scene {
    constructor() {
        super({ key: 'VoxelScene' });
        this.bjs_engine = null;
        this.bjs_scene = null;
        this.stageKey = 'stage_01_tutorial';
        
        // ★★★ 物理演算と操作用のプロパティを追加 ★★★
        this.player = null;
        this.cursors = null;
    }
    
    init(data) {
        if (data && data.stageKey) {
            this.stageKey = data.stageKey;
        }
    }

 // VoxelScene.js -> create()メソッド

// VoxelScene.js -> create()メソッド (最終・完全版)

// VoxelScene.js -> create()メソッド (最終・確定・安定版)

async create() {
    console.log("VoxelScene: create - 3Dシーンの構築を開始します。");
    await this.waitForBabylon();

    const BABYLON = window.BABYLON, CANNON = window.CANNON;
    const Scene = BABYLON.Scene, Engine = BABYLON.Engine, SceneLoader = BABYLON.SceneLoader;
    const ArcRotateCamera = BABYLON.ArcRotateCamera, Vector3 = BABYLON.Vector3;
    const HemisphericLight = BABYLON.HemisphericLight, Color4 = BABYLON.Color4;
    const CannonJSPlugin = BABYLON.CannonJSPlugin, PhysicsImpostor = BABYLON.PhysicsImpostor;

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
    if (!stageData) { return; }

    console.log(`VoxelScene: ステージ「${stageData.name}」のモデルをロードします...`);
    
    // ★★★ ここからが修正されたループ ★★★
    for (const obj of stageData.objects) {
        // ★ modelKeyとmodelPathの定義をループの内側に戻す
        const modelKey = obj.key;
        const modelPath = assetDefine.models[modelKey];
        if (!modelPath) {
            console.warn(`モデルキー[${modelKey}]が見つかりません。`);
            continue;
        }
        
        try {
            const result = await SceneLoader.ImportMeshAsync(null, modelPath.rootUrl, modelPath.fileName, this.bjs_scene);
            const rootNode = result.meshes[0];
            const childMeshes = rootNode.getChildMeshes();
            
            rootNode.name = obj.name;
            rootNode.position = new Vector3(obj.position.x, obj.position.y, obj.position.z);
            if (obj.scale) {
                rootNode.scaling = new Vector3(obj.scale.x, obj.scale.y, obj.scale.z);
            }

            if (childMeshes.length > 0) {
                const mainMesh = childMeshes[0]; // 代表となる子メッシュ
                
                const impostorParams = { 
                    mass: (obj.key === 'player_borntest') ? 1 : 0, 
                    friction: 0.5,
                    restitution: 0.0
                };
                
                // ★ 親ノードに、子メッシュと同じ大きさのコライダーを設定
                //    これにより、Babylon.jsの警告を回避しつつ、正しい大きさの当たり判定を持つ
                rootNode.physicsImpostor = new PhysicsImpostor(mainMesh, PhysicsImpostor.BoxImpostor, impostorParams, this.bjs_scene);

                if (obj.key === 'player_borntest') {
                    this.player = rootNode;
                    rootNode.physicsImpostor.physicsBody.angularDamping = 1.0;
                }
            }
            
            if (result.animationGroups.length > 0) result.animationGroups[0].play(true);

        } catch (error) {
            console.error(`モデル[${modelKey}]のロードまたは設定中にエラーが発生しました。`, error);
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
                // ★★★ CANNONもロードされているかチェック ★★★
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

    // ★★★ メソッドを新規追加 ★★★
    // update と playerJump (最終版)
playerJump() {
    if (!this.player || !this.player.physicsImpostor) return;
    const velocity = this.player.physicsImpostor.getLinearVelocity();
    if (Math.abs(velocity.y) < 0.1) {
        this.player.physicsImpostor.applyImpulse(
            new BABYLON.Vector3(0, 15, 0),
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
        newVelocity.x = 0;
    }
    
    this.player.physicsImpostor.setLinearVelocity(newVelocity);
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
