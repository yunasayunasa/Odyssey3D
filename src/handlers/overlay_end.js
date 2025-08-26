// src/handlers/overlay_end.js

export function handleOverlayEnd(manager, params) {
    const scene = manager.scene; // scene は NovelOverlayScene のインスタンス

    // ★★★ NovelOverlaySceneが保持している情報をSystemSceneに渡す ★★★
    scene.scene.get('SystemScene').events.emit('end-overlay', {
        from: scene.scene.key,
        returnTo: scene.returnTo,
        inputWasBlocked: scene.inputWasBlocked // initで受け取った情報をそのまま返す
    });

    manager.stop();
}