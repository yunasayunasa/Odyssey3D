export function handleLiveBreathStart(manager, params) {
    const name = params.name;
    if (!name) { return Promise.resolve(); }
    const chara = manager.scene.characters[name];
    if (!chara) { return Promise.resolve(); }
    if (chara.getData('liveBreathTween')) chara.getData('liveBreathTween').stop();

    const speed = Number(params.speed) || 4000;
    const amount = Number(params.amount) || 0.015;

    // ★★★ ここからが修正箇所 ★★★
    // 1. 現在の原点を保存
    const oldOriginY = chara.originY;
    const newOriginY = 0.7; // 呼吸の支点

    // 2. 原点を変更
    chara.setOrigin(0.5, newOriginY);

    // 3. 原点変更によるY座標のズレを計算して補正
    const yOffset = chara.height * (newOriginY - oldOriginY);
    chara.y += yOffset;

    // 4. 補正量をキャラクターに保存しておく（stop時に使う）
    chara.setData('breathYOffset', yOffset);
    // ★★★ ここまでが修正箇所 ★★★

    const breathTween = manager.scene.tweens.add({
        targets: chara,
        scaleY: 1 + amount,
        duration: speed / 2,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
    });

    chara.setData('liveBreathTween', breathTween);
    return Promise.resolve();
}