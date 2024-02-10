// gestion du jeu

console.log('yo');
const base = '..'
class ControllerGame {
    constructor(legend) {
        
        this.repeat;
        this.qList = [];
        this.tList = [];
        this.themeSelected;
        this.step0 = $('#step0'); //question manager
        this.step1 = $('#step1'); //play : set playres
        this.step2 = $('#step2'); //play : choose theme
        this.step3 = $('#step3');
        this.editQuest;
        this.playerSelected = {};
        this.quest = {};
        this.musicPlay = -1; //id de la musique
        this.musics = ['generique.mp3', 'applause1.mp3', 'question.mp3', ''];
        
        this.legend = legend;
        this.lastBuzz = null;
        this.steps = ["home", "identify", "themes", "play"];
        this.step = "home";
        this.questions = [];
        this.chosenQuestion = [];
        this.themes = [];
        this.initializeGame();
        this.initEvents();
        this.loadDataBase();

        this.availableColors =[[255, 0, 0], [0, 255, 0], [0, 0, 255], [255, 255, 0], [255, 0, 255]];
        this.buzzerTab = {};
        /* 
        player = {
            color: "str",
            name: "str",
            id : "int",
            penalityTime: "int",
        }
        question = {
            value : "",
            type: "",
            theme: "",
            answer: "",
        }
        */
    }
    addNewBuzzer(address) {
        // check if the address exist
        if (!Object.keys(this.buzzerTab).includes(address) && this.availableColors.length > 0) {
            this.buzzerTab[address] = this.availableColors.pop();
        }
    }
    colorToBuzzColor(color) {
        return [
            {type : "int", r : color[0]},
            {type : "int", g : color[1]},
            {type : "int", b : color[2]}
        ]
    }
    colorToHtmlColor(color) {
        return "rgb("+color[0]+", "+color[1]+", "+color[2]+")";
    }
    getBuzzerColor(address) {
        return this.buzzerTab[address];
    }
    hideAllSteps() {
        for (let step of this.steps) {
            this.hideStep(step);
        }
    }
    showStep(step) {
        $("#step-"+step).show();
    }
    hideStep(step) {
        $("#step-"+step).hide();
    }
    getSyncJson(url, cb) {
        $.ajax({
            async: false,
            url, url,
            dataType: "json",
            success: (data) => cb(data),

        });
    }
    loadDataBase() {
        console.log("Load dataBase");
        this.getSyncJson("data/questions.json", (data)=>{
            this.questions = data.quests;
            console.log(data);
        });
        this.getSyncJson("data/themes.json", (data)=>{
            this.themes = data.themes;
            console.log(data);
        });
    }
    initializeGame() {
        //set default state
        // steps : home, identify, thems, play
        this.legend.setState({
            step:  this.steps[0],
            more: false,
            players:   [],
            question:  null,
            themes: [],
            buzzing: null,
        });
    }

    initEvents() {
        // when a player buzz
        this.legend.onDeviceEvent((name, from, event) => {
            console.log("new Device event = " + event + "; device address = " + from);
            let state = this.legend.getState();
            let buzzActivated = state.buzzing != null;
            if(state.step == "identify" && !buzzActivated) {
                let theEvent = "";
                if(name=="mushroom") {
                    this.addNewBuzzer(from);
                    theEvent = this.getBuzzerColor(from);
                } else {
                    theEvent = event;
                }
                this.legend.updateStateElement("buzzing", {
                    id: this.colorToHtmlColor(theEvent),
                    name: "",
                    color: this.colorToHtmlColor(theEvent),
                });
                this.legend.sendDeviceData(from, this.colorToBuzzColor(theEvent))

                
            } else if (state.step == "play" && !buzzActivated) {
                let theEvent = "";
                if(name=="mushroom") {
                    theEvent = this.getBuzzerColor(from);
                } else {
                    theEvent = event;
                }
                for (let player of state.players) {
                    //check also id there is a penality
                    if (player.id == this.colorToHtmlColor(theEvent) && player.penalityTime < Date.now()) {
                        this.legend.updateStateElement("buzzing", {
                            id: this.colorToHtmlColor(theEvent),
                            name: player.name,
                            color: this.colorToHtmlColor(theEvent),
                        });
                    }
                }
            } 

        });
        //when game state changes
        this.legend.onStateChange((from, state) => {
            if (state.step !== undefined) {
                console.log("New state !");
                this.hideAllSteps();
                this.showStep(state.step);
                switch(state.step) {
                    case "identify":
                        this.manageIdentityStep(state);
                        break;
                    case "themes":
                        this.manageThemeStep(state);
                        break;
                    case "play":
                        this.managePlayStep(state);
                        break; 
                }
                this.step = state.step;
            }
        });
        $('#game-manager').on('click', (e) => {
            //this.showThemList();
        });
        $('#start-game').on('click', (e) => {
            this.legend.updateStateElement(
                "step", this.steps[1]
            );
        });
        $('.master #player-save-button').on('click', (e) => {
            let name = $('#player-name').val();
            $('#player-name').val("");
            let state = this.legend.getState();
            let playerExist = false;
            for (let player of state.players) {
                if (player.id == state.buzzing.id) {
                    playerExist = true;
                    player.name = name;
                }
            }
            if (!playerExist) {
                state.players.push({
                    id: state.buzzing.id,
                    color: state.buzzing.color,
                    name: name,
                    penalityTime: 0,
                    score: 0,
                });
            }
            state.buzzing = null;
            this.legend.setState(state);
        });
        $('.master .next-player').on('click', () => {
            this.legend.updateStateElement(
                "step", this.steps[2]
            );
        });
        $('.master #next-theme').on('click', () => {
            this.chooseQuestions();
            this.legend.updateStateElement(
                "step", this.steps[3]
            );
        });
        $('.master #quest-next').on('click', () => {
            //prochaine question
            this.legend.sendToMonitor("next");
            /*let state = this.legend.getState();
            state.question = null;
            state.more = false;
            state.buzzing = null;
            this.legend.setState(state);*/
        });
        $('.master #quest-quest').on('click', () => {
            //bonne réponse
            this.legend.sendToMonitor("quest");
        });
        $('.master #quest-play').on('click', () => {
            //affiche des éléments supplémentaires
            this.legend.updateStateElement("more", true);
            
        });
        $('.master #quest-false').on('click', () => {
            this.legend.sendToMonitor("false");
            console.log("faux");
            //this.legend.updateStateElement("buzzing", null);
            //mauvaise réponse
        });
        $('.master #quest-true').on('click', () => {
            //bonne réponse
            this.legend.sendToMonitor("true");
        });
        
    }

    initDynamicEvents() {
        $('.master .check-theme').on('click', () => {
            //envoie au serveur les themes choisis
            let selected = [];
            console.log("coucou");
            $('.master .check-theme:checked').each(function (i) {
                selected[i] = $(this).parent().parent().attr('id').replace('theme-el-', '');
            });
            console.log(selected);
            this.legend.updateStateElement(
                "themes", selected
            );
        });
    }

    manageIdentityStep(state) {
        let playerBlock = $("#player-edit-block");
        if(state.buzzing != null) {
            playerBlock.show();
            $("#player-id").text(state.buzzing.id);
        }else{
            playerBlock.hide();
        }
    }

    manageThemeStep(state) {
        if (state.step != this.step) {
            let themeList = $('#themes-list');
            for (let t of this.themes) {
                themeList.append('<div class="theme-list-element" id="theme-el-' + t.id + '"><div class="thumb">'
                    + '<img src="image/' + t.image + '"></div><p>' + t.name + '</p>'
                    + '<p><input type="checkbox" class="check-theme"></p></div>');
            }
            this.initDynamicEvents();
        }
    }

    getRandInt(max) {
        return Math.floor(Math.random()*Math.floor(max));
    }

    chooseQuestions() {
        // create a random list of questions
        let state = this.legend.getState();
        let chosenThemes = state.themes;
        for (let question of this.questions) {
            if (chosenThemes.includes(question.theme)) {
                this.chosenQuestion.push(question);
            }
        }
        console.log(this.chosenQuestion);
    }

    nextQuestion() {
        let len = this.chosenQuestion.length;
        let index = this.getRandInt(len)
        let quest = this.chosenQuestion[index];
        this.chosenQuestion.splice(index, 1);
        console.log(index);
        return quest;
    }

    managePlayStep(state) {
        if (state.question!=null) {
            //show the question
            $("#quest-answer").text(state.question.answer);
            $("#quest-box p").text(state.question.quest);
            if (state.buzzing!=null) {
                // show action buttons
                $(".false-true-buttons").show();
                $('.master #quest-buzzing').css({ 'background-color': state.buzzing.color });
                $('.master #quest-buzzing p').text('id ' + state.buzzing.id + ': ' + state.buzzing.name);
                $("#quest-buzzing").show();
            }else{
                //hide action buttons
                $(".false-true-buttons").hide();
                $("#quest-buzzing").hide();
            }
        }else{
            //choose a new question
            $(".false-true-buttons").hide();
            this.legend.updateStateElement("question", this.nextQuestion()) ;

        }
    }
    
    













    refresh() {
        $('.master .step-block').addClass('hide');
        $('.master #step' + this.step).removeClass('hide');
        console.log(this.step);
        if (this.step == 0) {

            this.hideStep0();
            this.showMenu();

        }
        if (this.step == 1) {
            this.hideStep1();
            this.step1.append('<div id="player-edit-block"></div><div class="next-player"><p>Suivant</p></div>');
            this.playerSelected.id = -1;
            $('.master .next-player').on('click', () => {
                this.changeStep(2);
            });
        }
        if (this.step == 2) {
            this.hideStep2();
            this.showStep2();
        } if (this.step == 3) {
            this.hideStep3();
            this.showStep3(null);
        }
    }

    headerButtons() {
        //creatoin des evenements pour les boutons du header
        //bouton gestion de la musiquem
        var me = this;
        $('.master .header-button').on('click', function () {
            //reccupere l'id du bouton pour jouer la bonne musique
            let mp = parseInt($(this).attr('id').replace('play-music-', ''));
            me.musicPlay = mp;
            //envoie au serveur la consigne
            $.post(base + '/server', {
                from: 'master',
                action: 'playMusic',
                music: me.musics[mp],
                musicAction: 'play'

            }, (res) => {

            });
        });
    }
    hideStep0() {
        $(this.step0).html('');

    }
    hideStep1() {
        $(this.step1).html('');
    }
    hideStep2() {
        $(this.step2).html('');
    }
    hideStep3() {
        $(this.step3).html('');
    }

    /*showMenu() {

        $(this.step0).html('<div class="menu-item" id="start-game"></div> <div class="menu-item" id="game-manager"></div>');
        //creation des evenements
        $('#game-manager').on('click', (e) => {
            this.showThemList();
        });
        $('#start-game').on('click', (e) => {
            this.changeStep(1);
        });
    }*/
    showQuestList(theme) {
        //envoie une requette reccupération de la liste des questions
        $.post(base + '/server', {
            from: 'master',
            action: 'getQuestList',
            theme: theme
        }, (data) => {
            this.hideStep0();
            console.log(data);
            this.qList = data; //reccupére la liste des questions
            //affiche la liste des question
            for (let q of this.qList) {
                //décode la chaine
                let tab = q.quest.split('/');
                if (tab == 1) {
                    //type de question
                }
                this.step0.append('<div class="quest-list-element" id="quest-el-' + q.id + '"><div class="quest-list-in"><p>' + tab[0] + '</p><div class="delete"></div><div></div>');
            }
            //ajouter une question
            this.step0.append('<div class="add-quest"></div>');
            /*
            *evenements
            */
            var me = this;
            //modifier
            $('.master .quest-list-element').on('click', function () {
                let id = $(this).attr('id').replace('quest-el-', '');
                me.editQuest = me.getQuestById(id);
                me.hideStep0();
                me.showNewQuest(me.editQuest);
            });
            //supprimer
            $('.master .quest-list-element .delete').on('click', function () {
                let id = $(this).parent().parent().attr('id').replace('quest-el-', '');
                //confirmation
                $.post(base + '/server', {
                    from: 'master',
                    action: 'deleteQuest',
                    id: id
                }, (res) => {
                    if (res.state == 'success')
                        me.showQuestList(me.themeSelected);
                });
            });
            //ajouter
            $('.master .add-quest').on('click', function () {
                me.editQuest = null;
                me.hideStep0();
                me.showNewQuest(null);
            });
        });

    }
    showThemList() {
        $.post(base + '/server', {
            from: 'master',
            action: 'getThemesList'
        }, (data) => {
            this.hideStep0();
            this.tList = data;
            //réccupère la liste des thèmes
            this.step0.append('<center><h2>Liste des thèmes</h2></center>');
            for (let t of this.tList) {
                this.step0.append('<div class="theme-list-element" id="theme-el-' + t.id + '"><div class="thumb"><img src="../image/' + t.image + '"></div><p>' + t.name + '</p></div>');
            }
            //creation d'un theme
            this.step0.append('<center><h2>Création d\'un thème</h2></center>');
            this.step0.append('<form method="post" action="../upload" id="add-theme-form"><div id="add-theme-box"><div class="left">'
                + '<p>Nom du thème</p><input type="text" id="add-theme-name" name="name">' //text box
                + '<input type="hidden" id="add-theme-from" name="from" value="master">'
                + '<input type="hidden" id="add-theme-action" name="action" value="sendImage">'
                + '<p>Image de présentation</p><input type="file" id="add-theme-image">' //transfert de fichier
                + '</div><div class="right"> <div class="button" id="add-theme-button"></div> </div></div></form>');
            //creatioin des evenements
            var me = this;
            $('.master .theme-list-element').on('click', function () {
                //liste des questions
                let theme = $(this).attr('id').replace('theme-el-', '');
                me.themeSelected = theme;
                me.showQuestList(theme);
            });
            $('.master #add-theme-button').on('click', function () {
                //ajoute un nouveau theme
                let name = $('.master #add-theme-name').attr('value');
                var data = new FormData();
                let file = $('.master #add-theme-image')[0].files[0];
                data.append('image', file, file.name);
                data.append('name', name);
                data.append('from', 'master');
                data.append('action', 'sendImage');
                console.log(file);
                $('.master #add-theme-form').submit();
                /*$.post(base+'/server', {
                    from : 'master',
                    action: 'sendImage',
                    name: name,
                    data: data
                }, (data)=>{
                    me.showThemList();
                })
                $.ajax({
                    url: base+'/upload',
                    data: data,
                    cache: false,
                    contentType: false,
                    processData: false,
                    method: 'post',
                    type: 'post', // For jQuery < 1.9
                    success: function(data){
                        alert(data);
                    }
                })*/


            });
        })
    }
    showNewQuest(data) { //null pour nouveau
        //4 type de questions=>1:normale, 2:multiple, 3:musique
        if (data == null) {
            //nouvelle question
            this.step0.append('<form id="quest-edit"><h2>Question</h2><textarea id="quest-edit-quest"></textarea>'
                + '<div class="quest-type-block"><h2>Type de question : </h2><select id="quest-edit-type"><option selected value="normal">Réponse unique</option><option value="multiple">Réponse multiple</option><option value="image">Avec Image</option><option value="audio">Ecoute</option></select></div>'
                + '<div><h2>Réponse</H2><input type="text" id="quest-edit-answer"></div>'
                + '<div id="quest-edit-media" class="hide"><input type="file"></div>'
                + '<div id="quest-edit-submit"></div>');

        } else {
            //editer une question
            this.step0.append('<form id="quest-edit"><h2>Question</h2><textarea id="quest-edit-quest">' + data.quest + '</textarea>'
                + '<div class="quest-type-block"><h2>Type de question : </h2><select id="quest-edit-type"><option ' + (data.type == 1 ? 'selected' : '') + ' value="normal">Réponse unique</option><option  ' + (data.type == 2 ? 'selected' : '') + ' value="multiple">Réponse multiple</option><option ' + (data.type == 3 ? 'selected' : '') + '  value="image">Avec Image</option><option  ' + (data.type == 4 ? 'selected' : '') + ' value="audio">Ecoute</option></select></div>'
                + '<div><h2>Réponse</H2><input id="quest-edit-answer" type="text" value="' + data.answer + '"></div>'
                + '<div  class="hide quest-media-div"><input type="file" id="quest-edit-media"></div>'
                + '<div id="quest-edit-submit"></div>');
        }
        //ajout des événements
        $('.master #quest-edit-type').on('change', () => {
            let media = $('#quest-edit-media');
            switch ($('.master #quest-edit-type option:selected').attr('value')) {

                case 'normal':
                    media.addClass('hide');
                    break;
                case 'multiple':
                    media.addClass('hide');
                    break;
                case 'image':
                    media.removeClass('hide');
                    break;
                case 'audio':
                    media.removeClass('hide');
                    break;
            }
            //evenement save

        });
        $('.master #quest-edit-submit').on('click', () => {
            let type = 1;
            switch ($('.master #quest-edit-type option:selected').attr('value')) {

                case 'normal':
                    type = 1;
                    break;
                case 'multiple':
                    type = 2;
                    break;
                case 'image':
                    type = 3;
                    break;
                case 'audio':
                    type = 4;
                    break;
            }
            if (this.editQuest == null) {
                //nouvelle question 
                var q = {
                    type: type,
                    quest: $('.master #quest-edit-quest').val(),
                    answer: $('.master #quest-edit-answer').val(),
                    theme: this.themeSelected
                }

                $.post(base + '/server', {
                    from: 'master',
                    action: 'addQuest',
                    q: q
                }, (res) => {
                    if (res.state == 'success') {
                        this.showQuestList(this.themeSelected);

                    }
                });

            } else {
                //Edition de question
                var q = {
                    id: this.editQuest.id,
                    type: type,
                    quest: $('.master #quest-edit-quest').val(),
                    answer: $('.master #quest-edit-answer').val(),
                    theme: this.themeSelected,

                }
                $.post(base + '/server', {
                    from: 'master',
                    action: 'editQuest',
                    q: q
                }, (res) => {
                    if (res.state == 'success') {
                        this.showQuestList(this.themeSelected);

                    }
                });
            }
        });

    }

    getQuestById(id) {
        let ret = null;
        for (let q of this.qList) {
            if (q.id == id) ret = q;
        }
        return ret;
    }

    /*showStep1(p) {
        //ajout des joueurs
        //demande au serveur quel joueur sélectionné (pour entrer le nom des joueurs)
        let block = $('.master #player-edit-block');
        //console.log(p);
        if (p == null || typeof (p) == 'undefined') {
            //y'a rien on efface 
            block.html('');
            this.playerSelected.id = -1;
        } else
            if (p.id != this.playerSelected.id) {
                //console.log(p);
                this.playerSelected = p;

                block.html('');
                block.append('<h2>Joueur id:' + p.id + '</h2>');
                block.append('<input type="text" id="player-name">');
                block.append('<div id="player-save-button"></div>');
                //evenement
                $('.master #player-save-button').on('click', () => {
                    //envoie le nom du joueur au serveur
                    $.post(base + '/server', {
                        from: 'master',
                        action: 'step1',
                        name: $('.master #player-name').val()
                    }, (res) => {

                    });
                });
            }
    }*/

    showStep2(data) {
        //choix des thèmes pou les questions
        //Affiche la liste des thèms disponible (avec case à cocher)
        //à chaque fois qu'une case est coché on envoie la liste des thèmes cochés
        $.post(base + '/server', {
            from: 'master',
            action: 'getThemesList'
        }, (data) => {
            this.hideStep2();
            this.tList = data;
            //réccupère la liste des thèmes
            this.step2.append('<center><h2>Choisir les thèmes</h2></center>');
            for (let t of this.tList) {
                this.step2.append('<div class="theme-list-element" id="theme-el-' + t.id + '"><div class="thumb">'
                    + '<img src="../image/' + t.image + '"></div><p>' + t.name + '</p>'
                    + '<p><input type="checkbox" class="check-theme"></p></div>');
            }
            this.step2.append('<div id="next-theme"><p>Suivant</p></div>');
            $('.master #next-theme').on('click', () => {
                this.changeStep(3);
            });
            $('.master .check-theme').on('click', () => {
                //envoie au serveur les themes choisis
                let selected = [];

                $('.master .check-theme:checked').each(function (i) {
                    selected[i] = $(this).parent().parent().attr('id').replace('theme-el-', '');
                });
                $.post(base + '/server', {
                    from: 'master',
                    action: 'step2',
                    themes: selected
                }, (res) => {
                    //on n'attend pas de réponse
                });
            });
        });
    }
    showStep3(data) {
        if (data == null) {
            this.step3.append('<div class="step3-content"><h2>Question:</h2>'
                + '<div id="quest-box"><p></p></div><h2>Réponse:</h2><p id="quest-answer"></p>'
                + '<div id="quest-buzzing"><p></p></div>'
                + '<div class="action-buttons false-true-buttons hide"><div id="quest-true" class="quest-butt"><p>Vrai</p></div><div id="quest-false" class="quest-butt"><p>Faux</p></div></div>'
                + '<div class="action-buttons"><div id="quest-next" class="quest-butt"><p>></p></div><div id="quest-play" class="quest-butt"><p></p></div></div>');
            //events
            var me = this;
            $('.master .quest-butt').on('click', function () {
                let id = $(this).attr('id').replace('quest-', '');
                id = (id + '').charAt(0).toUpperCase() + id.substr(1);
                let mess = 'Quest' + id;
                console.log(mess);
                $.post(base + '/server', {
                    from: 'master',
                    action: mess
                }, (res) => {
                    if (res.status == 'success') {

                    }
                });

            });
            $('.master #quest-next').on('click', () => {
                //prochaine question
            });
            $('.master #quest-play').on('click', () => {
                //affiche des éléments supplémentaires
            });
            $('.master #quest-false').on('click', () => {
                //mauvaise réponse
            });
            $('.master #quest-true').on('click', () => {
                //bonne réponse
            });
        } else {
            //on entre les infos des questions
            if (data.quest != this.quest) {
                if (data.quest != null) {
                    this.quest = data.quest;
                    $('.master #quest-box p').text(this.quest.quest);
                    $('.master #quest-answer').text(this.quest.answer);
                } else {
                    //this.quest = data.quest;
                    $('.master #quest-box p').text("C'était la dernière question!!");
                    $('.master #quest-answer').text("Navré");
                }

            }
            //on affiche le joueur ayany buzzé le premier
            if (data.p != this.playerSelected) {
                //on affiche le joueur et sa couleur
                if (data.p != null) {
                    $('.master #quest-buzzing').css({ 'background-color': data.p.color });
                    $('.master #quest-buzzing p').text('id ' + data.p.id + ': ' + data.p.name);
                    $('.master .false-true-buttons').removeClass('hide');
                    this.playerSelected = data.p;
                } else {
                    $('.master #quest-buzzing').css({ 'background-color': 'white' });
                    $('.master #quest-buzzing p').text('');
                    $('.master .false-true-buttons').addClass('hide');
                }
            }
        }

    }

}

