// ★★★ src/handlers/puppet_idle_stop.js をこのコードで置き換えてください ★★★
/**
 * [puppet_idle_stop] タグ
 * キャラクターのその場での揺れを停止する
 */
export function handlePuppetIdleStop(manager, params) {
    const name = params.name;
    if (!name) { console.warn('[puppet_idle_stop] nameは必須です。'); return Promise.resolve(); }
    const chara = manager.scene.characters[name];
    if (!chara) { console.warn(`[puppet_idle_stop] キャラクター[${name}]が見つかりません。`); return Promise.resolve(); }

    const wasBottomPivot = (chara.originY === 1.0);
    const originalY = wasBottomPivot ? chara.y - (chara.height / 2) : chara.y;

    // 角度のTweenを停止
    const angleTween = chara.getData('puppetIdleTween');
    if (angleTween) {
        angleTween.stop();
        chara.setData('puppetIdleTween', null);
    }
    
    // ★ Y座標のTweenを停止
    const yTween = chara.getData('puppetIdleYTween');
    if (yTween) {
        yTween.stop();
        chara.setData('puppetIdleYTween', null);
    }

    // 姿勢と原点をリセット
    chara.setOrigin(0.5, 0.5);
    chara.setAngle(0);
    // ★ Y座標も元の位置に戻す
    chara.y = originalY;

    return Promise.resolve();
}