const express = require('express');
//sconst app = express();
const fs = require('fs');
const player = require('./player');
//const db = require('./db')
const content = require('./content');
//ecran principale
const screen = require('./../screen/js/screen');
//const multer = require('multer');
//const upload = multer({limits:{fileSize:4000000}, dest: './image'});
//const formidable = require('formidable');
const { timeStamp } = require('console');
/*
 étape:
    0 - presentation
    1 - creation des questions
    2 - choix des parties
    3 - attente joueur
    4 - definition joueur
    5 - lecture question
    6 - un utilisateur a buzzer
 */
class Game {
    constructor(app) {
        this.step = 0;
        this.players = [];
        this.screen = new screen();
        this.app = app;
        this.listen();
        this.buzzingId = -1; //personne ne buzz
        this.colorTab = ['#1108D5', '#BE1616', '#D9DC22', '#18B82E', '#FFFFFF', '#F61300', '#FF9FF3', '#949494', '#966129', '#FFFFFF'];
        this.manager = new content(); //gestionnaire de contenu
        this.themes = [];
        this.quest = {};
        this.questPrec = null;
        this.more = false;
        this.music = '';
        this.musicAction = '';
        this.answerState = '';
    }
    begin () {
        
    }

    /*
    * Cette fonction lit les demandes serveurs
    */
    listen () {
        var me =this;
        this.app.post('/server',function (req, res) {
            //res.writeHead('200', {'Content-Type': 'application/json'}); //renvoie un header json
            
            let from = req.body.from;
            //lecture de tous les type de requette
            switch (from) {
                case 'buzz':
                    let data = {action: req.body.action, id : req.body.id};
                    me.buzzListener(data, res);
                    break;
                case 'master':
                    me.masterListener(req.body, res);
                    break;
               
                
            }
        });
        this.app.get('/iot', function (req, res) {
            let from = req.body.from;
            me.iotListener(req.query, res);
        })
        //upload a file
        /*this.app.post('/upload', function (req, res) {
            const form = new formidable.IncomingForm();
            form.parse(req);
            console.log(req);
            form.on('fileBegin', function (name, file){
                file.path = __dirname + '/storage/' + file.name;
            });
            form.on('file', (name, file)=>{
                console.log(file.name);
            });
            res.status(200);
        })*/
        
    }
    iotListener(data, res) {
        //reccupération de l'id
        //on verifie si le buzzer est deja connnecté
        let id = data.id;
        let isPlayer = false;
        for(const play of this.players) {
            if(play.getId() == id) isPlayer = true;
        }
        if(!isPlayer) {
            let playi = this.players.length;
            this.players[playi] = new player(id); 
        }
        // un joueur a appuyer sur le buzz
        console.log('player buzz = ' + data.id);
        let p = this.getPlayerById(data.id);
        if(this.step==1){ 
                if(this.buzzingId==-1 && p.toObject().name == '') { 
                    this.buzzingId = data.id;
                    
                }
                
        }else if (this.step==3){
            if(this.buzzingId==-1 && p.toObject().name != '' && (!p.blocked())) { 
                this.buzzingId = data.id;
                
            }
        }
        
        this.screenListener();
        res.json({'state':'success'});
    }
    buzzListener(data, res) {
        if (data.action == 'log') {
            //Demande de connexion
            //on cherche un id existant en parcourant la liste des joueurs
            let ids = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
            let playi = this.players.length;
            for(const play of this.players) {
                ids = ids.filter((value, index, arr) => {
                    return value != play.getId();
                });
            }
            let ret; //données retournées à la page
            
            if (ids.length>0) {
                //il existe des ids disponibles on en retourne un avec un code sans erreur
                res.json({
                    status : 'success',
                    newId : ids[0],
                    color: this.colorTab[ids[0]]
                });
                //creation d'un joueur avec le premier id dispo
                this.players[playi] = new player(ids[0]);
                console.log('connection id = ' + playi);
            } else {
                //il n'y a plus d'id disponible on envoie un code d'erreur
                res.json({
                    status : 'players limit',
                    newId : -1
                });
            }

        } else if (data.action == 'press') {
            // un joueur a appuyer sur le buzz
            console.log('player buzz = ' + data.id);
            let p = this.getPlayerById(data.id);
            if(this.step==1){ 
                    if(this.buzzingId==-1 && p.toObject().name == '') { 
                        this.buzzingId = data.id;
                        
                    }
                    
            }else if (this.step==3){
                if(this.buzzingId==-1 && p.toObject().name != '' && (!p.blocked())) { 
                    this.buzzingId = data.id;
                    
                }
            }
            
            this.screenListener();
            res.json({'state':'success'});
        }
    }
    
    masterListener(data, res) {
        switch (data.action) {
            case 'changeStep':
                //changer d'étape
                this.step = parseInt(data.nextStep);
                
                if(this.step==3)this.manager.setThemes(this.themes);
                console.log('step = '+this.step);
                res.json({'state':'success'});
                break;
            case 'getStep' :
                //obtenir l'étape de jeu actuel
                let send = {};
                send.step = this.step;
                
                if(this.step==1) { 

                        let p = this.getPlayerById(this.buzzingId);
                        
                        if (p!=null) {
                            send.p = p.toObject();
                        }else send.p = null;
                }else if (this.step==3) {
                    send = this.processQuestMaster(send);
                }    
                        
                res.json(send);
                break;
            case 'addQuest':
                //ajouter une question
                this.manager.createQuestion(data.q, (ress, err)=> {
                    if(err) throw err;
                    res.json({'state':'success'});
                });
                break;
            case 'editQuest':
                //editer une question
                this.manager.editQuestion(data.q, (ress, err)=> {
                    if(err) throw err;
                    res.json({'state':'success'});
                });
                break;
            case 'deleteQuest':
                //supprimer une question
                this.manager.deleteQuest(data.id, (ress, err)=> {
                    res.json({'state':'success'})
                })
                break;
            //obtenir la liste des questions
            case 'getQuestList':
                this.manager.getQuestsList(data.theme, (quests) => {
                    res.json(quests);
                });
                break;
            //ajouter un thème
            //supprimer un thème
            case 'getThemesList':
                //obtenir la liste des thèmes
                this.manager.getThemesList((themes) => {
                    res.json(themes);
                });
                break;
            case 'sendImage':
                //ajouter une image
                //this.manager.addImage(data.names);
                //console.log(data);
                break;
            case 'step1':
                //enregistre un joueur
                let p = this.getPlayerById(this.buzzingId);
                p.name = data.name;
                this.buzzingId = -1;
                
                res.json({'status':'success'});
                break;
            case 'step2':
                //enregistre les themes
                this.themes = data.themes;
                console.log(this.themes);
             
                res.json({'status':'success'});
                break;
            case 'QuestPlay':
                //affiche des infos supplémenataires
                this.more = true;
                console.log(this.more);
                res.json({'status':'success'});
                break;
            case 'QuestFalse':
                //mauvaise réponse on block le buzzer du joueur
                let pl = this.getPlayerById(this.buzzingId);
                
                pl.blocBuzzer();
                
                //libère le buzzer 
                this.buzzingId = -1;
                this.more = false;
                this.answerState = 'false';
                console.log(this.answerState);
                res.json({'status':'success'});
                break;
            case 'QuestTrue':
                //bonne réponse
                //on ajoute des points aux joueurs
                this.questPrec = this.quest;
                this.quest = {};
                this.getPlayerById(this.buzzingId).right();
                this.buzzingId = -1;
                this.more = false;
                this.answerState = 'true';
                console.log(this.answerState);
                //sans oublier d'ajouter les points au joueur
                res.json({'status':'success'});
                break
            case 'QuestNext':
                //question suivante
                this.questPrec = this.quest;
                this.quest = {};
                this.buzzingId = -1;
                this.more = false;
                this.answerState = 'goNext';
                console.log(this.answerState);
                //personne ne prend les points
                res.json({'status':'success'});
                break;
            case 'playMusic':
                //activer une  musique
                let musicDef = data.music != null && typeof(data.music) != 'undefined';
                let musicActionDef = data.musicAction != null && typeof(data.musicAction) != 'undefined';
                if(musicDef && musicActionDef) {
                    //si une musique est demandée(ou arrêté)
                    this.music = data.music;
                    this.musicAction = data.musicAction;
                }
                res.json({'status':'success'});
                break;



        }
        this.screenListener();
       
    }
    screenListener() {
        //choisi une question 
        let send = {};
        send.step = this.step;
        //on envoie une demnade de lecture de music
        if(this.musicAction == 'play') {
            //jouer la music
            send.playMusic = this.music;
            this.musicAction = '';
        }
        //on envoie les données en fonction du step
        send.players = [];
        for(let p of this.players) {
            send.players.push(p.toObject())
        }
        switch(this.step) {
            case 0:
                
                
                break;
            case 1:
                //joueur ayant buzzé
                send.p = this.getPlayerById(this.buzzingId);
                if (send.p!=null) {
                    send.p = send.p.toObject();
                }
                //on envoie la liste des jours ayant été enregistré
                send.players = [];
                for(let p of this.players) {
                    if(p.name != "") {
                        send.players.push(p.toObject());
                    }
                }
                this.screen.showPlayerList(send);
                
                break;
            case 2:
                //on envoie la liste des themes choisi:
                this.manager.getThemesList((themes) => {
                    send.choosedThemes = [];
                    send.themes = themes;
                    
                    for(let t of themes) {
                        if(this.choosedTheme(t.id)) {
                            send.choosedThemes.push(t);
                        }
                    }
                    
                });
                this.screen.showThemeList(send);
                break;
            case 3:
                //on envoie le joueur qui a buzzé 
                
                //remet à zéro le more
                if(this.quest!=null) {
                    if(typeof(this.quest.quest)=='undefined') {
                        send.more = false;
                    }else {
                        send.more = this.more;
                        if(this.more) this.more=false;
                    }
                }else send.more = false;
                
                 //desamorce le "more"

                send.q=this.quest; //envoie de la question
                send.qprec = this.questPrec;
                send.p = this.getPlayerById(this.buzzingId);
                if (send.p!=null) {
                    send.p = send.p.toObject();
                }
                //etat de la question
                send.answerState = '';
                if (this.answerState!='') {
                    send.answerState = this.answerState;
                    console.log('envoie au screen :' + this.answerState);
                    this.answerState = '';
                }
                this.screen.showGame(send);
                break;
        }
        
        
    }
    processQuestMaster(send)  {
        //question suivante
        send.p = null;
        send.quest = null;
        if(this.quest!=null) { 
            if (typeof(this.quest.id) == 'undefined') {
                
                this.quest = this.manager.next();
                send.quest = this.quest;
                //on remet à zéro les buzzers
                this.buzzingId = -1;
                
            }else {
                //il y a une question en cours
                //on réccupère le joueur qui a buzzé
                send.quest = this.quest; //on envoie la question

                let p = this.getPlayerById(this.buzzingId);
                
                
                if (p!=null && typeof(p)!='undefined') {
                    send.p = p.toObject();
                }
            }
        } else {
            send.quest = null;
        }
        return send;
        
    }
    getPlayerById(id) {
        let player = null;
        for(let p of this.players) {
            if (p.id == id) player = p;
        }
        return player;
    }
    choosedTheme(themeId) {
        let choosed = false;
        if(this.themes != null && this.themes.length > 0) 
            for(let t of this.themes) {
                if( t == themeId )choosed = true;
            }
        return choosed;
    }

}

module.exports = Game;