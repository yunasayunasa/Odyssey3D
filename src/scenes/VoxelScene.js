// src/scenes/VoxelScene.js (複数モデル表示版)

// Babylon.jsのクラスをグローバルから取得
const BABYLON = window.BABYLON;
const CannonJSPlugin = BABYLON.CannonJSPlugin; // ★ Cannon.jsプラグインを追加
export default class VoxelScene extends Phaser.Scene {
    constructor() {
        super({ key: 'VoxelScene' });
        this.bjs_engine = null;
        this.bjs_scene = null;
        this.stageKey = 'stage_01_tutorial'; // デフォルトで読み込むステージのキー
         this.player = null; // ★ プレイヤーオブジェクトを保持するプロパティ
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
        phaserContainer.style.display = 'none';
        bjsCanvasNode.style.display = 'block';
        
        // --- Babylon.jsの初期化 ---
        this.bjs_engine = new Engine(bjsCanvasNode, true);
        this.bjs_scene = new Scene(this.bjs_engine);
        this.bjs_scene.clearColor = new Color4(0.1, 0.1, 0.2, 1);

        const camera = new ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 20, new Vector3(0, 5, 0));
        camera.attachControl(bjsCanvasNode, true);
        const light = new HemisphericLight("light", new Vector3(0, 1, 0), this.bjs_scene);

        // --- ★★★ ここからが修正箇所 ★★★ ---

        // 1. PhaserのJSONキャッシュからアセット定義を取得
        const assetDefine = this.cache.json.get('asset_define');
        
        // 2. キーを使ってステージの定義情報を取得
        const stageData = assetDefine.stages[this.stageKey];
        if (!stageData) {
            console.error(`VoxelScene: ステージキー[${this.stageKey}]がasset_define.jsonに見つかりません。`);
            return;
        }
   const cannonPlugin = new CannonJSPlugin(true, 10, window.CANNON);
        this.bjs_scene.enablePhysics(new BABYLON.Vector3(0, -9.81, 0), cannonPlugin);
        // 3. ステージのオブジェクト定義をループで処理し、すべてのモデルをロード
        console.log(`VoxelScene: ステージ「${stageData.name}」のモデルをロードします...`);
        for (const obj of stageData.objects) {
            const modelKey = obj.key;
            const modelPath = assetDefine.models[modelKey];
            if (!modelPath) {
                console.warn(`モデルキー[${modelKey}]が見つかりません。スキップします。`);
                continue;
            }
            
            try {
                // モデルを非同期でロード
                const result = await SceneLoader.ImportMeshAsync(null, modelPath.rootUrl, modelPath.fileName, this.bjs_scene);
                
                const model = result.meshes[0];
                model.name = obj.name; // JSONで定義した名前を付ける

                // JSONで定義された位置とスケールを適用
                model.position = new Vector3(obj.position.x, obj.position.y, obj.position.z);
                if (obj.scale) {
                    model.scaling = new Vector3(obj.scale.x, obj.scale.y, obj.scale.z);
                }
                
                // アニメーションがあれば再生
                if (result.animationGroups && result.animationGroups.length > 0) {
                    result.animationGroups[0].play(true);
                }
                console.log(`モデル「${model.name}」を配置しました。`);

            } catch (error) {
                console.error(`モデル[${modelKey}]のロード中にエラーが発生しました。`, error);
            }
        }
           if (obj.key === 'ground_basic') {
                // 床や壁のような「動かない」オブジェクト
                model.physicsImpostor = new BABYLON.PhysicsImpostor(
                    model, 
                    BABYLON.PhysicsImpostor.BoxImpostor, // 形状は箱
                    { mass: 0, friction: 0.5, restitution: 0.1 }, // mass: 0 で静的なオブジェクト
                    this.bjs_scene
                );
            } else if (obj.key === 'player_borntest') {
                // プレイヤーキャラクター
                model.physicsImpostor = new BABYLON.PhysicsImpostor(
                    model, 
                    BABYLON.PhysicsImpostor.CapsuleImpostor, // キャラクターにはカプセル型がおすすめ
                    { mass: 1, friction: 0.5, restitution: 0.0 }, // mass: 1 で動的なオブジェクト
                    this.bjs_scene
                );
                // 物理ボディが回転しないようにする (横スクロールゲームのお約束)
                model.physicsImpostor.physicsBody.angularDamping = 1.0;
                
                // 後で操作できるように、このオブジェクトを保持しておく
                this.player = model; 
            }
            // ★★★ ここまでが修正箇所 ★★★
        }

        // --- ★★★ 入力設定の追加 ★★★ ---
        this.cursors = this.input.keyboard.createCursorKeys();
        this.input.keyboard.on('keydown-SPACE', this.playerJump, this);
        // --- ★★★ ここまでが修正箇所 ★★★ ---

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
    // ★★★ 新しいメソッドとして追加 ★★★
    playerJump() {
        if (!this.player) return;

        // 地面にいるかどうかを簡易的に判定 (後で改良します)
        // Y方向の速度がごくわずかなら地面にいるとみなす
        const velocity = this.player.physicsImpostor.getLinearVelocity();
        if (Math.abs(velocity.y) < 0.05) {
            this.player.physicsImpostor.applyImpulse(
                new BABYLON.Vector3(0, 10, 0), // 上向きの力
                this.player.getAbsolutePosition()
            );
        }
    }
    
    // ★★★ updateメソッドを新規作成 (または追記) ★★★
    update(time, delta) {
        if (!this.player) return; // プレイヤーがいなければ何もしない

        const speed = 5; // 移動速度
        const velocity = this.player.physicsImpostor.getLinearVelocity();
        
        // 現在の速度を保持しつつ、X方向の速度だけを上書きする
        const newVelocity = new BABYLON.Vector3(0, velocity.y, 0);

        if (this.cursors.left.isDown) {
            newVelocity.x = -speed;
            this.player.rotation.y = Math.PI; // 左を向く (180度)
        } else if (this.cursors.right.isDown) {
            newVelocity.x = speed;
            this.player.rotation.y = 0; // 右を向く (0度)
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
