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
    
    // VoxelScene.js -> create()メソッドのforループ内

for (const obj of stageData.objects) {
    const modelKey = obj.key;
    const modelPath = assetDefine.models[modelKey];
    if (!modelPath) { continue; }
    
    try {
        const result = await SceneLoader.ImportMeshAsync(null, modelPath.rootUrl, modelPath.fileName, this.bjs_scene);
        
        // ★★★ ここからが最終・確定の修正箇所 ★★★
        
        // ロードされたモデルの親ノードを取得
        const rootNode = result.meshes[0];
        rootNode.name = obj.name;
        
        // 親ノードのすべての子メッシュを取得
        const childMeshes = rootNode.getChildMeshes();

        childMeshes.forEach(childMesh => {
            // 1. 子メッシュを親から切り離す
            childMesh.setParent(null);
            
            // 2. 子メッシュの位置とスケールを、JSONで定義された値に直接設定する
            childMesh.position = new Vector3(obj.position.x, obj.position.y, obj.position.z);
            if (obj.scale) {
                // ボクセルモデルは回転・拡縮の中心がずれることがあるため、BoundingBoxから正確なサイズを計算する
                const boundingBox = childMesh.getBoundingInfo().boundingBox;
                const size = boundingBox.maximumWorld.subtract(boundingBox.minimumWorld);
                childMesh.scaling.x *= obj.scale.x / size.x;
                childMesh.scaling.y *= obj.scale.y / size.y;
                childMesh.scaling.z *= obj.scale.z / size.z;
            }

            // 3. 独立した子メッシュに物理ボディを設定する
            if (obj.key === 'ground_basic') {
                childMesh.physicsImpostor = new PhysicsImpostor(childMesh, PhysicsImpostor.BoxImpostor, { mass: 0, friction: 0.5 }, this.bjs_scene);
            } else if (obj.key === 'player_borntest') {
                childMesh.physicsImpostor = new PhysicsImpostor(childMesh, PhysicsImpostor.BoxImpostor, { mass: 1, friction: 0.5 }, this.bjs_scene);
                
                // ★ プレイヤーオブジェクトとして、子メッシュそのものを保持する
                this.player = childMesh; 
                
                childMesh.physicsImpostor.physicsBody.angularDamping = 1.0;
            }
        });

        // 4. アニメーションは、独立させた子メッシュに紐付け直す必要がある場合がある
        //    今回はまず物理を優先するため、アニメーション再生は一旦コメントアウト
        // if (result.animationGroups.length > 0) {
        //     // AnimationGroupのターゲットを新しい独立メッシュに変更する必要がある
        //     // const animationGroup = result.animationGroups[0].clone();
        //     // animationGroup.addTargetedAnimation(animationGroup.targetedAnimations[0].animation, childMeshes[0]);
        //     // animationGroup.play(true);
        // }

        // 5. 使い終わった親ノードは破棄する
        rootNode.dispose();
        
        console.log(`モデル「${obj.name}」を独立させて配置し、物理ボディを設定しました。`);
        
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
    playerJump() {
    if (!this.player) return;
    const playerBody = this.player.getChildMeshes()[0].physicsImpostor; // ★ 子メッシュのImpostorを取得
    if (!playerBody) return;

    const velocity = playerBody.getLinearVelocity();
    if (Math.abs(velocity.y) < 0.1) {
        playerBody.applyImpulse(new BABYLON.Vector3(0, 15, 0), this.player.getAbsolutePosition());
    }
}

update(time, delta) {
    if (!this.player) return;
    const playerBody = this.player.getChildMeshes()[0].physicsImpostor; // ★ 子メッシュのImpostorを取得
    if (!playerBody) return;

    const speed = 5;
    const velocity = playerBody.getLinearVelocity();
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
    
    playerBody.setLinearVelocity(newVelocity);
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
