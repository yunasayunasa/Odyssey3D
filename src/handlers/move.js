/**
 * [move] タGグの処理
 * 指定されたキャラクターをスムーズに移動、またはフェードさせる
 * @param {ScenarioManager} manager
 * @param {Object} params - { name, x, y, alpha, time }
 * @returns {Promise<void>}
 */
export function handleMove(manager, params) {
    return new Promise(resolve => {
        const name = params.name;
        if (!name) {
            console.warn('[move] name属性は必須です。');
            resolve();
            return;
        }
        
        const chara = manager.scene.characters[name];
        if (!chara) {
            console.warn(`[move] 移動対象のキャラクター[${name}]が見つかりません。`);
            resolve();
            return;
        }

        const duration = Number(params.time) || 1000;
        
        // Tweenで変更するプロパティを動的に構築する
        const tweenProps = {
            targets: chara,
            duration: duration,
            ease: 'Cubic.easeInOut',
            onComplete: () => {
                // ★★★ アニメーションが完了したらPromiseを解決 ★★★
                resolve();
            }
        };

        // 指定されたプロパティだけをtweenPropsに追加する
        let hasProps = false;
        if (params.x !== undefined) {
            tweenProps.x = Number(params.x);
            hasProps = true;
        }
        if (params.y !== undefined) {
            tweenProps.y = Number(params.y);
            hasProps = true;
        }
        if (params.alpha !== undefined) {
            tweenProps.alpha = Number(params.alpha);
            hasProps = true;
        }
        // 他にもscaleなど、動かしたいプロパティがあればここに追加できる

        // 動かすプロパティが何も指定されていなければ、即座に完了
        if (!hasProps) {
            console.warn('[move] 移動先のx, yやalphaなどのプロパティが指定されていません。');
            resolve();
            return;
        }

        // Tweenを実行
        manager.scene.tweens.add(tweenProps);
    });
}