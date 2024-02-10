/**
 * gestionnaire de contenu: gère les données de la bdd (befor 1.2)
 */

const fs = require('fs');
class Content {
    constructor() {
        this.allQuests = []; //toutes les questions
        this.allThemes = []; //tous les themes

        this.questions = []; //questions choisies
        this.playedQuests = []; //questions jouées
        this.themes = []; //themes choisis
        this.readData();
        
    }
    /**
     * commence une partie
     * @param {[number]} theme liste des id de themes
     */
    begin (theme) { 

    }
    /**
     *  Choix de la prochaine question
     */
    /*next () {
        //choose à random question
        let choose =false;
        let l = this.questions.length;
        let u = 0;
        let useTab = [];
        let q;
        
        while(!choose) {
            u = this.getRandInt(l);
            //rempli le tableau des indices utilisées
            q = this.questions[u];
            
            choose = true;
            for(let played of this.playedQuests) {
                if (played.id == q.id)choose=false;
            }
            
        }
        this.playedQuests.push(q);
        return q;
    }*/


    /**
     * question suiviante
     */
    next () {
        let dispo = [];
        let ret = {}; //returned question
        //on parcourt le tableau des questions
        for(let q of this.questions) {
            let choose = true;
            for(let played of this.playedQuests) {
                if (played.id == q.id)choose=false;
            } 
            if (choose) dispo.push(q);
        }
        
        if (dispo.length ==0) {
            return null;
        
        }else {
            let choosed = dispo[this.getRandInt(dispo.length)];
            this.playedQuests.push(choosed);
            return choosed;
        }
    }
    /**
     * choix des themes, et des questions en fonctions des themes choisis 
     * @param {array of number} themes liste des themes 
     */
    setThemes(themes) {
        
        for(let q of this.allQuests) {
            if(themes.indexOf(q.theme) != -1) {
                this.questions.push(q);
            }
        }
    }

    /**
     * Création d'une nouvelle question
     * @param {object} q 
     * @param {function} callback 
     */
    createQuestion(q, callback) { //quest, answer, theme
        //creation d'un id auto-increment à partir du dernier element
        if(this.allQuests.length > 0) {
            q.id = parseInt(this.allQuests[this.allQuests.length - 1].id) + 1;
        } else {
            //si le tableau est vide alors la première question prend l'id 1
            q.id = 1;
        }
        // on push
        this.allQuests.push(q);
        this.saveData();
        //callback
        if (typeof(callback)!="undefined") {
            var err;
            callback(this.allQuests, err);
        }
        
    }

    /**
     * Modifier une question
     * @param {object} q 
     * @param {function} callback 
     */
    editQuestion(q, callback) {
        let l = this.allQuests.length;
        for(let i = 0;i<l;i++) {
            if(this.allQuests[i].id == q.id) {
                this.allQuests[i] = q;
            }
        }
        //save
        this.saveData();
        if(typeof(callback)!="undefined") {
            var err;
            callback(this.allQuests, err);
        }
    }
    /**
     * supprime une question
     * @param {number} id id de la question
     * @param {function} callback finction de rappelle
     */
    deleteQuest(id, callback) {
        let i = 0;
        let del = false;
        for(let q of this.allQuests) {
            if(q.id == id) del = true;
            if(del && i < length(this.allQuests) - 1)
                this.allQuests[i] = this.allQuests[i+1];
            i++;
        }
        //supprime le dernier element
        this.allQuests.pop();
        //sauvegarde
        this.saveData();
        if(typeof(callback)!="undefined") {
            var err;
            callback(this.allQuests, err);
        }
    }


    /**
     * Obtient toute la liste des themes
     * @param {function} callback fonction de rappelle
     */
    getThemesList(callback) {
        if(typeof(callback) == 'function') {
            //send questions in call
            callback(this.allThemes);
        }
            
        
    }

    /**
     * 
     * @param {*} theme 
     * @param {*} callback 
     */
    getQuestsList (theme, callback) {
        var res = [];
        for(let q of this.allQuests) {
            if (q.theme == theme) {
                res.push(q);
            }
        }
        if(typeof(callback) == 'function') {
            //send questions in call
            callback(res);
        }
    }


    /**
     * deprecated since 1.2 -> this.db doesn't exist
     */
    getImagesList() {
        /*this.db.query('SELECT * FROM ql_images', (err, res)=>{
            if (err) throw err;
            this.images = res;

        });*/
    }


    /**
     * deprectated since 1.2
     * @param {*} id 
     */
    getImageName(id) {
        let res = null;
        console.log(id );
        for(let i of this.images) {
            
            if (i.id == id) {
                res = i.name;
            }
        }
        return res;
    }


    /**
     * deprecated since 1.2
     * @param {*} name 
     * @param {*} callback 
     */
    addImage(name, callback) {
       /* this.db.query('INSERT INTO ql_iamges(name) VALUES(\{'+name+'\')', (err, res)=>{
            if (typeof(callback) == 'function') {
                callback(err, res);
            }
        });*/
    }

    /**
     * obtient un chiffre aleatoire entre 0 et Max
     * @param {number} max maximum 
     */
    getRandInt(max) {
        return Math.floor(Math.random()*Math.floor(max));
    }

    /**
     * lecture des fichiers de données
     */
    readData () {
        //lecture des fichiers JSON
        fs.readFile('app/data/questions.json', (err, data) => {
            if(err)throw err;
            this.allQuests=JSON.parse(data).quests;
            
        });
        fs.readFile('app/data/themes.json', (err, data) => {
            if(err)throw err;
            this.allThemes=JSON.parse(data).themes;
        });

    }

    /**
     * sauvegrade du fichier de données
     */
    saveData () {
        //sauvegarde des question
        let saveQ = {
            quests : this.allQuests
        };
        fs.writeFile('app/data/questions.json', JSON.stringify(saveQ), (err)=>{
            if(err)throw err;
        });
        //sauvegarde des themes
        let saveT = {
            themes : this.allThemes
        }
        fs.writeFile('app/data/themes.json', JSON.stringify(saveT), (err)=>{
            if(err)throw err;
        });
    }
}

module.exports = Content;