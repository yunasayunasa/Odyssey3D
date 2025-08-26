export function handleLiveBreathStop(manager, params) {
    const name = params.name;
    if (!name) { return Promise.resolve(); }
    const chara = manager.scene.characters[name];
    if (!chara) { return Promise.resolve(); }

    const breathTween = chara.getData('liveBreathTween');
    if (breathTween) {
        breathTween.stop();
        chara.setData('liveBreathTween', null);
        
        // ★★★ ここからが修正箇所 ★★★
        // 1. 保存しておいた座標の補正量を取得
        const yOffset = chara.getData('breathYOffset') || 0;

        // 2. スケールと原点をデフォルトに戻す
        chara.setScale(1);
        chara.setOrigin(0.5, 0.5);

        // 3. Y座標から補正量を引いて、完全に元の位置に戻す
        chara.y -= yOffset;
        chara.setData('breathYOffset', null); // データをクリア
        // ★★★ ここまでが修正箇所 ★★★
    }
    return Promise.resolve();
}