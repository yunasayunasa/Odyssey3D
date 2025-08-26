/**
 * [er] タグの処理
 * 指定されたレイヤー上のオブジェクトをすべて消去する
 * @param {ScenarioManager} manager
 * @param {Object} params - { layer, name }
 */
export function handleErase(manager, params) {
    // ★★★ name属性で個別削除に対応 ★★★
    if (params.name) {
        const targetObject = manager.scene.characters[params.name] || manager.scene.uiButtons.find(b => b.name === params.name);
        if (targetObject) {
            targetObject.destroy();
            // 管理リストからも削除
            if (manager.scene.characters[params.name]) {
                delete manager.scene.characters[params.name];
            }
            if (manager.scene.uiButtons) {
                manager.scene.uiButtons = manager.scene.uiButtons.filter(b => b !== targetObject);
            }
        } else {
            console.warn(`[er] 消去対象のオブジェクト[${params.name}]が見つかりません。`);
        }
       return Promise.resolve();// 個別削除の場合はここで終了
    }

    // ★★★ layer属性で一括削除 ★★★
    const layerName = params.layer;
    if (!layerName) {
        console.warn('[er] layer属性またはname属性は必須です。');
        return Promise.resolve();
    }

    const targetLayer = manager.layers[layerName];
    if (!targetLayer) {
        console.warn(`[er] 指定されたレイヤー[${layerName}]が見つかりません。`);
        return Promise.resolve();
    }
    
    // レイヤー内のすべてのオブジェクトを破棄
    targetLayer.removeAll(true);

    // ★★★ StateManagerへの更新は一切不要 ★★★

    // 関連する管理リストも空にする
    if (layerName === 'character') {
        manager.scene.characters = {};
        console.log('キャラクターレイヤーを消去しました。');
    }
    if (layerName === 'message') {
        // [button]で作成したボタンも消去する場合
        if (manager.scene.uiButtons) {
            manager.scene.uiButtons = [];
        }
    }
return Promise.resolve();
    // ★★★ このタグの処理は一瞬で終わるので、何も呼び出す必要はない ★★★
}