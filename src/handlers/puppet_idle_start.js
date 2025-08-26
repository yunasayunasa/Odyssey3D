// ★★★ src/handlers/puppet_idle_start.js をこのコードで置き換えてください ★★★

/**
 * [puppet_idle_start] タグ
 * キャラクターをその場で生命感を持ってゆらゆら揺らし始める (デフォルト値強化版)
 */
export function handlePuppetIdleStart(manager, params) {
    const name = params.name;
    if (!name) { console.warn('[puppet_idle_start] nameは必須です。'); return Promise.resolve(); }
    const chara = manager.scene.characters[name];
    if (!chara) { console.warn(`[puppet_idle_start] キャラクター[${name}]が見つかりません。`); return Promise.resolve(); }

    if (chara.getData('puppetIdleTween')) {
        chara.getData('puppetIdleTween').stop();
    }
    if (chara.getData('puppetIdleYTween')) {
        chara.getData('puppetIdleYTween').stop();
    }

    // --- ここからが「いい感じ」のデフォルト値を設定する部分 ---
    
    // パラメータが指定されていなければ、デフォルト値を使用する
    // amount: 左右の揺れの角度(度)
    const swayAmount = params.amount !== undefined ? Number(params.amount) : 2;

    // speed: 揺れの基本速度(ミリ秒)。数値が小さいほど速い
    const swaySpeed = params.speed !== undefined ? Number(params.speed) : 400;

    // y_amount: 上下動の幅(ピクセル数)
    const yAmount = params.y_amount !== undefined ? Number(params.y_amount) : 60;

    // randomness: 揺れ周期のランダムなズレ幅(ミリ秒)
    const randomness = params.randomness !== undefined ? Number(params.randomness) : 150;

    // pivot: 回転軸。'bottom'か'center'
    const pivot = params.pivot || 'bottom';

    // --- ここまでがデフォルト値の設定 ---

    // 回転軸と座標の補正
    let startY = chara.y;
    if (pivot === 'bottom') {
        if (chara.originY !== 1.0) startY = chara.y + (chara.height / 2);
        chara.setOrigin(0.5, 1.0);
    } else {
        if (chara.originY !== 0.5) startY = chara.y - (chara.height / 2);
        chara.setOrigin(0.5, 0.5);
    }
    chara.y = startY;

    // Tween A: 左右の揺れ (角度)
    const angleTween = manager.scene.tweens.add({
        targets: chara,
        angle: { from: -swayAmount, to: swayAmount },
        duration: swaySpeed,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
        onRepeat: (tween) => {
            const newDuration = swaySpeed + Phaser.Math.Between(-randomness, randomness);
            tween.updateTo('duration', newDuration, true);
        }
    });

    // Tween B: 上下の揺れ (Y座標)
    const yTween = manager.scene.tweens.add({
        targets: chara,
        y: startY + yAmount,
        duration: swaySpeed * 1.5, // 角度の揺れより少し遅い周期
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
        onRepeat: (tween) => {
            const newDuration = (swaySpeed * 1.5) + Phaser.Math.Between(-randomness, randomness);
            tween.updateTo('duration', newDuration, true);
        }
    });

    // 作成したTweenをキャラクターオブジェクトに保存
    chara.setData('puppetIdleTween', angleTween);
    chara.setData('puppetIdleYTween', yTween);

    return Promise.resolve();
}