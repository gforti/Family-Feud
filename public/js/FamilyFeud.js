console.clear()

let app = {
    version: 1,
    role: "player",
    socket: io.connect(),
    jsonFile: "../public/data/Questions.json",
    currentQ: 0,
    getCurrentQ: () => app.currentQ,
    wrong: 0,
    againSound: new Audio(`../public/fx/again.mp3`),
    flipCardSound: new Audio(`../public/fx/flip.mp3`),
    introSound: new Audio(`../public/fx/intro.mp3`),
    newSurveySound: new Audio(`../public/fx/new.m4a`),
    pointsSound: new Audio(`../public/fx/points.mp3`),
    strikeSound: new Audio(`../public/fx/strike.wav`),
    starShine: $('#starshine'),
    starShine2: $('#starshine2'),
    board: $(`<div class='gameBoard'>

                <!--- Scores --->
                <div class='score' id='boardScore'>0</div>
                <div class='score' id='team1' >0</div>
                <div class='score' id='team2' >0</div>

                <!--- Main Board --->
                <div id='middleBoard'>

                    <!--- Question --->
                    <div class='questionHolder'>
                        <span class='question'></span>
                    </div>

                    <!--- Answers --->
                    <div class='colHolder'>
                    </div>

                </div>
                <!--- Wrong --->
                <div class='wrongX wrongBoard'>
                    <img alt="not on board" src="/public/img/Wrong.svg"/>
                    <img alt="not on board" src="/public/img/Wrong.svg"/>
                    <img alt="not on board" src="/public/img/Wrong.svg"/>
                </div>

                <!--- Buttons --->
                <div class='btnHolder hide' id="host">
                    <div id='hostBTN'     class='button'>Be the host</div>
                    <div id='awardTeam1'  class='button' data-team='1'>Award Team 1</div>
                    <div id='newQuestion' class='button'>New Question</div>
                    <div id='againSound' class='button'>Again 🔈</div>
                    <div class='button flex-col'>
                        <span>Points</span>
                        <label for="doublePoints"><input id="doublePoints" type="checkbox" />X2</label>
                        <label for="tripplePoints"><input id="tripplePoints" type="checkbox" />X3</label>
                    </div>
                    <div id="wrong1"       class='button wrongX'>
                        <img alt="not on board" src="/public/img/Wrong.svg"/>
                    </div>
                    <div id="wrong2"       class='button wrongX'>
                        <img alt="not on board" src="/public/img/Wrong.svg"/>
                    </div>
                    <div id="wrong3"       class='button wrongX'>
                        <img alt="not on board" src="/public/img/Wrong.svg"/>
                    </div>
                    <div id='awardTeam2'  class='button' data-team='2' >Award Team 2</div>
                </div>

                </div>`),

    // Utility functions
    shuffle: (array) => {
        let currentIndex = array.length,
            temporaryValue, randomIndex;

        while (0 !== currentIndex) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }
        return array;
    },
    jsonLoaded: (data) => {
        app.allData = data;
        app.questions = Object.keys(data);
        app.makeQuestion(-1);
        app.board.find('.host').hide();
        $('body').append(app.board);
    },

    // Action functions
    makeQuestion: (eNum) => {
        if(eNum > -1) {
            app.newSurveySound.play()
        }
        let qText = app.questions[eNum] ?? '';
        let qAnswr = app.allData[qText] ?? '';

        let qNum = qAnswr.length;
        qNum = (qNum < 8) ? 8 : qNum;
        qNum = (qNum % 2 != 0) ? qNum + 1 : qNum;

        let boardScore = app.board.find("#boardScore");
        let question = app.board.find(".question");
        let holderMain = app.board.find(".colHolder");

        boardScore.html(0);
        question.html(qText.replace(/&x22;/gi, '"'));
        holderMain.empty();

        app.wrong = 0;
        let wrong = app.board.find(".wrongBoard")
        $(wrong).find("img").hide()
        $(wrong).hide()

        qNum = 8

        for (var i = 0; i < qNum; i++) {
            let aLI;
            if (qAnswr[i]) {
                aLI = $(`<div class='cardHolder'>
                            <div class='card' data-id='${i}'>
                                <div class='front'>
                                    <span class='DBG'>${(i + 1)}</span>
                                    <span class='answer'>${qAnswr[i][0]}</span>
                                </div>
                                <div class='back DBG'>
                                    <span>${qAnswr[i][0]}</span>
                                    <b class='LBG'>${qAnswr[i][1]}</b>
                                </div>
                            </div>
                        </div>`)
            } else {
                aLI = $(`<div class='cardHolder empty'><div></div></div>`)
            }

            let parentDiv = holderMain//(i < (qNum / 2)) ? col1 : col2;
            aLI.on('click', {
                trigger: 'flipCard',
                num: i
            }, app.talkSocket);
            $(aLI).appendTo(parentDiv)
            $('.cardHolder').hide().show('slow')
        }

        let cardHolders = app.board.find('.cardHolder');
        let cards = app.board.find('.card');
        let backs = app.board.find('.back');
        let cardSides = app.board.find('.card>div');

        TweenLite.set(cardHolders, {
            perspective: 800
        });
        TweenLite.set(cards, {
            transformStyle: "preserve-3d"
        });
        TweenLite.set(backs, {
            rotationX: 180
        });
        TweenLite.set(cardSides, {
            backfaceVisibility: "hidden"
        });
        cards.data("flipped", false);
    },
    getBoardScore: () => {
        let cards = app.board.find('.card');
        let boardScore = app.board.find('#boardScore');
        let currentScore = {
            var: boardScore.html()
        };
        let score = 0;

        function tallyScore() {
            if ($(this).data("flipped")) {
                let value = $(this).find("b").html();
                score += parseInt(value)
            }
        }
        $.each(cards, tallyScore);
        TweenMax.to(currentScore, 1, {
            var: score,
            onUpdate: function () {
                boardScore.html(Math.round(currentScore.var));
            },
            ease: Power3.easeOut
        });
    },
    getTeamPoints: (num) => {
        let boardScore = app.board.find('#boardScore');
        let currentScore = parseInt(boardScore.html())
        const doublePoints = !!app.board.find('#doublePoints').is(':checked')
        const tripplePoints = !!app.board.find('#tripplePoints').is(':checked')
        if(tripplePoints){
            currentScore = currentScore * 3
        } else if(doublePoints){
            currentScore = currentScore * 2
        } 
        let team = app.board.find("#team" + num);
        let teamScore = parseInt(team.html())
        return {teamScore, currentScore}
    },
    awardPoints: (num, points) => {
        let boardScore = app.board.find('#boardScore');
        let currentScore = {
            var: parseInt(points.currentScore)
        };
        let team = app.board.find("#team" + num);
        let teamScore = {
            var: parseInt(points.teamScore)
        };
        if(currentScore.var > 0) {
            app.pointsSound.play()
            app.starShine2.show()
            setTimeout(() => {
                app.starShine2.hide()
            }, 4000)
        }
        let teamScoreUpdated = (teamScore.var + currentScore.var);
        TweenMax.to(teamScore, 1, {
            var: teamScoreUpdated,
            onUpdate: function () {
                team.html(Math.round(teamScore.var));
            },
            ease: Power3.easeOut
        });

        TweenMax.to(currentScore, 1, {
            var: 0,
            onUpdate: function () {
                boardScore.html(Math.round(currentScore.var));
            },
            ease: Power3.easeOut
        });
    },
    changeQuestion: (currentQ) => {
        app.makeQuestion(currentQ);
        if(app.isHost()) {
            app.currentQ = (app.currentQ + 1) % app.questions.length;
        }
    },
    isHost: () => app.role === 'host',
    makeHost: () => {
        app.role = "host";
        app.board.find(".hide").removeClass('hide');
        app.board.addClass('showHost');
        app.closeIntro()
        app.socket.emit("talking", {
            trigger: 'hostAssigned'
        });
    },
    flipCard: (n) => {
        console.log("card");
        console.log(n);
        let card = $('[data-id="' + n + '"]');
        let flipped = $(card).data("flipped");
        if(undefined !== flipped && !flipped) {
            app.flipCardSound.play()
        }
        let cardRotate = (flipped) ? 0 : -180;
        TweenLite.to(card, 1, {
            rotationX: cardRotate,
            ease: Back.easeOut
        });
        flipped = !flipped;
        $(card).data("flipped", flipped);
        app.getBoardScore()
    },
    wrongAnswer: (x) => {
        app.strikeSound.play()
        app.wrong = x
        let wrong = app.board.find(".wrongBoard")
        $(wrong).find("img").hide()
        for (let i = 1; i <= x; i++) {
            $(wrong).find(`img:nth-child(${i})`).show()
        }
        $(wrong).show()
        setTimeout(() => {
            $(wrong).hide()
        }, 1000);

    },

    // Socket Test
    talkSocket: (e) => {
        if (app.isHost() || e.data?.trigger?.toLowerCase().includes('intro')) {
            app.socket.emit("talking", e.data)
        }
    },
    listenSocket: (data) => {
        switch (data.trigger) {
            case "newQuestion":
                app.changeQuestion(data.currentQ);
                break;
            case "awardTeam1":
                app.awardPoints(1, data.points);
                break;
            case "awardTeam2":
                app.awardPoints(2, data.points);
                break;
            case "flipCard":
                app.flipCard(data.num);
                break;
            case "hostAssigned":
                app.board.find('#hostBTN').remove();
                app.closeIntro()
                break;
            case "wrong1":
                app.wrongAnswer(1)
                break;
            case "wrong2":
                app.wrongAnswer(2)
                break;
            case "wrong3":
                app.wrongAnswer(3)
                break;
            case "clearBoard":
                app.makeQuestion(-1)
                break;
            case "clearScores":
                app.board.find("#team1").html("0")
                app.board.find("#team2").html("0")
                break;
            case "toggleIntroMusic":
                if(app.introSound.paused) {
                    app.introSound.play()
                    app.introSound.currentTime = 0
                } else {
                    app.introSound.pause()
                }
                break;
            case "toggleIntro":
                app.toggleIntro()
                break;
            case "againSound":
                app.againSound.play()
                break;
        }
    },

    closeIntro: () => {
        app.starShine.hide('slow')
    },
    toggleIntro: () => {
        app.starShine.toggle('slow')
    },

    // Inital function
    init: () => {

        $.getJSON(app.jsonFile, app.jsonLoaded);

        app.board.find('#hostBTN').on('click', app.makeHost);
        app.board.find('#awardTeam1').on('click', () => { 
            app.talkSocket({ data: { trigger: 'awardTeam1', points: app.getTeamPoints(1) } })
        });
        app.board.find('#awardTeam2').on('click', () => { 
            app.talkSocket({ data: { trigger: 'awardTeam2', points: app.getTeamPoints(2) } })
        });
        app.board.find('#newQuestion').on('click',() => {
            app.talkSocket({ data: { trigger: 'newQuestion', currentQ: app.getCurrentQ() } })
        });
        app.board.find('#againSound').on('click', { trigger: 'againSound' }, app.talkSocket);
        app.board.find('#wrong1').on('click', { trigger: 'wrong1' }, app.talkSocket);
        app.board.find('#wrong2').on('click', { trigger: 'wrong2' }, app.talkSocket);
        app.board.find('#wrong3').on('click', { trigger: 'wrong3' }, app.talkSocket);

        app.socket.on('listening', app.listenSocket)


        let template = $('#starshine .template.shine'),
            template2 = $('#starshine2 .template.shine'),
            stars = 10,
            sparkle = 10;


        let size = 'large';
        let createStar = function (temp, star, sparkle) {
            temp.clone().removeAttr('id').css({
                top: (Math.random() * 100) + '%',
                left: (Math.random() * 100) + '%',
                webkitAnimationDelay: (Math.random() * sparkle) + 's',
                mozAnimationDelay: (Math.random() * sparkle) + 's'
            }).addClass(size).appendTo(star);
        };

        for (var i = 0; i < stars; i++) {
            createStar(template, app.starShine, sparkle);
            createStar(template2, app.starShine2, 0);
        }

        app.starShine2.hide()


        //hotKey
        document.addEventListener('keydown', e => {
            if (e.key.toLowerCase() === 's') {
                e.preventDefault();
                e.stopPropagation();
                app.makeHost()
            }
            if (e.key.toLowerCase() === 'c') {
                e.preventDefault();
                e.stopPropagation();
                if(app.isHost() && confirm('Clear the board?')) {
                    app.talkSocket({ data: { trigger: 'clearBoard' } })
                }
            }
            if (e.key.toLowerCase() === 'm') {
                e.preventDefault();
                e.stopPropagation();
                app.talkSocket({ data: { trigger: 'toggleIntroMusic' } })                    
            }
            if (e.key.toLowerCase() === 'i') {
                e.preventDefault();
                e.stopPropagation();
                app.talkSocket({ data: { trigger: 'toggleIntro' } }) 
            }
            if (e.key.toLowerCase() === 'n') {
                e.preventDefault();
                e.stopPropagation();
                if(app.isHost() && confirm('start New game?')) {
                    app.talkSocket({ data: { trigger: 'clearScores' } })
                }
            }
        })
    }
};
app.init();