var express = require('express')
var bodyParser = require('body-parser')
var app = express() //reference variable
var http = require('http').Server(app)
var io = require('socket.io')(http)
var mongoose = require('mongoose')

app.use(express.static(__dirname))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))
mongoose.Promise = Promise

var dbUrl = 'mongodb://localhost:27017/belajar_nodejs'
var Message = mongoose.model('Message', {nama: String, pesan: String}) //schema definition
var Badword = mongoose.model('Badword', {badword: String})

// var badword = new Badword({'badword': 'tes'})
// badword.save()

app.get('/pesan', function (req, res) {
    Message.find({}, function (err, pesan) {
        res.send(pesan)
    })
});

app.post('/pesan', async function (req, res) {

    try{
        var message = new Message(req.body)
        var badwords = []

        await Badword.find({}, function (err, kata) {
            kata.forEach(element => {
                badwords.push(element.badword)
            });
        })
        // console.log(req.body.pesan.replace(badwords[0], "t******"))
        badwords.forEach(element => {
            req.body.pesan = req.body.pesan.replace(element, "*".repeat(element.length))
        });

        var savedMessage = await message.save()
        console.log('tersimpan!')

        var sensor = await Message.findOne({pesan:'badword'});

        if (sensor) {
            await Message.deleteMany({_id: sensor.id})
        }else {
            io.emit('pesan', req.body)
        }
        res.sendStatus(200)
    } catch (error) {
        res.sendStatus(500)
        return console.log(error)
    } finally {
        console.log('post pesan dipanggil')
    }

});

io.on('connection', function (socket) {
    console.log('a user connected')
})

mongoose.connect(dbUrl, function (err) {
    console.log('koneksi ke mongodb berhasil', err)
})

var server = http.listen(3000, function () {
    console.log("port server adalah", server.address().port)
})