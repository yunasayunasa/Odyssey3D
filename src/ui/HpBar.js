// src/ui/HpBar.js (引数をオブジェクト形式に変更)

export default class HpBar extends Phaser.GameObjects.Container {
    // ★★★ 修正箇所: constructorの引数を設定オブジェクトに変更 ★★★
    constructor(scene, config) {
        // configオブジェクトから値を取り出す
        const x = config.x || 0;
        const y = config.y || 0;
        const width = config.width || 200;
        const height = config.height || 25;
        const type = config.type || 'player';
        const stateManager = config.stateManager; // stateManagerをconfigから取得

        super(scene, x, y); // 親クラスのコンストラクタを呼び出す
        
        // ★★★ stateManagerが渡されているか、ここで再度確認 ★★★
        if (!stateManager) {
            console.error("HpBar: constructorにstateManagerが渡されていません！");
            return; // stateManagerがない場合は処理を中断
        }
        this.stateManager = stateManager;

        this.barWidth = width;
        this.barHeight = height;
        this.type = type;
        this.maxHp = 100;
        this.currentHp = 100;

        // ★★★ HPバーの背景 (黒) ★★★
        this.background = scene.add.rectangle(0, 0, width, height, 0x000000, 0.8)
            .setOrigin(0, 0.5); // 左端基準 (HPバーは左から右へ伸びるため)
        this.add(this.background);

        // ★★★ HPバー本体 (色) ★★★
        const barColor = (type === 'player') ? 0x00ff00 : 0xff0000; // プレイヤーは緑、敵は赤
        this.bar = scene.add.rectangle(0, 0, width, height, barColor)
            .setOrigin(0, 0.5); // 左端基準
        this.add(this.bar);

        // ★★★ HP数値テキスト ★★★
        this.hpText = scene.add.text(width / 2, 0, '100/100', {
            fontSize: (height * 0.8) + 'px', // バーの高さに合わせて調整
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 2
        }).setOrigin(0.5); // 中央基準
        this.add(this.hpText);
   // ★★★ stateManagerのイベントを購読 ★★★
        this.stateManager.on('f-variable-changed', this.onFVariableChanged, this);
        
        // コンテナ全体をシーンに追加
        scene.add.existing(this);

        // UIなので、メッセージウィンドウより手前に表示
        this.setDepth(100);

        // 初期HPを設定
        this.setHp(this.maxHp, this.maxHp);
    }

    /**
     * HPバーの最大HPを設定する
     * @param {number} maxHp - 新しい最大HP
     */
    setMaxHp(maxHp) {
        this.maxHp = maxHp;
        this.setHp(this.currentHp, maxHp); // 表示も更新
    }
 // ★★★ f変数が変更されたときに呼ばれるコールバック ★★★
    onFVariableChanged(key, value) {
        if ((key === 'player_hp' && this.type === 'player') || (key === 'enemy_hp' && this.type === 'enemy')) {
            const maxHp = this.stateManager.f[`${this.type}_max_hp`] || 100;
            this.setHp(value, maxHp);
        } else if ((key === 'player_max_hp' && this.type === 'player') || (key === 'enemy_max_hp' && this.type === 'enemy')) {
            const currentHp = this.stateManager.f[`${this.type}_hp`] || 0;
            this.setHp(currentHp, value);
        }
    }

    // ★★★ destroyメソッドでイベントリスナーを解除 ★★★
    destroy(fromScene) {
        if (this.stateManager) {
            this.stateManager.off('f-variable-changed', this.onFVariableChanged, this);
        }
        super.destroy(fromScene);
    }
    /**
     * HPバーの現在HPと最大HPを更新する
     * @param {number} currentHp - 新しい現在HP
     * @param {number} [maxHp] - 新しい最大HP (省略可能、省略時は既存のmaxHpを使用)
     */
    setHp(currentHp, maxHp = this.maxHp) {
        this.currentHp = Phaser.Math.Clamp(currentHp, 0, maxHp); // 0-maxHpの範囲にクランプ
        this.maxHp = maxHp;

        // バーの幅を計算 (現在HP / 最大HP)
        const barScale = this.currentHp / this.maxHp;
        this.bar.width = this.barWidth * barScale;

        // HPテキストを更新
        this.hpText.setText(`${this.currentHp}/${this.maxHp}`);

        // HPが減少するアニメーション (オプション)
        if (this.scene.tweens && this.scene.tweens.isTweening(this.bar)) {
            // 既にアニメーション中なら中断
            this.scene.tweens.killTweensOf(this.bar);
        }
        // なめらかにHPが減るアニメーション
        this.scene.tweens.add({
            targets: this.bar,
            width: this.barWidth * barScale, // 目標の幅
            duration: 200, // アニメーション時間
            ease: 'Linear'
        });
    }
}