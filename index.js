const express = require('express')
const jwt = require('jsonwebtoken');
const app = express();
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.klyfg.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWTToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' });
        }
        // console.log('decoded', decoded);
        req.decoded = decoded;
        next();
    })
}

async function run() {
    try {
        await client.connect();
        const serviceCollecton = client.db('onlineShop').collection('services');

        // auth
        app.post('/logintoken', async (req, res) => {
            const user = req.body;

            console.log(user);
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '1d'
            });
            res.send({ accessToken });
        })

        // to get api
        app.get('/inventory', async (req, res) => {
            const query = {};
            const cursor = serviceCollecton.find(query);
            const result = await cursor.toArray();
            res.send(result)
        })
        app.get('/inventoryItems/:email', verifyJWTToken, async (req, res) => {
            const authEmail = req.decoded.email
            console.log(authEmail)
            console.log(req.params);
            const email = req.params?.email
            if (authEmail === email) {
                const query = { email: email };
                const cursor = serviceCollecton.find(query);
                const result = await cursor.toArray();

                res.send(result)

            } else {
                res.status(403).send({ message: 'forbidden access' })
            }
        })
        app.get('/inventory/:id', async (req, res) => {

            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const inventory = await serviceCollecton.findOne(query);
            res.send(inventory);
        })
        // to update api
        app.put('/inventory/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const inventory = await serviceCollecton.findOne(query);

            if (inventory) {
                console.log(inventory.quantity);
                const filter = { _id: ObjectId(id) };
                const options = { upsert: true };
                const updateDoc = {
                    $set: {
                        quantity: inventory.quantity - 1,
                        sold: parseInt(inventory.sold) + 1
                    },
                };
                const result = await serviceCollecton.updateOne(filter, updateDoc, options);
                console.log(result);
                res.send({ msg: "Added successfully!" });
            }
        })

        app.put('/inventoryCount/:id', async (req, res) => {
            console.log(req.body.quantity);
            const qty = req.body.quantity
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const inventory = await serviceCollecton.findOne(query);

            if (inventory) {
                console.log(inventory.quantity);
                const filter = { _id: ObjectId(id) };
                const options = { upsert: true };
                const updateDoc = {
                    $set: {
                        quantity: parseInt(inventory.quantity) + parseInt(qty),

                    },
                };
                const result = await serviceCollecton.updateOne(filter, updateDoc, options);
                console.log(result);
                res.send({ msg: "Added successfully!" });
            }
        })

        // to post api
        app.post('/inventory', async (req, res) => {
            const data = req.body;
            console.log(data);
            const result = await serviceCollecton.insertOne(data);
            res.send('result')

        })
        // to delete api
        app.delete('/inventory/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const result = await serviceCollecton.deleteOne(filter);
            res.send(result);
        })

    }
    finally {

    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Hello anik!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})