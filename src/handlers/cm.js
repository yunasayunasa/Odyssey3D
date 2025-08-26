/**
 * [cm] タグの処理
 * メッセージウィンドウのテキストをクリアし、クリックを待つ
 */
export function handleClearMessage(manager, params) {
    // 1. メッセージウィンドウをクリア
    manager.messageWindow.setText('', false);
    
    // 2. 状態を「クリック待ち」に設定
    manager.isWaitingClick = true;

    // 3. ★★★ クリック待ちアイコンを表示する ★★★
    manager.messageWindow.showNextArrow();
    return Promise.resolve();
    // next()は呼ばない。クリックを待つ。
}