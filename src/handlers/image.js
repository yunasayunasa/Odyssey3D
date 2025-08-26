/**
 * [image] タグの処理
 * 指定したレイヤーに画像をフェードインで表示する
 * @param {ScenarioManager} manager
 * @param {Object} params - { storage, layer, x, y, time }
 * @returns {Promise<void>}
 */
export function handleImage(manager, params) {
    return new Promise(resolve => {
        const storage = params.storage;
        if (!storage) {
            console.warn('[image] storageは必須です。');
            resolve();
            return;
        }

        const layerName = params.layer || 'cg';
        const targetLayer = manager.layers[layerName];
        if (!targetLayer) {
            console.warn(`[image] レイヤー[${layerName}]が見つかりません。`);
            resolve();
            return;
        }

        const time = Number(params.time) || 1000;
        const x = params.x !== undefined ? Number(params.x) : manager.scene.scale.width / 2;
        const y = params.y !== undefined ? Number(params.y) : manager.scene.scale.height / 2;

        const image = manager.scene.add.image(x, y, storage);
        image.setAlpha(0);
        targetLayer.add(image);

        // フェードイン
        manager.scene.tweens.add({
            targets: image,
            alpha: 1,
            duration: time,
            ease: 'Linear',
            onComplete: () => {
                // ★★★ アニメーション完了後にPromiseを解決 ★★★
                resolve();
            }
        });

        // ★★★ delayedCall や finishTagExecution は不要 ★★★
    });
}