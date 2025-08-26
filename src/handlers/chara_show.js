import { Layout } from '../core/Layout.js';

/**
 * [chara_show] タグの処理
 * キャラクターを画面に登場させる
 * @param {ScenarioManager} manager
 * @param {Object} params - { name, face, storage, pos, x, y, time }
 * @returns {Promise<void>}
 */
export function handleCharaShow(manager, params) {
    return new Promise(resolve => {
        const name = params.name;
        if (!name) {
            console.warn('[chara_show] name属性は必須です。');
            resolve();
            return;
        }

        const def = manager.characterDefs[name];
        if (!def) {
            console.warn(`キャラクター[${name}]の定義が見つかりません。`);
            resolve();
            return;
        }

        // --- 1. 表示する画像(storage)を決定 ---
        const face = params.face || 'normal';
        const storage = def.face[face];
        if (!storage) {
            console.warn(`キャラクター[${name}]の表情[${face}]のstorageが見つかりません。`);
            resolve();
            return;
        }

        // --- 2. 座標を決定 ---
        let x, y;
        const pos = params.pos;
        const orientation = manager.scene.scale.isPortrait ? 'portrait' : 'landscape';

        if (pos && Layout[orientation].character[pos]) {
            x = Layout[orientation].character[pos].x;
            y = Layout[orientation].character[pos].y;
        } else {
            x = Layout[orientation].character.center.x;
            y = Layout[orientation].character.center.y;
        }

        if (params.x !== undefined) x = Number(params.x);
        if (params.y !== undefined) y = Number(params.y);

        // --- 3. 表示処理 ---
        // 既に同名のキャラクターがいれば、上書きする前に破棄する
        if (manager.scene.characters[name]) {
            manager.scene.characters[name].destroy();
        }

        const chara = manager.scene.add.image(x, y, storage);
        chara.setAlpha(0);
        manager.layers.character.add(chara);
        
        // ★★★ 管理リストに登録。セーブ時はこのオブジェクトが参照される ★★★
        manager.scene.characters[name] = chara;

        // ★★★ StateManagerに関する処理はすべて不要なので削除 ★★★

        // --- 4. アニメーション ---
        const time = Number(params.time) || 0;

        if (time > 0) {
            manager.scene.tweens.add({
                targets: chara,
                alpha: 1,
                duration: time,
                ease: 'Linear',
                onComplete: () => resolve() // アニメーション完了時に完了を通知
            });
        } else {
            chara.setAlpha(1);
            resolve(); // 即座に完了を通知
        }
    });
}