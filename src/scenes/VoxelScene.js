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
 mainMesh.rotationQuaternion = BABYLON.Quaternion.Identity();
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

    // --- レイキャストによる接地判定 ---
    
    // 1. キャラクターのバウンディングボックス（境界箱）を取得
    const boundingBox = this.player.getBoundingInfo().boundingBox;
    
    // 2. キャラクターの足元（中心点から、高さの半分だけ下）の座標を計算
    const rayOrigin = this.player.getAbsolutePosition().clone(); // 必ずclone()して元の座標を壊さない
    rayOrigin.y -= boundingBox.extendSize.y;

    // 3. 足元から、ごくわずか（0.3ユニット分）下に向けてレイを飛ばす
    const ray = new BABYLON.Ray(rayOrigin, new BABYLON.Vector3(0, -1, 0), 0.3);

    // デバッグ用にレイを可視化する（開発中だけ有効にすると便利）
    // const rayHelper = new BABYLON.RayHelper(ray);
    // rayHelper.show(this.bjs_scene);

    // 4. "ground"という名前のメッシュとだけ衝突判定
    const hit = this.bjs_scene.pickWithRay(ray, (mesh) => {
        return mesh.name === "ground";
    });

    // 5. レイが地面に当たった場合のみジャンプを許可
    if (hit.hit) {
        // ジャンプする前に、物理ボディが眠っている（スリープ状態）かもしれないので叩き起こす
        this.player.physicsImpostor.wakeUp();
        
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
    const cameraForward = this.bjs_scene.activeCamera.getForwardRay().direction;
    const cameraRight = BABYLON.Vector3.Cross(BABYLON.Vector3.Up(), cameraForward).normalize();
    cameraForward.y = 0;
    cameraRight.y = 0;

    let moveDirection = BABYLON.Vector3.Zero();
    if (this.cursors.left.isDown)  moveDirection.addInPlace(cameraRight.scale(-1));
    if (this.cursors.right.isDown) moveDirection.addInPlace(cameraRight);
    if (this.cursors.up.isDown)    moveDirection.addInPlace(cameraForward);
    if (this.cursors.down.isDown)  moveDirection.addInPlace(cameraForward.scale(-1));

    // Y方向の速度は物理エンジンに任せる
    const newVelocity = new BABYLON.Vector3(0, velocity.y, 0);

    if (moveDirection.length() > 0.1) {
        moveDirection.normalize();
        
        // ★★★ ここからが修正箇所 ★★★

        // 1. 移動方向から目標となる回転（クォータニオン）を計算
        //    これはBabylon.jsの世界の計算
        const targetRotationQuaternion = BABYLON.Quaternion.FromLookDirectionLH(moveDirection, BABYLON.Vector3.Up());
        
        // 2. キャラクターの「見た目」の回転を、目標に向かって滑らかに補間
        //    これもBabylon.jsの世界の計算
        const currentRotationQuaternion = this.player.rotationQuaternion || BABYLON.Quaternion.Identity();
        const slerpedQuaternion = BABYLON.Quaternion.Slerp(currentRotationQuaternion, targetRotationQuaternion, 0.2);

        // 3. 計算した回転を、キャラクターの「見た目」に適用
        this.player.rotationQuaternion = slerpedQuaternion;

        // ★★★ ここまでが修正箇所 ★★★

        // 4. 移動速度を計算し、物理ボディに適用
        const finalMove = moveDirection.scale(speed);
        newVelocity.x = finalMove.x;
        newVelocity.z = finalMove.z;

    } else {
        newVelocity.x = 0;
        newVelocity.z = 0;
    }
    
    // 最終的な「速度」だけを物理ボディに設定する
    this.player.physicsImpostor.setLinearVelocity(newVelocity);

    // ★ 物理ボディの回転は、常に「見た目」の回転と同期させる
    this.player.physicsImpostor.setAngularVelocity(BABYLON.Vector3.Zero()); // まず回転速度をリセット
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
