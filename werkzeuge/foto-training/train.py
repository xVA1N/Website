import sys, os, json, base64
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
import numpy as np, tensorflow as tf
K = sys.argv[1]; EP = int(sys.argv[2])
def lade(n):
    x = np.fromfile(f'{K}/{n}.x', dtype=np.uint8).reshape(-1, 64, 64, 1).astype(np.float32) / 255.0
    y = np.fromfile(f'{K}/{n}.y', dtype=np.uint8).reshape(-1, 3)
    return x, y
xs, ys = zip(*[lade(f'train{i}') for i in range(1, 6)]); X = np.concatenate(xs); Y = np.concatenate(ys)
Xv, Yv = lade('val'); Xr, Yr = lade('rau')
NS = int(Y[:, 1].max()) + 1
print('Training', X.shape, 'Symbolklassen', NS, flush=True)
ein = tf.keras.Input((64, 64, 1))
h = ein
for i, c in enumerate([16, 32, 48, 64]):
    h = tf.keras.layers.Conv2D(c, 3, padding='same', activation='relu', name=f'c{i+1}')(h)
    h = tf.keras.layers.MaxPooling2D(2)(h)
h = tf.keras.layers.Flatten()(h)
h = tf.keras.layers.Dropout(0.3)(h)
h = tf.keras.layers.Dense(128, activation='relu', name='d1')(h)
h = tf.keras.layers.Dropout(0.3)(h)
r = tf.keras.layers.Dense(4, name='rahmen')(h); s = tf.keras.layers.Dense(NS, name='symbol')(h); g = tf.keras.layers.Dense(12, name='groesse')(h)
m = tf.keras.Model(ein, [r, s, g])
loss = tf.keras.losses.SparseCategoricalCrossentropy(from_logits=True)
m.compile(optimizer=tf.keras.optimizers.Adam(2e-3), loss=[loss, loss, loss], loss_weights=[1, 1.5, 1], metrics=[['accuracy']] * 3)
aug = tf.keras.Sequential([tf.keras.layers.RandomTranslation(0.04, 0.04, fill_mode='constant'), tf.keras.layers.RandomZoom(0.06, fill_mode='constant')])
ds = tf.data.Dataset.from_tensor_slices((X, (Y[:, 0], Y[:, 1], Y[:, 2]))).shuffle(20000).batch(128).map(lambda a, b: (aug(a, training=True), b)).prefetch(4)
cb = [tf.keras.callbacks.ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=2, verbose=1)]
m.fit(ds, epochs=EP, validation_data=(Xv, (Yv[:, 0], Yv[:, 1], Yv[:, 2])), callbacks=cb, verbose=2)
for name, (xx, yy) in [('Prüfung normal', (Xv, Yv)), ('Prüfung krakelig', (Xr, Yr))]:
    p = m.predict(xx, verbose=0)
    acc = [float((p[i].argmax(1) == yy[:, i]).mean()) for i in range(3)]
    top3 = float((np.argsort(-p[1], 1)[:, :3] == yy[:, 1:2]).any(1).mean())
    print(name, 'Rahmen %.3f Symbol %.3f (Top-3 %.3f) Größe %.3f' % (acc[0], acc[1], top3, acc[2]), flush=True)
# Export: Int8 je Schicht mit Skalierung
schichten, blobs = [], []
for n in ['c1', 'c2', 'c3', 'c4', 'd1', 'rahmen', 'symbol', 'groesse']:
    w, b = m.get_layer(n).get_weights()
    sk = float(np.abs(w).max() / 127.0) or 1e-8
    q = np.clip(np.round(w / sk), -127, 127).astype(np.int8)
    blobs.append(q.tobytes()); schichten.append({'name': n, 'form': list(w.shape), 'skala': sk, 'bias': [round(float(v), 6) for v in b]})
daten = base64.b64encode(b''.join(blobs)).decode()
klassen = json.load(open(f'{K}/klassen.json'))
roh = {'klassen': {'rahmen': ['3', '6', '4', '1'], 'symbol': [k[0] for k in klassen] + ['000000'], 'groesse': ['00', '11', '12', '13', '14', '15', '16', '17', '18', '21', '22', '23']}, 'schichten': schichten, 'daten': daten}
open(f'{K}/foto-netz.js', 'w').write('/* MeinKamerad – Gewichte des Erkennungsnetzes für Fotos taktischer Zeichen (trainiert mit künstlich erzeugten Zeichen). Nicht von Hand bearbeiten. */\nwindow.FOTO_NETZ = ' + json.dumps(roh, separators=(',', ':')) + ';\n')
np.save(f'{K}/ref_x.npy', Xv[:20]); np.save(f'{K}/ref_p.npy', np.concatenate([tf.nn.softmax(t).numpy() for t in m.predict(Xv[:20], verbose=0)], 1))
m.save(f'{K}/netz.keras')
print('fertig', len(daten), flush=True)
