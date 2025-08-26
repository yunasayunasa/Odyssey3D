/**
 * [button] タグの処理
 * クリック可能な画像ボタンを配置し、クリックされるまで待機する
 * @param {ScenarioManager} manager
 * @param {Object} params - { graphic, x, y, target }
 */
export function handleButton(manager, params) {
    const { graphic, target } = params;
    if (!graphic) {
        console.warn('[button] graphic属性は必須です。');
        manager.next(); // 即座に次の行へ（エラーなので待たない）
        return;
    }
    if (!target) {
        console.warn('[button] target属性は必須です。');
        manager.next(); // 即座に次の行へ（エラーなので待たない）
        return;
    }

    const x = Number(params.x) || manager.scene.scale.width / 2;
    const y = Number(params.y) || manager.scene.scale.height / 2;

    const buttonImage = manager.scene.add.image(x, y, graphic)
        .setInteractive({ useHandCursor: true }) // カーソルを手の形にする
        .setOrigin(0.5);

    // ★★★ プレイヤーの入力を待つ状態に設定 ★★★
    manager.isWaitingClick = true; // or isWaitingChoice = true; どちらでも良い

    // ボタンがクリックされた時の処理
    buttonImage.on('pointerdown', () => {
        // ★★★ 待機状態を解除 ★★★
        manager.isWaitingClick = false;

        // ★★★ 作成したボタンを自身で破棄する ★★★
        buttonImage.destroy();
        // 配列からも削除（より丁寧な実装）
        const index = manager.scene.uiButtons.indexOf(buttonImage);
        if (index > -1) {
            manager.scene.uiButtons.splice(index, 1);
        }

        // 指定のラベルにジャンプして、そこからnext()で再開
        manager.jumpTo(target);
        manager.next();
    });

    // uiButtons配列に登録して、[er]タグなどで外部から消せるようにする
    manager.scene.uiButtons.push(buttonImage);

    // ★★★ manager.next() や finishTagExecution() は呼び出さない ★★★
    // 呼び出してしまうと、待たずに次の行に進んでしまう。
    // 処理の再開は 'pointerdown' イベントの中で行う。
}