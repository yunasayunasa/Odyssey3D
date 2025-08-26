// src/ui/CoinHud.js (引数をオブジェクト形式に変更)

export default class CoinHud extends Phaser.GameObjects.Container {
    // ★★★ 修正箇所: constructorの引数を設定オブジェクトに変更 ★★★
    constructor(scene, config) {
        // configオブジェクトから値を取り出す
        const x = config.x || 0;
        const y = config.y || 0;
        const stateManager = config.stateManager; // stateManagerをconfigから取得

        super(scene, x, y);

        // ★★★ stateManagerが渡されているか、ここで確認 ★★★
        if (!stateManager) {
            console.error("CoinHud: constructorにstateManagerが渡されていません！");
            return; // stateManagerがない場合は処理を中断
        }
        this.stateManager = stateManager;

        // アイコンとテキストの作成
        const icon = scene.add.image(0, 0, 'coin_icon'); // アイコンのアセットキーを仮定
        this.add(icon);
        this.coinText = scene.add.text(40, 0, '0', {
            fontSize: '32px',
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 3
        }).setOrigin(0, 0.5);
        this.add(this.coinText);

        // ★★★ StateManagerから初期値を取得して設定 ★★★
        this.setCoin(this.stateManager.f.coin || 0);

        // ★★★ StateManagerの変更イベントを直接購読 ★★★
        this.stateManager.on('f-variable-changed', this.onFVariableChanged, this);

        scene.add.existing(this);
    }

    // ★★★ 追加: f変数が変更されたときに呼ばれるコールバック ★★★
    onFVariableChanged(key, value) {
        // 'coin'キーの変更のみを監視
        if (key === 'coin' && this.coinText && this.coinText.text !== value.toString()) {
            this.setCoin(value);
        }
    }

    setCoin(value) {
        if (this.coinText) { // nullチェック
            this.coinText.setText(String(value));
        }
    }
    
    // ★★★ 追加: 破棄される際にイベントリスナーを解除する ★★★
    destroy(fromScene) {
        console.log("CoinHud: destroyされました。イベントリスナーを解除します。");
        // StateManagerのイベントリスナーを解除
        if (this.stateManager) {
            this.stateManager.off('f-variable-changed', this.onFVariableChanged, this);
        }
        // 親のdestroyを呼び出す（Container内のiconやcoinTextも破棄される）
        super.destroy(fromScene);
    }
}