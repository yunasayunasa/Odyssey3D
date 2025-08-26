/**
 * [else] タグの処理
 * if/elsifの条件がすべて満たされなかった場合に実行されるブロックを開始する
 * @param {ScenarioManager} manager
 * @param {Object} params - パラメータ（未使用）
 */
export function handleElse(manager, params) {
    if (manager.ifStack.length === 0) {
        console.error("[else] 対応する[if]が存在しません。");
         return Promise.resolve();
    }

    const ifState = manager.ifStack[manager.ifStack.length - 1];

    // すでに前のif/elsifブロックで条件が成立していた場合
    if (ifState.conditionMet) {
        // この[else]ブロックはスキップ対象とする
        ifState.skipping = true;
    } else {
        // まだどのブロックも実行されていない場合、この[else]ブロックを実行する
        ifState.skipping = false;
        // この[else]が実行されたので、このif文全体としては「条件が満たされた」ことになる
        ifState.conditionMet = true;
    }
 return Promise.resolve();
    // ★★★ このタグの処理は一瞬で終わるので、何も呼び出す必要はない ★★★
    // ScenarioManagerのメインループが、この関数の終了後に次の行の処理に進む
}