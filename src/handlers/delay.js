// handlers/delay.js

/**
 * [delay] タグの処理
 * @returns {Promise<void>}
 */
export function handleDelay(manager, params) {
    const speed = params.speed;
    if (speed === undefined) {
        console.warn('[delay] speed属性は必須です。');
        return Promise.resolve(); // ★ 即座に解決されるPromiseを返す
    }
    
    manager.messageWindow.setTypingSpeed(Number(speed));
    console.log(`テキスト表示速度を ${speed}ms に変更しました。`);
    
    // ★★★ 同期処理でも、必ずPromiseを返す ★★★
    return Promise.resolve();
}