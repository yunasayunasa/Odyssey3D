/**
 * [stop_anim] タグの処理
 * 指定されたターゲットのループアニメーションをすべて停止する
 * @param {ScenarioManager} manager
 * @param {Object} params - { name }
 */
export function handleStopAnim(manager, params) {
    const name = params.name;
    if (!name) {
        console.warn('[stop_anim] name属性は必須です。');
        return Promise.resolve();// 何もせず同期的に完了
    }
    
    // キャラクターだけでなく、name属性を持つあらゆるオブジェクトを対象にできる
    const target = manager.scene.characters[name]; 
    if (!target) {
        console.warn(`[stop_anim] 停止対象のオブジェクト[${name}]が見つかりません。`);
      return Promise.resolve();
    }

    // ★★★ 指定されたターゲットに紐づくTweenをすべて停止・削除する ★★★
    manager.scene.tweens.killTweensOf(target);
return Promise.resolve();
    console.log(`オブジェクト[${name}]のアニメーションを停止しました。`);

    // ★★★ StateManagerに関する処理はすべて不要 ★★★
    // 位置を補正する必要があるかは、ゲームの仕様次第。
    // 一般的には、アニメーションを止めたらその位置で静止するのが自然。
    // もし「開始前の位置」に戻したいなら、アニメーション開始時に
    // target.setData('originPos', { x: target.x, y: target.y }) のように保存し、
    // ここで target.getData('originPos') を使って戻すのが良い設計。
    // 今回は、補正処理は行わないシンプルで汎用的な実装とする。

    // ★★★ このタグの処理は一瞬で終わるので、何も呼び出す必要はない ★★★
}