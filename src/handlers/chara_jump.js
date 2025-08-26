/**
 * [chara_jump] タグの処理
 * キャラクターをジャンプさせる
 * @param {ScenarioManager} manager
 * @param {Object} params - { name, time, height, x_add, y_add, loop, nowait }
 * @returns {Promise<void> | void}
 */
export function handleCharaJump(manager, params) {
    const name = params.name;
    if (!name) { console.warn('[chara_jump] nameは必須です。'); return Promise.resolve(); }
    const chara = manager.scene.characters[name];
    if (!chara) { console.warn(`[chara_jump] キャラクター[${name}]が見つかりません。`); return Promise.resolve(); }

    const noWait = params.nowait === 'true';
    const loop = params.loop === 'true';

    // ★★★ 修正箇所: loop=true の場合は、Promiseを即時解決する ★★★
    if (loop) {
        createJumpTween(manager, chara, params, null); // アニメーションは開始
        return Promise.resolve(); // ★ 即座に解決し、シナリオを進める
    }

    // noWaitでない場合（かつloopでない場合）、Promiseを返して完了を待つ
    if (!noWait) {
        return new Promise(resolve => {
            const onCompleteCallback = () => {
                resolve();
            };
            createJumpTween(manager, chara, params, onCompleteCallback);
        });
    } else {
        // nowaitの場合、Promiseを返さずにアニメーションを開始するだけ
        createJumpTween(manager, chara, params, null);
        return Promise.resolve(); // 即座に解決し、シナリオを進める
    }
}


/**
 * ジャンプのTweenアニメーションを作成・実行するヘルパー関数
 * @param {ScenarioManager} manager
 * @param {Phaser.GameObjects.Image} chara - 対象キャラクター
 * @param {Object} params - タグのパラメータ
 * @param {Function | null} onCompleteCallback - アニメーション完了時に呼ばれるコールバック
 */
function createJumpTween(manager, chara, params, onCompleteCallback) {
    const time = Number(params.time) || 500;
    const height = Number(params.height) || 50;
    const x_add = Number(params.x_add) || 0;
    const y_add = Number(params.y_add) || 0;
    const loop = params.loop === 'true';

    const originX = chara.x;
    const originY = chara.y;
    const targetX = originX + x_add;
    const targetY = originY + y_add;

    const tweenConfig = {
        targets: chara,
        // x座標は最終地点へ線形移動
        x: targetX,
        // y座標は放物線を描くように上下運動
        y: {
            getStart: () => originY,
            getEnd: () => targetY,
            ease: 'Linear',
        },
        // yoyoとeaseを使ってジャンプ感を出す
        yoyo: true,
        ease: 'Power1.easeOut', // ジャンプ開始時に勢いよく
        duration: time,
        onComplete: () => {
            // 最終座標を確定させる
            chara.setPosition(targetX, targetY);

            // ★ 渡されたコールバックが存在すれば実行する
            if (onCompleteCallback) {
                onCompleteCallback();
            }
        }
    };

    // y座標のジャンプ部分のTweenを別途作成して組み合わせる方がより正確な動きになる
    // ここでは元のロジックを尊重しつつ、よりシンプルなTweenで再構成
    manager.scene.tweens.add({
        targets: chara,
        props: {
            x: { value: targetX, duration: time, ease: 'Linear' },
            y: { value: chara.y - height, duration: time / 2, yoyo: true, ease: 'Sine.Out' },
        },
        loop: loop ? -1 : 0,
        onComplete: () => {
            if (!loop) {
                chara.setPosition(targetX, targetY);
                if (onCompleteCallback) onCompleteCallback();
            }
        }
    });
}