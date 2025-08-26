/**
 * [if] タグの処理
 * 条件分岐ブロックを開始する。
 * 条件式を評価し、結果をifStackにプッシュする。
 * @param {ScenarioManager} manager
 * @param {Object} params - { exp }
 * @returns {Promise<void>}
 */
export function handleIf(manager, params) {
    const exp = params.exp;
    if (exp === undefined) {
        console.warn("[if] exp属性は必須です。");
        manager.ifStack.push({
            conditionMet: false,
            skipping: true
        });
        // ★ ここはOK
        return Promise.resolve();
    }

    const result = manager.stateManager.eval(exp);
    
    manager.ifStack.push({
        conditionMet: !!result,
        skipping: !result
    });

    // ★★★ 修正箇所: 必ずPromiseを返す ★★★
    return Promise.resolve();
}