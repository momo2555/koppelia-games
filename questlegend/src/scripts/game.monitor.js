const base = ''; //do not change : deprecated

class MonitorGame {
    constructor(legend) {
        this.repeat;
        this.quest = {};
        this.content = $('.screen #content');
        this.q = {};
        this.buzzing = {id: null};
        this.sounds = {
            buzz: base + 'sound/ .wav'
        };
        this.audio = null;
        
        this.themes = [];
        this.questions = [];
        this.legend = legend;
        this.step = "home";
        this.steps = ["home", "identify", "themes", "play"];
        this.loadDataBase();
        this.initEvents();
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

    initEvents() {
        this.legend.onStateChange((from, state) => {
            if (state.step !== undefined) {
                this.hideAllSteps();
                this.showStep(state.step);
                switch(state.step) {
                    case "identify":
                        //this.manageIdentityStep(state);
                        this.showPlayerList(state);
                        break;
                    case "themes":
                        //this.manageThemeStep(state);
                        this.showThemeList(state);
                        break;
                    case "play":
                        //this.manageThemeStep(state);
                        this.showGame(state);
                        break;
                }
                this.step = state.step;
            }
        });
        this.legend.onData((from, data) => {
            let state = this.legend.getState();
            console.log("received data");
            switch(data) {
                case "false":
                    for (let player of state.players) {
                        if(state.buzzing.id == player.id) {
                            // add penality
                            player.penalityTime = Date.now() + 4000;
                        }
                    }
                    state.buzzing = null;
                    this.legend.setState(state);
                    this.playWrong();
                    break;
                case "true":
                    this.playApplause();
                    this.showWriteAnswer(state.question.answer);
                    for (let player of state.players) {
                        if(state.buzzing.id == player.id) {
                            // add penality
                            player.score += 1;
                        }
                    }
                    state.question = null;
                    state.more = false;
                    state.buzzing = null;
                    this.legend.setState(state);
                    break;
                case "next":
                    this.showWriteAnswer(state.question.answer);
                    state.question = null;
                    state.more = false;
                    state.buzzing = null;
                    this.legend.setState(state);
                    break;
                case "quest":
                    this.showQuestion(state.question.quest.split("/")[0]);
                    break;
            }
        });
    }

    showPlayerList(data) {
        $('.screen #right-answer').hide();
        $('.screen #quest-quest-bloc').hide();
        if (data.step != this.step) {
            let playerList = $("#step-identify")
            playerList.html('');
            //on affiche les element
            playerList.append('<div id="players-box">'
                + '<div id="players-box-in"><div id="players-box-in-color"></div></div>'
                + '<div id="players-list"></div></div>');
        } else {
            //on affiche la couleur du joueur ayant buzzé
            let col = 'transparent';

            if (data.buzzing != null) {
                col = data.buzzing.color;
            }
            $('.screen #players-box-in-color').css({
                'background-color': col
            });
            //on affiche la liste des joueurs en jeu
            $('.screen #players-list').html('');
            for (let p of data.players) {
                $('.screen #players-list').append('<div class="players-list-item" id="players-el-' + p.id + '">'
                    + '<div class="players-color" style="background-color: ' + p.color + ';"></div><div class="players-name"><p>' + p.name + '</p></div></div>')
            }
        }
    }

    showThemeList(data) {
        if (data.step != this.step) {
            let thmesStep = $("#step-themes");
            thmesStep.html('');
            //affiche l'interface
            let n = this.themes.length;
            let w = thmesStep.innerWidth();
            let h = thmesStep.innerHeight();
            let x = 120/*Math.floor(Math.sqrt((w*h - (w*h)%2)/n))*/;

            //nombre de cases possibles à l'horizontale
            let a = (w - w % x) / x;
            //nombre de cases possibles à la vaerticale
            let b = (h - h % x) / x;
            console.log('a=' + a + '; b=' + b + '; x=' + x + '; n=' + n + '; w=' + w + '; h=' + h);;
            var i = 0;
            let html = '';
            for (let bb = 0; bb < b; bb++) {

                html = html + '<div class="theme-stage">';
                for (let aa = 0; aa < a; aa++) {
                    if (i < n) {
                        let el = this.themes[i];
                        html = html + ('<div class="theme-elem" id="theme-el-' + el.id + '"><div class="theme-image"></div><p>' + el.name + '</p></div>');
                        i++;
                    }

                }
                html = html + ('</div>');

            }
            thmesStep.append(html);
            for (let t of this.themes) {
                $('.screen #theme-el-' + t.id + ' .theme-image').css({ 'background-image': 'url(' + base + 'image/' + t.image + ')' });

            }
            $('.screen .theme-stage').css({
                'width': (a * x) + 'px',
                'height': (x) + 'px'
            });
            $('.screen .theme-elem').css({
                'width': x + 'px',
                'height': x + 'px'
            });


        } else {
            ////on selectionne les themes choisis
            $('.screen .theme-elem').removeClass('theme-selected');

            if (data.themes.length > 0) {
                for (let t of data.themes) {
                    $('.screen #theme-el-' + t).addClass('theme-selected');
                }
            }
        }
    }
    
    showGame(data) {
        if (data.step != this.step) {
            this.step = data.step;
            this.playMusic('question.mp3');
        } else {
            
            //affichage ou lecture de contenu supplémentaire
            if (data.question != null) {
                let quest = data.question.quest;

                let tabquest = quest.split('/');
                console.log("more: " + data.more + ", " + tabquest.length);
                if (tabquest.length == 2 && data.more) {
                    let more = tabquest[1];
                    $('.screen #quest-more').show();
                    $('.screen #quest-more').html('');
                    switch (parseInt(data.question.type)) {
                        case 2: //choix multiple
                            let mul = more.split(';');
                            let list = '<ul>';
                            for (let m of mul) {
                                list += '<li>' + m + '</li>';
                            }
                            list += '</ul>';
                            $('.screen #quest-more').html(list);
                            break;
                        case 3: //image
                            //on affiche l'image
                            let img = '<img src="' + base + 'image/' + more + '">';
                            $('.screen #quest-more').html(img);
                            break
                        case 4: //musique
                            //on joue la musique
                            this.playMusic(more)
                            break;
                    }
                }else {
                    $('.screen #quest-more').hide();
                    $('.screen #quest-quest-bloc').hide();
                }

                /*if (this.quest.quest != data.question.quest) {
                    //this.playMusic('question.mp3');
                    this.quest = data.q;
                }*/

            }
            if (data.buzzing != null) { //un joueur a buzzé

                let color = data.buzzing.color;
                let pName = data.buzzing.name;
                //activation de l'effet sonore pour un nouveau buzz
                if (this.buzzing==null) {
                    console.log("buzz!");
                    this.playMusic('buzz.mp3');
                }
                //enregistre le joueur
                $('.screen #quest-buzz').show();
                $('.screen #quest-buzz').css({
                    border: '3px solid ' + color,
                    backgroundColor: color,
                    color: color
                });
                $('.screen #quest-buzz').html('<p>' + pName + '</p>');
                $('.screen #quest-buzz p').css({
                    color: color,
                });               
                this.buzzing = data.buzzing;

            } else { //pas de buzz
                $('.screen #quest-buzz').hide();
                this.buzzing = null;
                
                
            }
            //màj de la barre de buzz
            
            //affiche les joueurs avec leur score
            $('.screen footer').html('');
            let htmlp = '<div class="playerscore">';

            for (let p of data.players) {
                if (p.name != "") {
                    let fontr = "";
                    if (p.color == "#FFFFFF") fontr = "color:black;";
                    htmlp += '<div class="playscore"><div class="playcolor" style="background-color: ' + p.color + ';' + fontr + '"><p>' + p.score + '</p></div></div>'
                }
            }
            htmlp += '</div>';
            $('.screen footer').html(htmlp);
        }
    }

    showWriteAnswer(answer) {
        console.log(answer);
        $('.screen #right-answer').show();
        $('.screen #right-answer p').html(answer);
        window.setTimeout(() => {
            $('.screen #right-answer').hide();
            this.playMusic('question.mp3');
        }, 8000);


    }

    showQuestion(question) {
        $('.screen #quest-quest-bloc').show();
        $('.screen #quest-quest-bloc p').html(question);
    }

    showWrong() {

    }

    showMore() {
        //mettre en place les types de question
    }

    playApplause() {
        let i = this.getRandInt(4);
        this.playMusic('applause' + i + '.mp3');
    }

    playWrong() {
        $("body").css({
            backgroundColor: "red"
        })
        window.setTimeout(()=>{
            $("body").css({
                backgroundColor: "#6db1f2"
            })
        }, 4000)
        let i = this.getRandInt(2);
        this.playMusic('wrong' + i + '.mp3');
    }

    playMusic(music) {
        if (this.audio != null && typeof (this.audio) !== 'undefined')
            this.audio.pause();
        this.audio = new Audio('sound/' + music);
        
        this.audio.play();
    }

    getRandInt(max) {
        return Math.floor(Math.random() * Math.floor(max));
    }
}
