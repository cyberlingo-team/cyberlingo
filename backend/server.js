// Lance le serveur de l'API. `npm run dev` le relance à chaque modification de fichier.
import 'dotenv/config'
import app from './app.js'

const port = Number(process.env.PORT) || 4000
// Par défaut, le serveur n'écoute que sur cette machine : l'interface l'appelle à travers le
// proxy de Vite. HOST=0.0.0.0 l'ouvrirait au réseau.
const host = process.env.HOST || '127.0.0.1'

app.listen(port, host, () => {
  console.log(`API CyberLingo prête sur http://${host === '127.0.0.1' ? 'localhost' : host}:${port}/api`)
})
