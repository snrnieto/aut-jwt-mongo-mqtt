const express = require('express')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const bodyParser = require('body-parser');
const request = require('request');
var mqtt = require("mqtt");
require('dotenv').config();
const app = express()


app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

require('./database');
var User = require('./models/user');  

// Obtiene la información del usuario (si está activo)
app.get('/users/:id',validateToken, (req,res) =>{
    User.findOne({_id: req.params.id}, function(err, user) {  
        if(err){
            res.send("Usuario no encontrado\n"+err)
        }else{
            res.send(user); 
        } 
    })
});

// Crea un nuevo usuario en la base de datos. El usuario es
// creado con un estado {active: false}, responde con ID de
// usuario creado.
app.post('/users', (req,res) =>{
    let user = new User({name: req.body.name});  
    user.save(function(err,result){
        if (err){
            res.send(err);
        }
        else{
            res.send(result)
        }
    })
});

// Actualiza la información del usuario.
app.put('/users/:id',validateToken, (req,res) =>{
    User.findByIdAndUpdate(
        req.params.id,
        req.body,
        (err, result) => {
            if (err){
                res.status(500).send(err)
            }else{
                const response = {
                    message: "User updated succesfully",
                    id: req.params.id
                };
                return res.status(200).send(response);
            }
        }
    )
});

// Activa la cuenta del usuario
app.patch('/users/:id',validateToken, (req,res) =>{
    User.updateOne({ _id: req.params.id }, {
        active: true
      },

      (err, result) => {
        if (err){
            res.status(500).send(err)
        }else{
            const response = {
                message: "User active updated succesfully",
                id: req.params.id,
                result:result
            };
            return res.status(200).send(response);
        }
    }
      );
      
});

// Borra un usuario de la base de datos.
app.delete('/users/:id',validateToken, (req,res) =>{
    User.findByIdAndRemove(req.params.id, (err, todo) => {
        if (err) return res.status(500).send(err);
        const response = {
            message: "User deleted succesfully",
            id: req.params.id
        };
        return res.status(200).send(response);
    });
});

// Obtiene un token de autorización tipo JWT para el
// usuario solicitado (inicia sesión).
app.post('/authorization',(req,res) =>{
    const idUser = req.body;

    const user ={userid : idUser.id};
    
    const accessToken = generateAccessToken(user);

    res.header('authorization',accessToken).json({
        message:"Authenticated user",
        token:accessToken
    });
});


// Elimina el token de autorización para el usuario solicitado
// (cierra sesión).
app.delete('/authorization',validateToken,(req,res) =>{
    const accestToken = req.headers['authorization'];

    res.send({Token_deleted:accestToken})
});


// Envía un mensaje por MQTT con la siguiente estructura
// {“message”:[dato_curioso],”user”:[user_id]} al canal
// MQTT lyatest/[código_prueba].

app.post('/messages/send',validateToken,(req,res) =>{
    var client = mqtt.connect("mqtt://test.mosquitto.org");

    const accessToken = req.headers['authorization'];

    const decodeUser = jwt.decode(accessToken)

    request('https://jsonplaceholder.typicode.com/posts/1', (error, response, body) => {
        if(error){
            res.send("An error happened")
        }else{
            const message = {message:JSON.parse(body).title,user:decodeUser.userid};

            client.publish('lyatest/1', message);
    
            res.send({
                title:"Message sent succesfully",
                message:message
            });
        }
    });
    


});

function generateAccessToken(user){
    return jwt.sign(user,process.env.SECRET,{expiresIn: '5m'})
}

function validateToken(req,res,next){
    const accestToken = req.headers['authorization'];
    if(!accestToken){ 
        res.send('Access denied');
    }

    jwt.verify(accestToken,process.env.SECRET,(err,user) =>{
        if(err){
            res.send('Access denied, token expired or incorrect')
        }else{
            next()
        }
    })
}

app.listen(3000,() => {
    console.log("Server in port 3000")
})


