// src/scenes/VoxelScene.js

// Babylon.jsのクラスをグローバルから取得
const BABYLON = window.BABYLON;
const CANNON = window.CANNON;

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
    
    init(data) {
        if (data && data.stageKey) {
            this.stageKey = data.stageKey;
        }
    }

    async create() {
        console.log("VoxelScene: create - 3Dシーンの構築を開始します。");
        await this.waitForBabylon();

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
        camera.attachControl(bjsCanvasNode, true, false);
        camera.inputs.remove(camera.inputs.attached.keyboard);
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
                console.warn(`モデルキー[${modelKey}]が見つかりません。`);
                continue;
            }
            
            try {
            const result = await SceneLoader.ImportMeshAsync(null, modelPath.rootUrl, modelPath.fileName, this.bjs_scene);
            const rootNode = result.meshes[0];
            const childMeshes = rootNode.getChildMeshes();
            if (childMeshes.length === 0) {
                rootNode.dispose();
                continue;
            }
            const mainMesh = childMeshes[0];

            // 1. 親から子メッシュを切り離し、独立させる
            mainMesh.setParent(null);
            
            // 2. 独立した子メッシュにプロパティを設定
            mainMesh.name = obj.name;
            mainMesh.position = new Vector3(obj.position.x, obj.position.y, obj.position.z);
            if (obj.scale) {
                mainMesh.scaling = new Vector3(obj.scale.x, obj.scale.y, obj.scale.z);
            }

            // 3. 独立したメッシュに物理ボディを設定
            if (obj.key === 'ground_basic') {
                mainMesh.physicsImpostor = new PhysicsImpostor(mainMesh, PhysicsImpostor.BoxImpostor, { mass: 0, friction: 0.5 }, this.bjs_scene);
            } else if (obj.key === 'player_borntest') {
                mainMesh.physicsImpostor = new PhysicsImpostor(mainMesh, PhysicsImpostor.BoxImpostor, { mass: 1, friction: 0.5 }, this.bjs_scene);
                this.player = mainMesh; 
                this.player.physicsImpostor.physicsBody.angularDamping = 1.0;
            }
            
            // 4. アニメーションを独立メッシュに紐付け直し
            if (result.animationGroups.length > 0) {
                const animationGroup = result.animationGroups[0];
                animationGroup.stop();
                const targetedAnimation = animationGroup.targetedAnimations[0];
                if (targetedAnimation) {
                    animationGroup.removeTargetedAnimation(targetedAnimation.animation);
                    animationGroup.addTargetedAnimation(targetedAnimation.animation, mainMesh);
                }
                animationGroup.play(true);
            }

            // 5. 役目を終えた親ノード等は破棄
            rootNode.dispose();
            for (let i = 1; i < childMeshes.length; i++) {
                childMeshes[i].dispose();
            }
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

    // Raycastによる正確な接地判定
    const origin = this.player.position;
    const ray = new BABYLON.Ray(origin, new BABYLON.Vector3(0, -1, 0), this.player.getBoundingInfo().boundingBox.extendSize.y + 0.1);
    const hit = this.bjs_scene.pickWithRay(ray);

    // レイが地面（または何か）に当たった場合のみジャンプを許可
    if (hit.hit) {
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
    
    // Y方向の速度は物理エンジンに任せる
    const newVelocity = new BABYLON.Vector3(0, velocity.y, 0);

    // ★ 左右の移動ベクトル
    if (this.cursors.left.isDown) {
        newVelocity.x = -speed;
    } else if (this.cursors.right.isDown) {
        newVelocity.x = speed;
    }
    // ★ 前後の移動ベクトル
    if (this.cursors.up.isDown) {
        newVelocity.z = speed;
    } else if (this.cursors.down.isDown) {
        newVelocity.z = -speed;
    }

    // ★★★ 移動方向への自動的な方向転換 ★★★
    // 物理ボディの速度がゼロでない（＝動いている）場合
    if (Math.abs(newVelocity.x) > 0.1 || Math.abs(newVelocity.z) > 0.1) {
        // 移動ベクトル（newVelocity）の方向を向くように、キャラクターの向き（rotation.y）を計算
        const moveDirection = new BABYLON.Vector3(newVelocity.x, 0, newVelocity.z).normalize();
        // ★ atan2の引数は(x, z)
        const targetRotation = Math.atan2(moveDirection.x, moveDirection.z);
        
        // 現在の回転角度から目標の回転角度へ、滑らかに補間 (Lerp)
        // (これにより、向きがパッと変わるのではなく、くるっと滑らかに変わる)
        this.player.rotation.y = BABYLON.Scalar.Lerp(this.player.rotation.y, targetRotation, 0.2);
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
