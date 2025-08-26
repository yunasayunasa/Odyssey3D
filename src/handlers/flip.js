/**
 * [flip] タグの処理
 * 指定されたキャラクターを表情差分付きで反転させる (ネストしたTweenで実装)
 * @param {ScenarioManager} manager
 * @param {Object} params - { name, face, time }
 * @returns {Promise<void>}
 */
export function handleFlip(manager, params) {
    return new Promise(resolve => {
        const name = params.name;
        if (!name) { console.warn('[flip] nameは必須です。'); resolve(); return; }

        const chara = manager.scene.characters[name];
        if (!chara) { console.warn(`[flip] キャラクター[${name}]が見つかりません。`); resolve(); return; }

        const time = Number(params.time) || 500;
        const halfTime = time / 2;
        const originalScaleX = chara.scaleX; // 元のスケールを保持

        // --- 1. 半分の時間かけて画像を横に潰すアニメーション ---
        manager.scene.tweens.add({
            targets: chara,
            scaleX: 0,
            duration: halfTime,
            ease: 'Linear',
            
            // ★★★ 潰し終わった瞬間に、中間処理を直接実行する ★★★
            onComplete: () => {
                console.log(`[Handler:flip] 1st Tween (潰す) 完了。中間処理を開始します。`);

                // --- 2. 潰れた瞬間にテクスチャと向きを差し替える ---
                chara.toggleFlipX(); // 向きを反転

                const face = params.face;
                if (face) {
                    const def = manager.characterDefs[name];
                    const newStorage = def ? def.face[face] : null;
                    if (newStorage) {
                        chara.setTexture(newStorage); // テクスチャを差し替える
                        console.log(`[Handler:flip] テクスチャ変更: ${newStorage}`);
                    } else {
                        console.warn(`[flip] キャラクター[${name}]の表情[${face}]が見つかりません。`);
                    }
                }
                // (StateManagerに関する処理はすでに削除済みなので不要)
                
                // --- 3. 潰れた状態から、元の幅に戻すアニメーションを開始する ---
                manager.scene.tweens.add({
                    targets: chara,
                    scaleX: originalScaleX, // 元のスケールに戻す
                    duration: halfTime,
                    ease: 'Linear',
                    onComplete: () => {
                        console.log(`[Handler:flip] 2nd Tween (戻す) 完了。resolve()を呼び出します。`);
                        resolve(); // すべての処理が完了したのでPromiseを解決
                    }
                });
            }
        });
    });
}