/**
 * [walk] タグの処理 (最終修正版)
 * キャラクターを歩いているように上下動させながら移動させる
 * @param {ScenarioManager} manager
 * @param {Object} params - { name, x, y, time, height, speed }
 * @returns {Promise<void>}
 */
export function handleWalk(manager, params) {
    return new Promise(resolve => {
        const name = params.name;
        if (!name) { console.warn('[walk] nameは必須です。'); resolve(); return; }

        const chara = manager.scene.characters[name];
        if (!chara) { console.warn(`[walk] キャラクター[${name}]が見つかりません。`); resolve(); return; }

        const time = Number(params.time) || 2000;
        const targetX = params.x !== undefined ? Number(params.x) : chara.x;
        // ★ y座標は、開始時の値を基準とする
        const originY = chara.y; 
        const walkHeight = Number(params.height) || 10;
        const walkSpeed = Number(params.speed) || 150;

        // 上下動のオフセットをデータ領域に設定
        chara.setData('walkOffsetY', 0);

        // --- 1. メインの移動Tween（X座標のみを操作） ---
        const moveTween = manager.scene.tweens.add({
            // ★★★ ターゲットはキャラクター自身 ★★★
            targets: chara,
            // ★★★ x座標だけを動かす ★★★
            x: targetX,
            duration: time,
            ease: 'Linear'
        });

        // --- 2. 上下動のTween（オフセットデータのみを操作）---
        const walkTween = manager.scene.tweens.add({
            targets: chara.data.values,
            walkOffsetY: -walkHeight,
            duration: walkSpeed,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });

        // --- 3. 毎フレーム、Y座標をオフセットで更新 ---
        const onUpdate = () => {
            // ★★★ 開始時のY座標に、現在のオフセットを加算 ★★★
            chara.y = originY + chara.getData('walkOffsetY');
        };
        manager.scene.events.on('update', onUpdate);

        // --- 4. 完了処理 ---
        // メインの移動Tweenが終わったら、すべてをクリーンアップする
        moveTween.on('complete', () => {
            walkTween.stop();
            manager.scene.events.off('update', onUpdate);
            chara.data.remove('walkOffsetY');

            // 最終座標を正確に設定
            chara.setPosition(targetX, originY); // y座標は開始時の高さに戻る
            
            resolve();
        });
    });
}