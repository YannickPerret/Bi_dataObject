const fastify = require('fastify')({ logger: true })
const AwsDataObjectImpl = require('./libs/AwsDataObjectImpl');
require("dotenv").config();
const cors = require('@fastify/cors')
const multer = require('fastify-multer');
const upload = multer({ dest: 'uploads/' });
const fs = require('fs');

const dataObject = new AwsDataObjectImpl(process.env.BUCKET_NAME, process.env.REGION, process.env.ACCESS_KEY_ID, process.env.SECRET_ACCESS_KEY);

fastify.register(cors, {
    origin: '*',
    methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
})

fastify.register(multer.contentParser);

fastify.get('/', function handler (request, reply) {
    reply.send({ hello: 'hello world hacker !' })
})

fastify.post('/upload', { preHandler: upload.single('image') }, function (request, reply) {
    const file = request.file;

    if (!file) {
        reply.status(400).send({ error: 'Aucun fichier téléchargé.' });
        return;
    }

    dataObject.doesBucketExist().then(() => {
        const fileName = file.originalname;
        dataObject.uploadObject(file.path, 'images/' + fileName)
            .then((bucketUrl) => {
                console.log(bucketUrl)
                fs.unlink(file.path, (err) => {
                    if (err) {
                        console.error(err)
                        return
                    }
                });
                reply.send({ message: 'Image téléchargée avec succès.', url: bucketUrl });
            })
            .catch((err) => {
                reply.status(500).send({ error: err.message });
            });
    }).catch((err) => {
        reply.status(500).send({ error: err.message });
    });
});



  // Run the server!
fastify.listen({port: process.env.API_PORT, host: '127.0.0.1'}, (err, address) => {
    if (err) throw err
    console.log(`server listening on http://localhost:${fastify.server.address().port}`)
})
