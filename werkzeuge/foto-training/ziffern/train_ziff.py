import sys, os, json, base64
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
import numpy as np, tensorflow as tf
D = sys.argv[1]; rng = np.random.default_rng(5)
mn = np.load(f'{D}/mnist.npz')
# Gleiche Aufbereitung wie fotoGlyphe: Tinte binär, längste Seite 20 Pixel (Flächenmittel), Schwerpunkt in die Mitte von 28 × 28
def glyphe(maske):
    ys, xs = np.nonzero(maske)
    if len(xs) == 0: return np.zeros((28, 28), np.float32)
    c = maske[ys.min():ys.max() + 1, xs.min():xs.max() + 1].astype(np.float32)
    h, w = c.shape; s = 20 / max(w, h); tw, th = max(1, round(w * s)), max(1, round(h * s))
    k = tf.image.resize(c[..., None], (th, tw), method='area').numpy()[..., 0]
    ms = k.sum(); my, mx = (np.arange(th)[:, None] * k).sum() / ms, (np.arange(tw)[None, :] * k).sum() / ms
    ox = int(np.clip(round(14 - mx), 0, 28 - tw)); oy = int(np.clip(round(14 - my), 0, 28 - th))
    out = np.zeros((28, 28), np.float32); out[oy:oy + th, ox:ox + tw] = k; return out
aug = tf.keras.Sequential([tf.keras.layers.RandomRotation(0.05, fill_mode='constant'), tf.keras.layers.RandomZoom((-0.1, 0.15), fill_mode='constant'),
                           tf.keras.layers.RandomTranslation(0.05, 0.05, fill_mode='constant')])
def mnist_aufbereiten(x, mal):
    out = []
    for r in range(mal):
        b = np.pad(x.astype(np.float32) / 255, ((0, 0), (8, 8), (8, 8)))[..., None]
        b = aug(b, training=True).numpy() if r else b
        # Strichstärke: meist unverändert oder dicker, selten dünner; Prüfdaten unverändert
        dick = rng.choice([0, 1, 2, -1], len(b), p=[0.45, 0.35, 0.15, 0.05]) if r else np.zeros(len(b), int)
        dil = tf.nn.max_pool2d(b, 3, 1, 'SAME').numpy(); ero = -tf.nn.max_pool2d(-b, 3, 1, 'SAME').numpy()
        b = np.where(dick[:, None, None, None] > 0, dil, np.where(dick[:, None, None, None] < 0, ero, b))
        thr = (rng.uniform(0.2, 0.6, len(b)) if r else np.full(len(b), 0.4))[:, None, None]
        out += [glyphe(m) for m in (b[..., 0] > thr)]
    return np.array(out)
Xm = mnist_aufbereiten(mn['x_train'], 3); Ym = np.concatenate([mn['y_train']] * 3)
Xt = mnist_aufbereiten(mn['x_test'], 1); Yt = mn['y_test']
Xd = np.fromfile(f'{D}/druck.x', np.uint8).reshape(-1, 28, 28).astype(np.float32) / 255; Yd = np.fromfile(f'{D}/druck.y', np.uint8)
nd = len(Xd) * 9 // 10
X = np.concatenate([Xm, Xd[:nd]])[..., None]; Y = np.concatenate([Ym, Yd[:nd]])
print('Training', X.shape, flush=True)
ein = tf.keras.Input((28, 28, 1)); h = ein
for i, c in enumerate([16, 32]):
    h = tf.keras.layers.Conv2D(c, 3, padding='same', activation='relu', name=f'c{i+1}')(h); h = tf.keras.layers.MaxPooling2D(2)(h)
h = tf.keras.layers.Flatten()(h); h = tf.keras.layers.Dropout(0.3)(h)
h = tf.keras.layers.Dense(64, activation='relu', name='d1')(h); h = tf.keras.layers.Dropout(0.3)(h)
o = tf.keras.layers.Dense(11, name='aus')(h)
m = tf.keras.Model(ein, o)
m.compile(optimizer=tf.keras.optimizers.Adam(2e-3), loss=tf.keras.losses.SparseCategoricalCrossentropy(from_logits=True), metrics=['accuracy'])
m.fit(X, Y, batch_size=128, epochs=8, validation_data=(Xt[..., None], Yt), verbose=2)
print('MNIST-Test (Handschrift) %.4f' % (m.predict(Xt[..., None], verbose=0).argmax(1) == Yt).mean())
print('Druckschrift zurückgehalten %.4f' % (m.predict(Xd[nd:, ..., None], verbose=0).argmax(1) == Yd[nd:]).mean(), flush=True)
schichten, blobs = [], []
for n in ['c1', 'c2', 'd1', 'aus']:
    w, b = m.get_layer(n).get_weights(); sk = float(np.abs(w).max() / 127.0) or 1e-8
    blobs.append(np.clip(np.round(w / sk), -127, 127).astype(np.int8).tobytes()); schichten.append({'name': n, 'form': list(w.shape), 'skala': sk, 'bias': [round(float(v), 6) for v in b]})
roh = {'klassen': list('0123456789/'), 'schichten': schichten, 'daten': base64.b64encode(b''.join(blobs)).decode()}
open(f'{D}/foto-ziffern.js', 'w').write('/* MeinKamerad – Gewichte des Ziffernnetzes (handgeschriebene und gedruckte Ziffern, Schrägstrich). Trainiert mit MNIST (CC BY-SA 3.0, Y. LeCun und C. Cortes) und künstlich erzeugten Druckziffern. Nicht von Hand bearbeiten. */\nwindow.FOTO_ZIFFERN = ' + json.dumps(roh, separators=(',', ':')) + ';\n')
np.save(f'{D}/zref_x.npy', Xt[:20]); np.save(f'{D}/zref_p.npy', tf.nn.softmax(m.predict(Xt[:20, ..., None], verbose=0)).numpy())
print('fertig', flush=True)
