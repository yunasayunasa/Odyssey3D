// ★★★ src/handlers/puppet_move.js をこのコードで完全に置き換えてください ★★★

/**
 * [puppet_move] タグ
 * キャラクターを人形劇のように揺らしながら移動させる (座標補正 最終版)
 */
export function handlePuppetMove(manager, params) {
    const name = params.name;
    if (!name) { console.warn('[puppet_move] nameは必須です。'); return Promise.resolve(); }
    const chara = manager.scene.characters[name];
    if (!chara) { console.warn(`[puppet_move] キャラクター[${name}]が見つかりません。`); return Promise.resolve(); }

    const noWait = params.nowait === 'true';

    return new Promise(resolve => {
        // 1. パラメータの取得
        const time = Number(params.time) || 2000;
        // ★ 目標座標は、原点が中央(0.5, 0.5)であることを前提とした値
        const finalTargetX = params.x !== undefined ? Number(params.x) : chara.x;
        const finalTargetY = params.y !== undefined ? Number(params.y) : chara.y;
        
        const swayAmount = Number(params.sway_amount) || 10;
        const swaySpeed = Number(params.sway_speed) || 250;
        const angle = Number(params.angle) || 0;
        const pivot = params.pivot || 'bottom';

        // 2. pivotに応じて原点と座標を補正
        let startY = chara.y;
        let targetY = finalTargetY;

        if (pivot === 'bottom') {
            // ★ 原点を変更する前に、現在の見た目のY座標を補正
            if (chara.originY !== 1.0) { // まだ足元軸になっていない場合のみ
                startY = chara.y + (chara.height / 2);
            }
            // ★ 目標のY座標も、足元軸に合わせるために補正
            targetY = finalTargetY + (chara.height / 2);
            
            chara.setOrigin(0.5, 1.0);

        } else {
            // pivotがcenterやtopの場合は、もし足元軸になっていたら中央に戻す
            if (chara.originY !== 0.5) {
                startY = chara.y - (chara.height / 2);
            }
            targetY = finalTargetY;
            chara.setOrigin(0.5, 0.5);
        }
        
        // ★ 補正済みの開始Y座標をキャラクターに即時適用
        chara.y = startY;

        // 3. Tweenの定義
        // Tween A: 全体の移動 (補正済みの座標へ)
        manager.scene.tweens.add({
            targets: chara,
            x: finalTargetX, // X座標の補正は不要
            y: targetY,      // ★ 補正済みの目標Y座標へ移動
            duration: time,
            ease: 'Sine.easeInOut'
        });

        // Tween B: 左右の揺れ (変更なし)
        manager.scene.tweens.add({
            targets: chara,
            angle: { from: angle - swayAmount, to: angle + swayAmount },
            duration: swaySpeed,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1,
        });
        
        // 4. 移動完了時にすべてをリセット
        manager.scene.time.delayedCall(time, () => {
            manager.scene.tweens.killTweensOf(chara);
            
            // ★ 最終的な状態を、原点(0.5, 0.5)基準の値で確定させる
            chara.setOrigin(0.5, 0.5);
            chara.setPosition(finalTargetX, finalTargetY);
            chara.setAngle(0);
            
            if (!noWait) {
                resolve();
            }
        });

        if (noWait) {
            resolve();
        }
    });
}