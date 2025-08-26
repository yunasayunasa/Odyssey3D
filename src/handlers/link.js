/**
 * [link] タグの処理
 * 選択肢の情報を一時的な配列に保存する。
 * この時点ではボタンは表示せず、[p]タグの実行を待つ。
 * @param {ScenarioManager} manager
 * @param {Object} params - { target, text }
 */
export function handleLink(manager, params) {
    const { target, text } = params;

    // 必須パラメータのチェック
    if (!target) {
        console.warn('[link] target属性は必須です。');
        return Promise.resolve();// 何もせず同期的に完了
    }
    if (!text) {
        console.warn('[link] text属性は必須です。');
       return Promise.resolve();// 何もせず同期的に完了
    }

    // GameSceneが持つ pendingChoices 配列に選択肢情報を追加
    if (manager.scene.pendingChoices) {
        manager.scene.pendingChoices.push({ text: text, target: target });
    } else {
        // 念のため、pendingChoicesが存在しない場合にエラーを出しておく
        console.error("エラー: manager.scene.pendingChoices が存在しません。GameSceneを確認してください。");
    }
return Promise.resolve();
    // ★★★ このタグの処理は一瞬で終わるので、何も呼び出す必要はない ★★★
    // すぐに次の行（次の[link]タグや[p]タグ）の処理に進む
}