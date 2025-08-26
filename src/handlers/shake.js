/**
 * [shake] タグの処理
 * 指定されたキャラクターを揺らす
 * @param {ScenarioManager} manager
 * @param {Object} params - { name, time, power }
 * @returns {Promise<void>}
 */
export function handleShake(manager, params) {
    return new Promise(resolve => {
        const name = params.name;
        if (!name) {
            console.warn('[shake] キャラクターを揺らす場合はname属性が必須です。');
            resolve();
            return;
        }

        const chara = manager.scene.characters[name];
        if (!chara) {
            console.warn(`[shake] キャラクター[${name}]が見つかりません。`);
            resolve();
            return;
        }

        const time = Number(params.time) || 500;
        const power = Number(params.power) || 10;
        const originX = chara.x; // 元の位置を保存

        // ★★★ yoyoとrepeatを使った単一のTweenで実装 ★★★
        manager.scene.tweens.add({
            targets: chara,
            x: originX + power, // 右に揺れる
            duration: 50,       // 1回の揺れの速さ
            ease: 'Linear',
            yoyo: true,         // trueで元の位置に戻る
            repeat: Math.floor((time / 100) - 1), // 総時間に合わせて回数を計算
            onComplete: () => {
                chara.setX(originX); // 念のため最終的な位置を補正
                resolve(); // すべての揺れが終わったら完了を通知
            }
        });
    });
}