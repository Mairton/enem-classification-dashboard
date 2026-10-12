# Como atualizar o painel publicado

O arquivo de trabalho é `../dashboard.html`, montado a partir de `../build/`.
Esta pasta é só a cópia publicada.

Depois de reconstruir o `dashboard.html`, rode a partir desta pasta:

```bash
cp ../dashboard.html index.html
cp -r ../build/. build/
git add -A
git commit -m "Update dashboard"
git push
```

O GitHub Pages republica em cerca de um minuto.
Link: https://mairton.github.io/enem-classification-dashboard/
