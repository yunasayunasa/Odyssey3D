/**
 * [freeimage] タグの処理
 * 指定したレイヤーの画像をすべてフェードアウトさせて消去する
 * @param {ScenarioManager} manager
 * @param {Object} params - { layer, time }
 * @returns {Promise<void>}
 */
export function handleFreeImage(manager, params) {
    return new Promise(resolve => {
        // layer属性のデフォルトを 'cg' に設定
        const layerName = params.layer || 'cg';

        const targetLayer = manager.layers[layerName];
        if (!targetLayer) {
            console.warn(`[freeimage] レイヤー[${layerName}]が見つかりません。`);
            resolve();
            return;
        }
        
        // 消去対象のオブジェクトがない場合は、即座に完了
        if (targetLayer.list.length === 0) {
            resolve();
            return;
        }

        const time = Number(params.time) || 1000;

        // レイヤー内のすべてのオブジェクトをフェードアウトさせてから破棄
        manager.scene.tweens.add({
            targets: targetLayer.list,
            alpha: 0,
            duration: time,
            ease: 'Linear',
            onComplete: () => {
                // ★★★ アニメーション完了後に、オブジェクトを破棄して完了を通知 ★★★
                targetLayer.removeAll(true);
                
                // 関連する管理リストも空にする（erタグと同様の処理）
                if (layerName === 'character') {
                    manager.scene.characters = {};
                }
                
                resolve(); // Promiseを解決
            }
        });

        // ★★★ delayedCall や finishTagExecution は不要 ★★★
    });
}