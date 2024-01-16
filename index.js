const fastify = require('fastify')({ logger: true })
const AwsDataObjectImpl = require('./libs/AwsDataObjectImpl');
const dotenv = require("dotenv");
const cors = require('@fastify/cors')
const multer = require('fastify-multer');
const upload = multer({ dest: 'uploads/' });
const fs = require('fs');
const path = require('path');

let dotEnvPath = path.join(__dirname, "..", ".env");

if (!fs.existsSync(dotEnvPath)) {
    dotEnvPath = path.join(__dirname, ".env");
}
dotenv.config({ path: dotEnvPath });

const dataObject = new AwsDataObjectImpl(process.env.BUCKET_NAME, process.env.REGION, process.env.ACCESS_KEY_ID, process.env.SECRET_ACCESS_KEY);

fastify.register(cors, {
    origin: '*',
    methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
})

fastify.register(multer.contentParser);

fastify.get('/', function handler(request, reply) {
    reply.send({ hello: 'hello world hacker !' })
})

fastify.post('/upload', { preHandler: upload.single('image') }, async (request, reply) => {
    const file = request.file;

    if (!file) {
        reply.status(400).send({ error: 'Aucun fichier téléchargé.' });
        return;
    }

    await dataObject.doesBucketExist().then(async () => {

        const fileContent = fs.readFileSync(file.path);

        // Obtenir l'extension du fichier
        const ext = path.extname(file.originalname).toLowerCase();
        const allowedExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'];

        // Vérifier si l'extension du fichier est dans la liste des extensions autorisées
        if (!allowedExtensions.includes(ext)) {
            fs.unlinkSync(file.path);
            reply.status(400).send({ error: 'Le fichier téléchargé n\'est pas une image.' });
            return;
        }

        // Vérifier si le fichier est déjà uploadé dans le bucket
        await dataObject.doesObjectExist('images/' + file.originalname).then(async (exist) => {
            if (exist) {
                //récupérer l'url de l'image
                await dataObject.publish('images/' + file.originalname).then((url) => {
                    reply.send({ message: 'Image téléchargée avec succès.', url: url });
                })
            }
            else {
                await dataObject.uploadObject(fileContent, 'images/' + file.originalname)
                    .then(async (bucketUrl) => {
                        fs.unlinkSync(file.path)
                        await dataObject.publish(bucketUrl.Key).then((url) => {
                            reply.send({ message: 'Image téléchargée avec succès.', url: url });
                        })
                    })
                    .catch((err) => {
                        reply.status(500).send({ error: err.message });
                    });
            }
        }).catch((err) => {
            reply.status(500).send({ error: err.message });
        });
    });
})

fastify.listen({ port: process.env.AWS_API_PORT, host: '127.0.0.1' }, (err, address) => {
    if (err) {
        fastify.log.error(err)
        process.exit(1)
    }
    console.log(`\x1b[33m[DataObject]\x1b[0m server listening on http://localhost:${fastify.server.address().port}`)
})
